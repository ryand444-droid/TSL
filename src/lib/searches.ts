import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, listings, savedSearches, type SavedSearch } from "./db";
import type { Category } from "./sites";

export async function allSearches(): Promise<SavedSearch[]> {
  const db = await getDb();
  return db.select().from(savedSearches).orderBy(desc(savedSearches.createdAt));
}

export async function addSearch(query: string, category: Category): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: savedSearches.id })
    .from(savedSearches)
    .where(and(eq(savedSearches.query, query), eq(savedSearches.category, category)));
  if (!existing) await db.insert(savedSearches).values({ query, category });
}

export async function deleteSearch(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(savedSearches).where(eq(savedSearches.id, id));
}

/** Which of these links are already in the list, so results can show "Saved". */
export async function savedUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const db = await getDb();
  const rows = await db.select({ url: listings.url }).from(listings).where(inArray(listings.url, urls));
  return new Set(rows.map((r) => r.url));
}
