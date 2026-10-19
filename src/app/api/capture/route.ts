import { captureKey } from "@/lib/auth";
import { extractListing } from "@/lib/extract";
import { findUrl } from "@/lib/listings";

/**
 * Used by the iPhone "TSL from apps" Shortcut. Apps like Chrono24 and Domain only share a link, so the
 * Shortcut downloads the page on the phone (which sites don't block the way they block TSL's server)
 * and posts the HTML here. We read the listing out of it and answer with the TSL link to open.
 */
export async function POST(request: Request) {
  const self = new URL(request.url);
  if (self.searchParams.get("key") !== (await captureKey())) {
    return new Response("This Shortcut's TSL link is out of date. Copy it again from the Save to TSL page.", { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : "";
  };
  const url = findUrl(field("url"));
  const add = new URL("/add", self.origin);
  if (!url) return new Response(add.href, { headers: { "content-type": "text/plain" } });
  add.searchParams.set("url", url);

  // The Shortcut sends the page as a file; plain text works too.
  const page = form?.get("html");
  const html = typeof page === "string" ? page : page ? await page.slice(0, 3_000_000).text() : "";
  if (html) {
    const found = extractListing(html, url);
    const price = found.price != null ? String(found.price) : (found.priceText ?? "");
    if (found.imageUrl || found.price != null) {
      for (const [key, value] of [
        ["title", found.title ?? ""],
        ["image", found.imageUrl ?? ""],
        ["price", price],
        ["currency", found.currency ?? ""],
      ]) {
        if (value) add.searchParams.set(key, value.slice(0, 500));
      }
    }
  }
  return new Response(add.href, { headers: { "content-type": "text/plain" } });
}
