import Link from "next/link";
import { ListingList } from "@/components/ListingList";
import { PlusIcon } from "@/components/icons";
import { allListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await allListings();
  const sites = new Set(items.map((i) => i.site)).size;
  return (
    <main className="page">
      <div className="topline">
        <div className="logo">
          TSL
          <small>
            {items.length} saved · {sites} {sites === 1 ? "site" : "sites"}
          </small>
        </div>
        <Link href="/add" className="iconbtn" aria-label="Add a listing">
          <PlusIcon />
        </Link>
      </div>
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
    </main>
  );
}
