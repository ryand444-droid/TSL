import { NextResponse, type NextRequest } from "next/server";
import { isSignedIn, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (await isSignedIn(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the sign-in page and the files iOS needs to install the app.
  matcher: ["/((?!login|_next/|manifest.webmanifest|icon|apple-icon|favicon.ico).*)"],
};
