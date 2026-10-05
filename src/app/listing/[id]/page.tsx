import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { Thumb } from "@/components/Thumb";
import { getListing } from "@/lib/listings";
import { CATEGORIES, CATEGORY_LABELS, formatPrice } from "@/lib/sites";
import { editListing, removeListing } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: PageProps<"/listing/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const item = Number.isInteger(id) ? await getListing(id) : undefined;
  if (!item) notFound();

  const hasPrice = item.price != null || item.priceText;
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
