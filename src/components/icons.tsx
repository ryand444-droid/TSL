import type { Category } from "@/lib/sites";

// Icon shapes from the mockups.
export function CategoryIcon({ category }: { category: Category }) {
  if (category === "watches")
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M18 9l1.5-6h9L30 9M18 39l1.5 6h9L30 39" />
        <circle cx="24" cy="24" r="13" />
        <circle cx="24" cy="24" r="9.5" strokeWidth="1" />
        <path d="M24 24V17M24 24l5 3" />
        <path d="M37 22v4" strokeWidth="3" />
      </svg>
    );
  if (category === "cars")
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 30v-5l4-2 5-8h18l6 8 5 2v5h-4" />
        <path d="M15 30h18" />
        <circle cx="11" cy="31" r="4" />
        <circle cx="37" cy="31" r="4" />
        <path d="M16 22h20M24 15v7" />
      </svg>
    );
  if (category === "property")
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 22L24 8l18 14" />
        <path d="M10 19v21h28V19" />
        <path d="M20 40V29h8v11" />
        <path d="M33 13V9h4v7" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 16l16-8 16 8v18l-16 8-16-8z" />
      <path d="M8 16l16 8 16-8M24 24v18" />
    </svg>
  );
}

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
