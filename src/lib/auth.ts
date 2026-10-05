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
