"use client";

import { useActionState } from "react";
import { addListing } from "../actions";

export function AddForm({ initialUrl }: { initialUrl: string }) {
  const [error, action, pending] = useActionState(addListing, null);
  return (
    <form action={action} className="stack">
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
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Fetching photo and price…" : "Save to my list"}
      </button>
      <p className="hint">TSL reads the listing&apos;s photo, title and price. If a site blocks that, you can fill them in after saving.</p>
    </form>
  );
}
