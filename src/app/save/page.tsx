import Link from "next/link";
import { headers } from "next/headers";
import { BackIcon } from "@/components/icons";
import { bookmarklet, shortcutScript } from "@/lib/capture-script";
import { CopyBox } from "./CopyBox";

export const metadata = { title: "Save to TSL button" };

export default async function SaveSetupPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  // On Vercel, point the button at the main address (e.g. tsl-nu.vercel.app) rather than whichever
  // one-off deployment address this page was opened on, so it keeps getting updates.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = production ? `https://${production}` : `${proto}://${host}`;
  // React won't render javascript: links, so the bookmark is written as plain HTML.
  const bookmarkHtml = `<a class="btn ghost" href="javascript:${encodeURIComponent(bookmarklet(origin).slice("javascript:".length))}">＋ Save to TSL</a>`;

  return (
    <main className="page">
      <div className="topline">
        <Link href="/" className="iconbtn plain" aria-label="Back">
          <BackIcon />
        </Link>
      </div>
      <h1 className="dtitle">Save to TSL button</h1>
      <p className="hint">
        Sites like carsales and Chrono24 block TSL from reading their pages, but not your own browser. This button reads the photo, title and
        price from the listing you&apos;re looking at and saves it here.
      </p>

      <section className="stack">
        <h2 className="src">On a computer (Chrome, Edge, Safari)</h2>
        <ol className="steps">
          <li>Show your bookmarks bar: press Ctrl + Shift + B (on a Mac, Cmd + Shift + B).</li>
          <li>Drag this button up onto the bookmarks bar:</li>
        </ol>
        <div dangerouslySetInnerHTML={{ __html: bookmarkHtml }} />
        <ol className="steps" start={3}>
          <li>Open any listing, then click Save to TSL in your bookmarks bar.</li>
        </ol>
      </section>

      <section className="stack">
        <h2 className="src">On an Android phone (Chrome)</h2>
        <CopyBox text={bookmarklet(origin)} />
        <ol className="steps">
          <li>Tap Copy above.</li>
          <li>
            Tap <b>⋮</b> at the top right, then the <b>☆</b> star. This bookmarks this page.
          </li>
          <li>
            Tap <b>Edit</b> on the message that pops up (or tap <b>⋮</b>, then the star again). Change the name to <b>Save to TSL</b>.
          </li>
          <li>
            Tap the URL box, delete everything in it, paste, then tap the back arrow to save.
          </li>
          <li>
            Open a listing in Chrome. Tap the address bar, type <b>Save to TSL</b>, and tap the result with the star, not a Google search.
          </li>
        </ol>
        <p className="hint">
          If a listing opens in a pop-up window with an <b>✕</b> at the top left, tap <b>⋮</b> then <b>Open in Chrome</b> first.
        </p>
      </section>

      <section className="stack">
        <h2 className="src">On an iPhone (Safari)</h2>
        <CopyBox text={shortcutScript(origin)} />
        <ol className="steps">
          <li>Tap Copy above.</li>
          <li>
            Open the <b>Shortcuts</b> app and tap <b>+</b>. Tap the name at the top and call it <b>Save to TSL</b>.
          </li>
          <li>
            Tap <b>ⓘ</b> at the bottom, turn on <b>Show in Share Sheet</b>, then tap Done.
          </li>
          <li>
            Search the actions for <b>Run JavaScript on Web Page</b> and add it. Tap inside its code box, select all the text there, and
            paste.
          </li>
          <li>
            Search for <b>Open URLs</b> and add it underneath. Tap Done.
          </li>
          <li>
            In Safari, open a listing, tap the Share button, then <b>Save to TSL</b>. The first time, tap <b>Allow</b>.
          </li>
        </ol>
        <p className="hint">The listing opens in Safari, so sign in to TSL in Safari once as well.</p>
      </section>
    </main>
  );
}
