import { describe, expect, it } from "vitest";
import { extractListing, parsePrice } from "./extract";
import { guessCategory } from "./sites";
import { findUrl } from "./listings";

describe("parsePrice", () => {
  it("reads common price formats", () => {
    expect(parsePrice("A$17,450")).toBe(17450);
    expect(parsePrice("17450.00")).toBe(17450);
    expect(parsePrice("$1.45m+")).toBe(1_450_000);
    expect(parsePrice("$850k")).toBe(850_000);
    expect(parsePrice(139990)).toBe(139990);
  });

  it("returns null when there's no number", () => {
    expect(parsePrice("Auction")).toBeNull();
    expect(parsePrice("Contact agent")).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});

describe("extractListing", () => {
  it("prefers JSON-LD product data", () => {
    const html = `<html><head>
      <meta property="og:title" content="Rolex | Chrono24">
      <meta property="og:image" content="/img/og.jpg">
      <meta property="og:site_name" content="Chrono24">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product","name":"Rolex Submariner Date 126610LN","image":["https://img.example.com/sub.jpg"],"offers":{"@type":"Offer","price":"17450","priceCurrency":"aud"}}]}</script>
    </head></html>`;
    expect(extractListing(html, "https://www.chrono24.com.au/rolex/sub--id1.htm")).toEqual({
      title: "Rolex Submariner Date 126610LN",
      imageUrl: "https://img.example.com/sub.jpg",
      price: 17450,
      currency: "AUD",
      priceText: null,
      siteName: "Chrono24",
    });
  });

  it("falls back to Open Graph tags and resolves relative images", () => {
    const html = `<html><head><title>ignored</title>
      <meta property="og:title" content="2023 Toyota LandCruiser 300 GR Sport">
      <meta property="og:image" content="/photos/lc300.jpg">
      <meta property="product:price:amount" content="139,990">
      <meta property="product:price:currency" content="AUD">
    </head></html>`;
    const out = extractListing(html, "https://www.carsales.com.au/cars/details/abc/");
    expect(out.title).toBe("2023 Toyota LandCruiser 300 GR Sport");
    expect(out.imageUrl).toBe("https://www.carsales.com.au/photos/lc300.jpg");
    expect(out.price).toBe(139990);
    expect(out.currency).toBe("AUD");
  });

  it("keeps price words when there's no number", () => {
    const html = `<html><head><title>14 Latrobe Tce, Paddington</title></head>
      <body><span itemprop="price">Auction</span></body></html>`;
    const out = extractListing(html, "https://www.realestate.com.au/property-house-qld-paddington-1");
    expect(out.price).toBeNull();
    expect(out.priceText).toBe("Auction");
  });

  it("handles broken JSON-LD and missing data", () => {
    const html = `<html><head><script type="application/ld+json">{not json</script></head></html>`;
    const out = extractListing(html, "https://example.com/");
    expect(out.title).toBeNull();
    expect(out.imageUrl).toBeNull();
    expect(out.price).toBeNull();
  });
});

describe("guessCategory", () => {
  it("uses the site first", () => {
    expect(guessCategory("www.carsales.com.au", "Anything")).toBe("cars");
    expect(guessCategory("www.domain.com.au", null)).toBe("property");
    expect(guessCategory("www.chrono24.com.au", null)).toBe("watches");
  });

  it("uses title words on general sites", () => {
    expect(guessCategory("www.ebay.com.au", "Omega Speedmaster Moonwatch")).toBe("watches");
    expect(guessCategory("www.gumtree.com.au", "2019 Mazda CX-5, 82,000 km")).toBe("cars");
    expect(guessCategory("www.gumtree.com.au", "3 bedroom house for rent")).toBe("property");
    expect(guessCategory("www.ebay.com.au", "Vintage lamp")).toBe("other");
  });
});

describe("findUrl", () => {
  it("pulls a link out of shared text", () => {
    expect(findUrl("Look at this https://www.domain.com.au/7-22-ocean-st-bondi-nsw-2026.")).toBe(
      "https://www.domain.com.au/7-22-ocean-st-bondi-nsw-2026",
    );
    expect(findUrl("no link here")).toBeNull();
  });
});

describe("titleFromUrl", () => {
  it("uses the most word-like part of the link", async () => {
    const { titleFromUrl } = await import("./listings");
    expect(
      titleFromUrl(new URL("https://www.carsales.com.au/cars/details/2023-toyota-landcruiser-300-gr-sport/OAG-AD-123/")),
    ).toBe("2023 toyota landcruiser 300 gr sport");
    expect(titleFromUrl(new URL("https://www.chrono24.com.au/rolex/submariner-date--id123.htm"))).toBe("Submariner date");
  });
});
