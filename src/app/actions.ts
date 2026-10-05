"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FetchPageError } from "@/lib/fetch-page";
import { deleteListing, findUrl, saveListing, updateListing } from "@/lib/listings";
import { isCategory } from "@/lib/sites";
import { parsePrice, type ExtractedListing } from "@/lib/extract";

export async function addListing(_prev: string | null, form: FormData): Promise<string | null> {
  const url = findUrl(String(form.get("url") ?? ""));
  if (!url) return "Paste a link that starts with http:// or https://.";
  let id: number;
  try {
    ({ id } = await saveListing(url, capturedFrom(form)));
  } catch (err) {
    if (err instanceof FetchPageError) return err.message;
    console.error(err);
    return "Something went wrong saving that link. Please try again.";
  }
  revalidatePath("/");
  redirect(`/listing/${id}`);
}

/** Details the "Save to TSL" bookmark or Shortcut read from the page, if it was used. */
function capturedFrom(form: FormData): ExtractedListing | null {
  const get = (k: string) => String(form.get(`captured_${k}`) ?? "").trim();
  const title = get("title");
  const image = get("image");
  const priceInput = get("price");
  if (!title && !image && !priceInput) return null;
  const price = parsePrice(priceInput);
  return {
    title: title || null,
    imageUrl: /^https?:\/\//i.test(image) ? image : null,
    price,
    currency: price != null ? get("currency").toUpperCase() || null : null,
    priceText: price == null && priceInput ? priceInput : null,
    siteName: null,
  };
}

export async function editListing(id: number, form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  const priceInput = String(form.get("price") ?? "").trim();
  const category = form.get("category");
  const notes = String(form.get("notes") ?? "").trim();
  const price = parsePrice(priceInput);
  await updateListing(id, {
    title: title || "Untitled listing",
    price,
    // Keeps words like "Auction 18 Oct" when there's no number to track.
    priceText: price == null && priceInput ? priceInput : null,
    category: isCategory(category) ? category : "other",
    notes: notes || null,
  });
  revalidatePath("/");
  revalidatePath(`/listing/${id}`);
}

export async function removeListing(id: number) {
  await deleteListing(id);
  revalidatePath("/");
  redirect("/");
}
