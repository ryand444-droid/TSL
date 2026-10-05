"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Listing } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, formatPrice, type Category } from "@/lib/sites";
import { SearchIcon } from "./icons";
import { Thumb } from "./Thumb";
import { VsMarket } from "./VsMarket";

type Item = Pick<Listing, "id" | "title" | "imageUrl" | "price" | "currency" | "priceText" | "site" | "category" | "notes"> & {
  vsMarket: number | null;
};

export function ListingList({ items }: { items: Item[] }) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const item of items) c[item.category] = (c[item.category] ?? 0) + 1;
    return c;
  }, [items]);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      words.every((w) => `${item.title} ${item.site} ${item.notes ?? ""}`.toLowerCase().includes(w)),
  );

  return (
    <>
      <label className="search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search brand, model, suburb"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search saved listings"
        />
      </label>
      <div className="chips">
        <button className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
          All<em>{items.length}</em>
        </button>
        {CATEGORIES.filter((c) => c !== "other" || counts.other).map((c) => (
          <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_LABELS[c]}
            <em>{counts[c] ?? 0}</em>
          </button>
        ))}
      </div>
      <div className="gallery">
        {shown.map((item) => (
          <Link key={item.id} href={`/listing/${item.id}`} className="card">
            <Thumb imageUrl={item.imageUrl} category={item.category} />
            <div className="card-body">
              <span className="src">{item.site}</span>
              <b>{item.title}</b>
              <span className={`price${item.price == null && !item.priceText ? " none" : ""}`}>
                {formatPrice(item.price, item.currency, item.priceText)}
              </span>
              <VsMarket diff={item.vsMarket} />
            </div>
          </Link>
        ))}
      </div>
      {shown.length === 0 && <p className="hint" style={{ padding: "24px 0", textAlign: "center" }}>Nothing matches that search.</p>}
    </>
  );
}
