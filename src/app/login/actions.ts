"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { passcode, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function signIn(_prev: string | null, form: FormData): Promise<string | null> {
  const code = passcode();
  const entered = String(form.get("passcode") ?? "").trim();
  if (code && entered !== code) return "That passcode isn't right.";
  if (code) {
    (await cookies()).set(SESSION_COOKIE, await sessionToken(code), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
