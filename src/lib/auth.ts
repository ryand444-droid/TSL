export const SESSION_COOKIE = "tsl_session";

/** The app is locked with one shared passcode (APP_PASSCODE). With none set, it is open, for local use. */
export function passcode(): string | null {
  return process.env.APP_PASSCODE?.trim() || null;
}

export async function sessionToken(code: string): Promise<string> {
  const data = new TextEncoder().encode(`tsl-session:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

export async function isSignedIn(cookieValue: string | undefined): Promise<boolean> {
  const code = passcode();
  if (!code) return true;
  return cookieValue === (await sessionToken(code));
}

/** Key for the iPhone "TSL from apps" Shortcut, which can't sign in with a cookie. Changes with the passcode. */
export async function captureKey(): Promise<string> {
  const code = passcode();
  if (!code) return "open";
  return (await sessionToken(`capture:${code}`)).slice(0, 24);
}
