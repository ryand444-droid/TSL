import { CategoryIcon } from "./icons";
import { isCategory } from "@/lib/sites";

export function Thumb({ imageUrl, category, hero }: { imageUrl: string | null; category: string; hero?: boolean }) {
  const cat = isCategory(category) ? category : "other";
  return (
    <div className={`thumb tile-${cat}${hero ? " hero" : ""}`}>
      {imageUrl ? (
        // Listing photos come from many sites, so they're shown as-is rather than through Next's image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <CategoryIcon category={cat} />
      )}
    </div>
  );
}
