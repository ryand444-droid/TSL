import { desc, eq } from "drizzle-orm";
import { getDb, marketChecks, type MarketCheck } from "./db";
import { parsePrice } from "./extract";

export type MarketStats = { count: number; median: number; low: number; high: number };

function medianOf(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Typical price from the prices on a search results page. Prices far from the middle (straps, deposits,
 * "from $99 a week", a stray $2m listing) are dropped so they don't drag the figure around.
 */
export function marketStats(raw: string[]): MarketStats | null {
  const values = raw
    .map((v) => parsePrice(v))
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  if (values.length < 5) return null;
  const rough = medianOf(values);
  const kept = values.filter((v) => v >= rough / 3 && v <= rough * 3);
  if (kept.length < 5) return null;
  return { count: kept.length, median: Math.round(medianOf(kept)), low: kept[0], high: kept[kept.length - 1] };
}

/** How far a price sits from the market median, e.g. -0.08 for 8% below. */
export function versusMarket(price: number | null, check: Pick<MarketCheck, "median"> | undefined): number | null {
  if (price == null || !check || check.median <= 0) return null;
  return (price - check.median) / check.median;
}

export async function saveMarketCheck(listingId: number, sourceUrl: string, label: string, stats: MarketStats) {
  const db = await getDb();
  await db.insert(marketChecks).values({ listingId, sourceUrl, label, ...stats });
}

/** The newest market check for each listing. */
export async function latestMarketChecks(): Promise<Map<number, MarketCheck>> {
  const db = await getDb();
  const rows = await db.select().from(marketChecks).orderBy(desc(marketChecks.createdAt));
  const out = new Map<number, MarketCheck>();
  for (const row of rows) if (!out.has(row.listingId)) out.set(row.listingId, row);
  return out;
}

export async function latestMarketCheck(listingId: number): Promise<MarketCheck | undefined> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(marketChecks)
    .where(eq(marketChecks.listingId, listingId))
    .orderBy(desc(marketChecks.createdAt))
    .limit(1);
  return row;
}
