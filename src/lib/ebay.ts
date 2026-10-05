/**
 * eBay's free Browse API, used for listing search inside TSL. Needs EBAY_CLIENT_ID and EBAY_CLIENT_SECRET
 * from a free eBay developer account (production keys). Without them, search shows site links only.
 */
export type SearchResult = {
  url: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  site: string;
};

// EBAY_API_BASE can point at eBay's sandbox (https://api.sandbox.ebay.com) for testing.
const API = process.env.EBAY_API_BASE?.trim() || "https://api.ebay.com";

const globalForEbay = globalThis as unknown as { ebayToken?: { value: string; expires: number } };

export function ebayConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID?.trim() && process.env.EBAY_CLIENT_SECRET?.trim());
}

async function token(): Promise<string> {
  const cached = globalForEbay.ebayToken;
  if (cached && cached.expires > Date.now() + 60_000) return cached.value;
  const id = process.env.EBAY_CLIENT_ID!.trim();
  const secret = process.env.EBAY_CLIENT_SECRET!.trim();
  const res = await fetch(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`eBay sign-in failed (${res.status}). Check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  globalForEbay.ebayToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

type ItemSummary = {
  title?: string;
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  thumbnailImages?: { imageUrl?: string }[];
  price?: { value?: string; currency?: string };
  itemLocation?: { city?: string; stateOrProvince?: string; postalCode?: string };
};

/** Newest eBay listings located in Australia that match the words. */
export async function searchEbay(query: string, limit = 20): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: "newlyListed",
    filter: "itemLocationCountry:AU",
  });
  const res = await fetch(`${API}/buy/browse/v1/item_summary/search?${params}`, {
    headers: { authorization: `Bearer ${await token()}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_AU" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`eBay search failed (${res.status}).`);
  const data = (await res.json()) as { itemSummaries?: ItemSummary[] };
  return (data.itemSummaries ?? [])
    .filter((item) => item.itemWebUrl && item.title)
    .map((item) => {
      const loc = item.itemLocation;
      const price = Number(item.price?.value);
      return {
        url: item.itemWebUrl!,
        title: item.title!,
        imageUrl: item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl ?? null,
        price: Number.isFinite(price) && price > 0 ? price : null,
        currency: item.price?.currency ?? null,
        location: [loc?.city, loc?.stateOrProvince].filter(Boolean).join(", ") || null,
        site: "eBay AU",
      };
    });
}
