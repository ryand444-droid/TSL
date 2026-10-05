// Drawn into PNGs by app/icon.tsx and app/apple-icon.tsx.
export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e0e0f",
        color: "#c9a96a",
        fontSize: size * 0.3,
        fontWeight: 400,
        letterSpacing: size * 0.04,
        border: `${Math.max(2, size * 0.012)}px solid #c9a96a`,
      }}
    >
      TSL
    </div>
  );
}
