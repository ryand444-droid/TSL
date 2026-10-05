import Link from "next/link";
import { BackIcon, SearchIcon } from "@/components/icons";
import { Thumb } from "@/components/Thumb";
import { ebayConfigured, searchEbay, type SearchResult } from "@/lib/ebay";
import { searchLinks } from "@/lib/search-links";
import { allSearches, savedUrls } from "@/lib/searches";
import { CATEGORIES, CATEGORY_LABELS, formatPrice, guessCategory, isCategory, type Category } from "@/lib/sites";
import { removeSearch, saveResult, saveSearch } from "../actions";

export const metadata = { title: "Find listings" };
export const dynamic = "force-dynamic";

export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const category: Category = isCategory(params.c) ? params.c : q ? guessCategory("", q) : "watches";
  const searches = await allSearches();

  // eBay has no property listings worth showing, so property searches use the site links only.
  let results: SearchResult[] = [];
  let ebayError: string | null = null;
  if (q && category !== "property" && ebayConfigured()) {
    try {
      results = await searchEbay(q);
    } catch (err) {
      console.error(err);
      ebayError = err instanceof Error ? err.message : "eBay search didn't work.";
    }
  }
  const saved = await savedUrls(results.map((r) => r.url));
  const isSaved = searches.some((s) => s.query.toLowerCase() === q.toLowerCase() && s.category === category);

  return (
    <main className="page">
      <div className="topline">
        <Link href="/" className="iconbtn plain" aria-label="Back">
          <BackIcon />
        </Link>
      </div>
      <h1 className="dtitle">Find listings</h1>

      <form action="/find">
        <label className="search">
          <SearchIcon />
          <input name="q" defaultValue={q} placeholder="Brand, model or suburb" autoFocus={!q} enterKeyHint="search" />
        </label>
        <input type="hidden" name="c" value={category} />
      </form>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/find?${new URLSearchParams(q ? { q, c } : { c })}`}
            className="chip"
            aria-pressed={category === c}
            replace
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {searches.length > 0 && (
        <section className="stack">
          <h2 className="src">Saved searches</h2>
          <div className="chips wrap">
            {searches.map((s) => (
              <span key={s.id} className="chip saved">
                <Link href={`/find?q=${encodeURIComponent(s.query)}&c=${s.category}`}>{s.query}</Link>
                <form action={removeSearch.bind(null, s.id)}>
                  <button aria-label={`Remove ${s.query}`}>×</button>
                </form>
              </span>
            ))}
          </div>
        </section>
      )}

      {q && (
        <>
          {!isSaved && (
            <form action={saveSearch}>
              <input type="hidden" name="q" value={q} />
              <input type="hidden" name="c" value={category} />
              <button className="btn ghost">Save this search</button>
            </form>
          )}

          {results.length > 0 && (
            <section className="stack">
              <h2 className="src">Newest on eBay</h2>
              <div className="list">
                {results.map((r) => (
                  <div key={r.url} className="row">
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <Thumb imageUrl={r.imageUrl} category={category} />
                    </a>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="meta">
                      <b>{r.title}</b>
                      <span>
                        {formatPrice(r.price, r.currency)}
                        {r.location ? ` · ${r.location}` : ""}
                      </span>
                    </a>
                    {saved.has(r.url) ? (
                      <span className="price none">Saved</span>
                    ) : (
                      <form action={saveResult}>
                        {(
                          [
                            ["url", r.url],
                            ["title", r.title],
                            ["image", r.imageUrl ?? ""],
                            ["price", r.price ?? ""],
                            ["currency", r.currency ?? ""],
                          ] as const
                        ).map(([k, v]) => (
                          <input key={k} type="hidden" name={k} value={String(v)} />
                        ))}
                        <button className="chip">Save</button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {ebayError && <p className="error">{ebayError}</p>}

          <section className="stack">
            <h2 className="src">Search each site</h2>
            <div className="sitelinks">
              {searchLinks(q, category).map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="sitelink">
                  <b>{link.name}</b>
                  {link.viaGoogle && <span>via Google</span>}
                </a>
              ))}
            </div>
            <p className="hint">Found one you like? Open it and use your Save to TSL button to add it with its photo and price.</p>
          </section>
        </>
      )}
    </main>
  );
}
