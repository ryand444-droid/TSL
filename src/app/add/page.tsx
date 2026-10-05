import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { allListings, findUrl } from "@/lib/listings";
import { marketStats } from "@/lib/market";
import { MarketPanel } from "./MarketPanel";
import { AddForm, type Captured } from "./AddForm";

export const metadata = { title: "Add a listing" };

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

// Opened with ?url= by the iPhone Shortcut, or with ?text= by Android's Share menu. The "Save to TSL"
// bookmark and Shortcut also pass the title, photo and price they read from the page.
export default async function AddPage({ searchParams }: PageProps<"/add">) {
  const params = await searchParams;
  const shared = ["url", "text", "title"].map((k) => params[k]).filter((v) => typeof v === "string").join(" ");
  const url = findUrl(param(params.url)) ?? findUrl(shared) ?? "";
  const image = param(params.image);
  const captured: Captured | null =
    url && (params.image || params.price)
      ? {
          title: param(params.title).slice(0, 200),
          image: /^https?:\/\//i.test(image) ? image : "",
          price: param(params.price).slice(0, 60),
          currency: param(params.currency).slice(0, 3),
        }
      : null;
  // On a search results page the Save to TSL button also sends every price it found.
  const prices = param(params.prices).slice(0, 4000);
  const stats = url && prices ? marketStats(prices.split("|")) : null;
  const items = stats ? await allListings() : [];

  return (
    <main className="page">
      <div className="topline">
        <Link href="/" className="iconbtn plain" aria-label="Back">
          <BackIcon />
        </Link>
      </div>
      {stats ? (
        <>
          <h1 className="dtitle">Compare with the market</h1>
          <MarketPanel stats={stats} pageUrl={url} pageTitle={param(params.title)} prices={prices} items={items} />
          <details className="edit">
            <summary>Or save this page as a listing</summary>
            <AddForm initialUrl={url} captured={captured} />
          </details>
        </>
      ) : (
        <>
          <h1 className="dtitle">Add a listing</h1>
          <AddForm initialUrl={url} captured={captured} />
        </>
      )}
      {!captured && (
        <p className="hint">
          Photos and prices missing? <Link href="/save">Set up the Save to TSL button</Link> so they come straight from your browser.
        </p>
      )}
    </main>
  );
}
