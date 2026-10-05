import type { Category } from "./sites";

export type SearchLink = { name: string; url: string; viaGoogle?: boolean };

const enc = encodeURIComponent;
const plus = (q: string) => enc(q).replace(/%20/g, "+");

// Sites whose own search takes a plain keyword in the link.
const DIRECT: Record<string, (q: string) => string> = {
  Chrono24: (q) => `https://www.chrono24.com.au/search/index.htm?query=${plus(q)}`,
  "eBay AU": (q) => `https://www.ebay.com.au/sch/i.html?_nkw=${plus(q)}&LH_PrefLoc=1`,
  Gumtree: (q) => `https://www.gumtree.com.au/s-${plus(q)}/k0`,
  "Facebook Marketplace": (q) => `https://www.facebook.com/marketplace/search/?query=${enc(q)}`,
};

// Sites whose search needs filters a link can't spell reliably, so these search them through Google.
const VIA_GOOGLE: Record<string, string> = {
  carsales: "carsales.com.au",
  Drive: "drive.com.au",
  Autotrader: "autotrader.com.au",
  Pickles: "pickles.com.au",
  "realestate.com.au": "realestate.com.au",
  Domain: "domain.com.au",
  Homely: "homely.com.au",
  Allhomes: "allhomes.com.au",
  "Watch Vault": "watchvault.com.au",
  Zaeger: "zaeger.com.au",
  "Hailwood Peters": "hailwoodpeters.com.au",
};

const BY_CATEGORY: Record<Category, string[]> = {
  watches: ["Chrono24", "Watch Vault", "Zaeger", "Hailwood Peters", "eBay AU", "Gumtree", "Facebook Marketplace"],
  cars: ["carsales", "Drive", "Autotrader", "Pickles", "Gumtree", "Facebook Marketplace", "eBay AU"],
  property: ["realestate.com.au", "Domain", "Homely", "Allhomes"],
  other: ["eBay AU", "Gumtree", "Facebook Marketplace"],
};

/** One-tap searches on each Australian site for a category. */
export function searchLinks(query: string, category: Category): SearchLink[] {
  const q = query.trim();
  if (!q) return [];
  return BY_CATEGORY[category].map((name) =>
    DIRECT[name]
      ? { name, url: DIRECT[name](q) }
      : { name, url: `https://www.google.com.au/search?q=${plus(`site:${VIA_GOOGLE[name]} ${q}`)}`, viaGoogle: true },
  );
}
