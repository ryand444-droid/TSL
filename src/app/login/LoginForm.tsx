"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Passcode</span>
        <input name="passcode" type="password" autoComplete="current-password" autoFocus required />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Checking…" : "Open TSL"}
      </button>
    </form>
  );
}
