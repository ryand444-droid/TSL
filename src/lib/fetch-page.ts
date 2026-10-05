import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 12_000;

// A normal desktop browser header set; many listing sites reject requests without one.
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-AU,en;q=0.9",
};

export class FetchPageError extends Error {}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
    return lower === "::1" || lower === "::" || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/** Rejects links that aren't public web pages, so the server can't be pointed at its own network. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchPageError("That doesn't look like a web link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchPageError("Only http and https links can be saved.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) throw new FetchPageError("Couldn't find that website.");
  if (addresses.some(isPrivateAddress)) throw new FetchPageError("That link points to a private address.");
  return url;
}

/** Downloads a listing page's HTML, following redirects and checking each hop. */
export async function fetchPage(raw: string): Promise<{ html: string; finalUrl: string }> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      headers: HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    if (!res.ok) throw new FetchPageError(`The site turned the request away (error ${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new FetchPageError("That link isn't a web page.");
    const buf = await res.arrayBuffer();
    return { html: new TextDecoder().decode(buf.slice(0, MAX_BYTES)), finalUrl: url.toString() };
  }
  throw new FetchPageError("Too many redirects.");
}
