export const CATEGORIES = ["watches", "cars", "property", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  watches: "Watches",
  cars: "Cars",
  property: "Property",
  other: "Other",
};

type Site = { name: string; category?: Category };

// Australian sites from the build plan. Sites that sell everything (eBay, Gumtree) have no category.
const SITES: Record<string, Site> = {
  "chrono24.com.au": { name: "Chrono24", category: "watches" },
  "chrono24.com": { name: "Chrono24", category: "watches" },
  "zaeger.com.au": { name: "Zaeger", category: "watches" },
  "watchvault.com.au": { name: "Watch Vault", category: "watches" },
  "hailwoodpeters.com.au": { name: "Hailwood Peters", category: "watches" },
  "watchtime.com.au": { name: "Watch Time", category: "watches" },
  "watchfinder.com": { name: "Watchfinder", category: "watches" },
  "watchfinder.com.au": { name: "Watchfinder", category: "watches" },
  "carsales.com.au": { name: "carsales", category: "cars" },
  "drive.com.au": { name: "Drive", category: "cars" },
  "carsguide.com.au": { name: "CarsGuide", category: "cars" },
  "pickles.com.au": { name: "Pickles", category: "cars" },
  "cars24.com.au": { name: "Cars24", category: "cars" },
  "autotrader.com.au": { name: "Autotrader", category: "cars" },
  "realestate.com.au": { name: "realestate.com.au", category: "property" },
  "realcommercial.com.au": { name: "realcommercial", category: "property" },
  "domain.com.au": { name: "Domain", category: "property" },
  "allhomes.com.au": { name: "Allhomes", category: "property" },
  "homely.com.au": { name: "Homely", category: "property" },
  "ebay.com.au": { name: "eBay AU" },
  "gumtree.com.au": { name: "Gumtree" },
  "facebook.com": { name: "Facebook Marketplace" },
};

const KEYWORDS: [Category, RegExp][] = [
  [
    "watches",
    /\b(watch|watches|rolex|omega|tudor|seiko|grand seiko|tag heuer|cartier|breitling|patek|audemars|iwc|longines|panerai|hublot|tissot|chronograph|submariner|speedmaster)\b/i,
  ],
  [
    "property",
    /\b(\d+\s*(bed|bedroom)s?|bath(room)?s?|apartment|townhouse|house|unit|acreage|land for sale|auction|for rent)\b/i,
  ],
  [
    "cars",
    /\b(toyota|ford|holden|mazda|hyundai|kia|nissan|mitsubishi|subaru|volkswagen|vw|bmw|mercedes|audi|porsche|tesla|lexus|honda|isuzu|ute|sedan|hatch|wagon|suv|4x4|\d[\d,]*\s?km)\b/i,
  ],
];

function lookup(host: string): Site | undefined {
  const bare = host.toLowerCase().replace(/^www\.|^m\./, "");
  if (SITES[bare]) return SITES[bare];
  const match = Object.keys(SITES).find((domain) => bare.endsWith(`.${domain}`));
  return match ? SITES[match] : undefined;
}

export function siteName(host: string, fallback?: string | null): string {
  return lookup(host)?.name ?? fallback ?? host.replace(/^www\./, "");
}

/** Picks a category from the site first, then from words in the title. */
export function guessCategory(host: string, title: string | null): Category {
  const fromSite = lookup(host)?.category;
  if (fromSite) return fromSite;
  for (const [category, pattern] of KEYWORDS) {
    if (title && pattern.test(title)) return category;
  }
  return "other";
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function formatPrice(price: number | null, currency: string | null, priceText?: string | null): string {
  if (price == null) return priceText ?? "—";
  const code = currency ?? "AUD";
  const amount = price.toLocaleString("en-AU", { maximumFractionDigits: price % 1 === 0 ? 0 : 2 });
  if (code === "AUD") return `A$${amount}`;
  return `${code} ${amount}`;
}
