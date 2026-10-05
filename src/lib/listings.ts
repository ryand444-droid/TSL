import { desc, eq } from "drizzle-orm";
import { getDb, listings, priceHistory, type Listing } from "./db";
import { extractListing, type ExtractedListing } from "./extract";
import { assertPublicUrl, fetchPage, FetchPageError } from "./fetch-page";
import { guessCategory, siteName, type Category } from "./sites";

export async function allListings(): Promise<Listing[]> {
  const db = await getDb();
  return db.select().from(listings).orderBy(desc(listings.createdAt));
}

export async function getListing(id: number): Promise<Listing | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(listings).where(eq(listings.id, id));
  return row;
}

/** Pulls a link out of shared text, e.g. "Check this out https://..." from the iOS share sheet. */
export function findUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0].replace(/[).,]+$/, "") : null;
}

export function titleFromUrl(url: URL): string {
  // The most word-like part of the path, e.g. "2023-toyota-landcruiser-300" rather than an ad id.
  const parts = url.pathname
    .split("/")
    .map((p) => decodeURIComponent(p).replace(/\.\w+$/, "").replace(/--?id\d+$/i, ""));
  const best = parts.sort((a, b) => (b.match(/[a-z]{3,}/gi)?.length ?? 0) - (a.match(/[a-z]{3,}/gi)?.length ?? 0))[0] ?? "";
  const words = best.replace(/[-_+]+/g, " ").trim();
  return words.length > 3 ? words.charAt(0).toUpperCase() + words.slice(1) : url.hostname;
}

/**
 * Saves a listing by link. `captured` is what the "Save to TSL" bookmark or Shortcut read in the person's
 * own browser; without it the page is fetched here. If the site blocks that, the item is still saved,
 * titled from its link, and the error is kept so the page can ask for the details to be filled in by hand.
 */
export async function saveListing(
  rawUrl: string,
  captured: ExtractedListing | null = null,
): Promise<{ id: number; existing: boolean }> {
  const url = await assertPublicUrl(rawUrl.trim());
  url.hash = "";
  const db = await getDb();

  const [existing] = await db.select().from(listings).where(eq(listings.url, url.toString()));
  if (existing) {
    if (captured) await refreshFromCapture(existing, captured);
    return { id: existing.id, existing: true };
  }

  let extracted = captured;
  let fetchError: string | null = null;
  let finalUrl = url.toString();
  if (!extracted) {
    try {
      const page = await fetchPage(url.toString());
      finalUrl = page.finalUrl;
      extracted = extractListing(page.html, page.finalUrl);
    } catch (err) {
      fetchError = err instanceof FetchPageError ? err.message : "The site couldn't be reached.";
    }
  }

  const host = new URL(finalUrl).hostname;
  const title = extracted?.title ?? titleFromUrl(url);
  const [row] = await db
    .insert(listings)
    .values({
      url: url.toString(),
      title,
      imageUrl: extracted?.imageUrl ?? null,
      price: extracted?.price ?? null,
      currency: extracted?.currency ?? (extracted?.price != null ? "AUD" : null),
      priceText: extracted?.priceText ?? null,
      site: siteName(host, extracted?.siteName),
      host,
      category: guessCategory(host, title),
      fetchError,
    })
    .onConflictDoNothing({ target: listings.url })
    .returning({ id: listings.id });

  if (!row) {
    // Saved twice at the same moment, e.g. a double tap.
    const [again] = await db.select({ id: listings.id }).from(listings).where(eq(listings.url, url.toString()));
    return { id: again.id, existing: true };
  }
  if (extracted && (extracted.price != null || extracted.priceText)) {
    await db.insert(priceHistory).values({ listingId: row.id, price: extracted.price, priceText: extracted.priceText });
  }
  return { id: row.id, existing: false };
}

/** Saving a listing again with the bookmark fills in its photo and records a new price. */
async function refreshFromCapture(before: Listing, captured: ExtractedListing): Promise<void> {
  const db = await getDb();
  const priceChanged =
    (captured.price != null || captured.priceText != null) &&
    (captured.price !== before.price || captured.priceText !== before.priceText);
  await db
    .update(listings)
    .set({
      imageUrl: captured.imageUrl ?? before.imageUrl,
      // A title from the page beats one guessed from the link after a blocked fetch.
      title: before.fetchError && captured.title ? captured.title : before.title,
      ...(priceChanged
        ? { price: captured.price, priceText: captured.priceText, currency: captured.currency ?? (captured.price != null ? "AUD" : null) }
        : {}),
      fetchError: null,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, before.id));
  if (priceChanged) {
    await db.insert(priceHistory).values({ listingId: before.id, price: captured.price, priceText: captured.priceText });
  }
}

export async function updateListing(
  id: number,
  fields: { title: string; price: number | null; priceText: string | null; category: Category; notes: string | null },
): Promise<void> {
  const db = await getDb();
  const before = await getListing(id);
  if (!before) return;
  await db
    .update(listings)
    .set({ ...fields, fetchError: null, currency: fields.price != null ? (before.currency ?? "AUD") : before.currency, updatedAt: new Date() })
    .where(eq(listings.id, id));
  if (fields.price !== before.price || fields.priceText !== before.priceText) {
    await db.insert(priceHistory).values({ listingId: id, price: fields.price, priceText: fields.priceText });
  }
}

export async function deleteListing(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(listings).where(eq(listings.id, id));
}
