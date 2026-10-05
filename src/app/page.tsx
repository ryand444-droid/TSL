import Link from "next/link";
import { ListingList } from "@/components/ListingList";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { DbSetupError } from "@/lib/db";
import { allListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  let items;
  try {
    items = await allListings();
  } catch (err) {
    if (err instanceof DbSetupError) return <DbProblem error={err} />;
    throw err;
  }
  const sites = new Set(items.map((i) => i.site)).size;
  return (
    <main className="page wide">
      <div className="topline">
        <div className="logo">
          TSL
          <small>
            {items.length} saved · {sites} {sites === 1 ? "site" : "sites"}
          </small>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/find" className="iconbtn plain" aria-label="Find listings">
            <SearchIcon />
          </Link>
          <Link href="/add" className="iconbtn" aria-label="Add a listing">
            <PlusIcon />
          </Link>
        </div>
      </div>
      <hr className="rule" />
      {items.length === 0 ? (
        <div className="empty">
          <b>Nothing saved yet</b>
          <span>Copy a listing&apos;s link from Chrono24, carsales, realestate.com.au or any other site, then tap +.</span>
          <Link href="/add" className="btn" style={{ maxWidth: 240 }}>
            Add a listing
          </Link>
        </div>
      ) : (
        <ListingList
          items={items.map(({ id, title, imageUrl, price, currency, priceText, site, category, notes }) => ({
            id, title, imageUrl, price, currency, priceText, site, category, notes,
          }))}
        />
      )}
      <p className="hint" style={{ textAlign: "center" }}>
        Missing photos or prices? <Link href="/save">Set up the Save to TSL button</Link>.
      </p>
    </main>
  );
}

function DbProblem({ error }: { error: DbSetupError }) {
  return (
    <main className="page">
      <div className="topline">
        <div className="logo">TSL</div>
      </div>
      <div className="empty">
        <b>Can&apos;t reach the database</b>
        <span>{error.message}</span>
        {error.target && (
          <span>
            The saved link points to: <code>{error.target}</code>
          </span>
        )}
        <span>After changing DATABASE_URL in Vercel, redeploy, then reload this page.</span>
      </div>
    </main>
  );
}
