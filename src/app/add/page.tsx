import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { findUrl } from "@/lib/listings";
import { AddForm } from "./AddForm";

export const metadata = { title: "Add a listing" };

// Opened with ?url= by the iPhone Shortcut, or with ?text= by Android's Share menu.
export default async function AddPage({ searchParams }: PageProps<"/add">) {
  const params = await searchParams;
  const shared = ["url", "text", "title"].map((k) => params[k]).filter((v) => typeof v === "string").join(" ");
  return (
    <main className="page">
      <div className="topline">
        <Link href="/" className="iconbtn plain" aria-label="Back">
          <BackIcon />
        </Link>
      </div>
      <h1 className="dtitle">Add a listing</h1>
      <AddForm initialUrl={findUrl(shared) ?? ""} />
    </main>
  );
}
