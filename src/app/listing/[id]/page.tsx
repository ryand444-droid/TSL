import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { Thumb } from "@/components/Thumb";
import { VsMarket } from "@/components/VsMarket";
import { getListing } from "@/lib/listings";
import { latestMarketCheck, versusMarket } from "@/lib/market";
import { searchLinks } from "@/lib/search-links";
import { CATEGORIES, CATEGORY_LABELS, formatPrice, isCategory, siteName } from "@/lib/sites";
import { editListing, removeListing } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: PageProps<"/listing/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const item = Number.isInteger(id) ? await getListing(id) : undefined;
  if (!item) notFound();

  const hasPrice = item.price != null || item.priceText;
  const market = await latestMarketCheck(item.id);
  const links = searchLinks(item.title, isCategory(item.category) ? item.category : "other");
  const searchHere = links.find((l) => l.name === item.site) ?? links[0];
  const saved = item.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="page">
      <div className="topline">
        <Link href="/" className="iconbtn plain" aria-label="Back">
          <BackIcon />
        </Link>
      </div>
      <Thumb imageUrl={item.imageUrl} category={item.category} hero />
      <div>
        <div className="src">
          {item.site} · {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? "Other"} · Saved {saved}
        </div>
        <h1 className="dtitle">{item.title}</h1>
      </div>
      <div className={`bigprice${hasPrice ? "" : " none"}`}>
        {hasPrice ? formatPrice(item.price, item.currency, item.priceText) : "No price found"}
      </div>
      <section className="market stack">
        <span className="src">Market</span>
        {market ? (
          <>
            <VsMarket diff={versusMarket(item.price, market)} />
            <p className="hint">
              Typical asking price {formatPrice(market.median, "AUD")} from {market.count} listings on{" "}
              {siteName(new URL(market.sourceUrl).hostname)}, ranging {formatPrice(market.low, "AUD")} to {formatPrice(market.high, "AUD")}.
              Checked {market.createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}.
            </p>
            <p className="hint">
              <a href={market.sourceUrl} target="_blank" rel="noopener noreferrer">
                Open that search
              </a>{" "}
              and press Save to TSL to update it.
            </p>
          </>
        ) : (
          <p className="hint">
            See how this compares: search like-for-like (same model, size and colour), then press Save to TSL on the results page.
            {searchHere && (
              <>
                {" "}
                <a href={searchHere.url} target="_blank" rel="noopener noreferrer">
                  Search {searchHere.name}
                </a>
              </>
            )}
          </p>
        )}
      </section>
      {item.notes && <p style={{ margin: 0 }}>{item.notes}</p>}
      {item.fetchError && (
        <div className="notice">
          <b>{item.site} didn&apos;t share the details.</b> {item.fetchError} Add the title and price below so it shows properly in your
          list.
        </div>
      )}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn">
        Open on {item.site}
      </a>
      <details className="edit" open={!!item.fetchError}>
        <summary>Edit details</summary>
        <form action={editListing.bind(null, item.id)} className="stack">
          <label className="field">
            <span>Title</span>
            <input name="title" defaultValue={item.title} required />
          </label>
          <div className="fields2">
            <label className="field">
              <span>Price</span>
              <input
                name="price"
                inputMode="decimal"
                placeholder="e.g. 17450 or Auction"
                defaultValue={item.price ?? item.priceText ?? ""}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue={item.category}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Notes</span>
            <textarea name="notes" rows={2} defaultValue={item.notes ?? ""} placeholder="Location, condition, anything to remember" />
          </label>
          <button className="btn ghost">Save changes</button>
        </form>
      </details>
      <form action={removeListing.bind(null, item.id)}>
        <button className="btn danger">Remove from list</button>
      </form>
    </main>
  );
}
