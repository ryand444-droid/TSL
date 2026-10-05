import type { Listing } from "@/lib/db";
import type { MarketStats } from "@/lib/market";
import { formatPrice, siteName } from "@/lib/sites";
import { addMarketCheck } from "../actions";

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
}

/** The saved listing whose title shares the most words with the search page, e.g. "datejust", "36", "blue". */
function bestMatch(items: Listing[], pageTitle: string, host: string): Listing | undefined {
  const page = new Set(words(pageTitle));
  let best: Listing | undefined;
  let bestScore = -1;
  for (const item of items) {
    const score = words(item.title).filter((w) => page.has(w)).length + (item.host === host ? 0.5 : 0);
    if (score > bestScore) [best, bestScore] = [item, score];
  }
  return best;
}

export function MarketPanel({
  stats,
  pageUrl,
  pageTitle,
  prices,
  items,
}: {
  stats: MarketStats;
  pageUrl: string;
  pageTitle: string;
  prices: string;
  items: Listing[];
}) {
  const host = new URL(pageUrl).hostname;
  const site = siteName(host);
  const match = bestMatch(items, pageTitle, host);
  return (
    <section className="market stack">
      <span className="src">Market prices on {site}</span>
      <div className="market-figure">{formatPrice(stats.median, "AUD")}</div>
      <p className="hint">
        Typical asking price from {stats.count} listings on this page, ranging {formatPrice(stats.low, "AUD")} to{" "}
        {formatPrice(stats.high, "AUD")}.
      </p>
      {items.length > 0 ? (
        <form action={addMarketCheck} className="stack">
          <input type="hidden" name="url" value={pageUrl} />
          <input type="hidden" name="label" value={pageTitle} />
          <input type="hidden" name="prices" value={prices} />
          <label className="field">
            <span>Compare with</span>
            <select name="listingId" defaultValue={match?.id}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <button className="btn">Save market prices</button>
        </form>
      ) : (
        <p className="hint">Save the listing you&apos;re interested in first, then come back to this search and press Save to TSL again.</p>
      )}
      <p className="hint">For a true like-for-like figure, filter the search first, e.g. model, size and dial colour.</p>
    </section>
  );
}
