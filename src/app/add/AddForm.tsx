"use client";

import { useActionState } from "react";
import { Thumb } from "@/components/Thumb";
import { formatPrice } from "@/lib/sites";
import { parsePrice } from "@/lib/extract";
import { addListing } from "../actions";

/** Details read from the page by the "Save to TSL" bookmark or Shortcut. */
export type Captured = { title: string; image: string; price: string; currency: string };

export function AddForm({ initialUrl, captured }: { initialUrl: string; captured: Captured | null }) {
  const [error, action, pending] = useActionState(addListing, null);
  const price = captured ? parsePrice(captured.price) : null;
  return (
    <form action={action} className="stack">
      {captured && (
        <div className="row">
          <Thumb imageUrl={captured.image || null} category="other" />
          <div className="meta">
            <b>{captured.title || initialUrl}</b>
            <span>{new URL(initialUrl).hostname.replace(/^www\./, "")}</span>
          </div>
          <div className={`price${price == null && !captured.price ? " none" : ""}`}>
            {formatPrice(price, captured.currency || null, captured.price || null)}
          </div>
        </div>
      )}
      <label className="field">
        <span>Listing link</span>
        <input
          name="url"
          type="url"
          inputMode="url"
          placeholder="https://www.chrono24.com.au/…"
          defaultValue={initialUrl}
          autoFocus={!initialUrl}
          required
        />
      </label>
      {captured &&
        (["title", "image", "price", "currency"] as const).map((k) => (
          <input key={k} type="hidden" name={`captured_${k}`} value={captured[k]} />
        ))}
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={pending}>
        {pending ? (captured ? "Saving…" : "Fetching photo and price…") : "Save to my list"}
      </button>
      {!captured && (
        <p className="hint">TSL reads the listing&apos;s photo, title and price. If a site blocks that, you can fill them in after saving.</p>
      )}
    </form>
  );
}
