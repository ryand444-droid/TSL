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
        background: "#1f6f55",
        color: "#fbfcfa",
        fontSize: size * 0.36,
        fontWeight: 700,
        letterSpacing: -size * 0.015,
      }}
    >
      TSL
    </div>
  );
}
