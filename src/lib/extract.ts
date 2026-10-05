import * as cheerio from "cheerio";

export type ExtractedListing = {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  priceText: string | null;
  siteName: string | null;
};

type JsonLdNode = Record<string, unknown>;

const PRODUCT_TYPES = new Set([
  "Product",
  "Car",
  "Vehicle",
  "IndividualProduct",
  "Offer",
  "RealEstateListing",
  "SingleFamilyResidence",
  "House",
  "Apartment",
  "Residence",
  "Accommodation",
]);

function clean(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : null;
}

/** Parses "17,450", "A$17,450.00" or "1.45m" into a number. Returns null for text such as "Auction". */
export function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const text = value.replace(/,/g, "");
  // A number after a $ ("Offers over $1.2m"), or text that is only a number ("17450", "AUD 17450"),
  // so dates and the like in "Auction 18 Oct" aren't read as prices.
  const match =
    text.match(/\$\s*(\d+(?:\.\d+)?)\s*(k|m)?\b/i) ??
    text.match(/^\s*(?:(?:aud|usd|nzd|eur|gbp|chf|hkd|sgd)\s*)?(\d+(?:\.\d+)?)\s*(k|m)?\+?\s*(?:aud|usd|nzd|eur|gbp|chf|hkd|sgd)?\s*$/i);
  if (!match) return null;
  let amount = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "k") amount *= 1_000;
  if (unit === "m") amount *= 1_000_000;
  return amount > 0 ? amount : null;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function typesOf(node: JsonLdNode): string[] {
  return asArray(node["@type"] as string | string[]).map(String);
}

function flattenJsonLd(data: unknown): JsonLdNode[] {
  const out: JsonLdNode[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === "object") {
      const node = value as JsonLdNode;
      out.push(node);
      if (node["@graph"]) visit(node["@graph"]);
      if (node.mainEntity) visit(node.mainEntity);
      if (node.itemOffered) visit(node.itemOffered);
    }
  };
  visit(data);
  return out;
}

function imageFromJsonLd(value: unknown): string | null {
  const first = asArray(value as unknown[])[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const url = (first as JsonLdNode).url ?? (first as JsonLdNode).contentUrl;
    return typeof url === "string" ? url : null;
  }
  return null;
}

function offerPrice(node: JsonLdNode): { price: number | null; currency: string | null } {
  for (const offer of asArray(node.offers as JsonLdNode | JsonLdNode[])) {
    if (!offer || typeof offer !== "object") continue;
    const spec = offer.priceSpecification as JsonLdNode | undefined;
    const price = parsePrice(offer.price ?? offer.lowPrice ?? spec?.price);
    if (price != null) {
      const currency = (offer.priceCurrency ?? spec?.priceCurrency) as string | undefined;
      return { price, currency: currency ?? null };
    }
  }
  if (typesOf(node).includes("Offer")) {
    const price = parsePrice(node.price);
    if (price != null) return { price, currency: (node.priceCurrency as string) ?? null };
  }
  return { price: null, currency: null };
}

function absolutise(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

/** Pulls the title, thumbnail and price out of a listing page's HTML. */
export function extractListing(html: string, pageUrl: string): ExtractedListing {
  const $ = cheerio.load(html);
  const meta = (...names: string[]) => {
    for (const name of names) {
      const value = $(`meta[property="${name}"], meta[name="${name}"], meta[itemprop="${name}"]`)
        .first()
        .attr("content");
      if (clean(value)) return clean(value);
    }
    return null;
  };

  let title: string | null = null;
  let imageUrl: string | null = null;
  let price: number | null = null;
  let currency: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    let data: unknown;
    try {
      data = JSON.parse($(el).contents().text());
    } catch {
      return;
    }
    for (const node of flattenJsonLd(data)) {
      if (!typesOf(node).some((t) => PRODUCT_TYPES.has(t))) continue;
      title ??= clean(node.name as string);
      imageUrl ??= imageFromJsonLd(node.image ?? node.photo);
      if (price == null) {
        const offer = offerPrice(node);
        price = offer.price;
        currency = offer.currency;
      }
    }
  });

  title ??= meta("og:title", "twitter:title") ?? clean($("title").first().text());
  imageUrl ??= meta("og:image:secure_url", "og:image", "twitter:image", "twitter:image:src");

  let priceText: string | null = null;
  if (price == null) {
    const metaPrice = meta("product:price:amount", "og:price:amount", "price");
    price = parsePrice(metaPrice);
    currency = meta("product:price:currency", "og:price:currency", "priceCurrency") ?? currency;
  }
  if (price == null) {
    const itemprop = $('[itemprop="price"]').first();
    priceText = clean(itemprop.attr("content") ?? itemprop.text());
    price = parsePrice(priceText);
  }

  return {
    title,
    imageUrl: absolutise(imageUrl, pageUrl),
    price,
    currency: currency ? currency.toUpperCase() : null,
    priceText: price == null ? priceText : null,
    siteName: meta("og:site_name", "application-name"),
  };
}
