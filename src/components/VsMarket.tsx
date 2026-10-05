/** "8% below market" in green, "12% above market" in amber, or "In line with market". */
export function VsMarket({ diff }: { diff: number | null }) {
  if (diff == null) return null;
  const pct = Math.round(Math.abs(diff) * 100);
  if (pct < 3) return <span className="vs even">In line with market</span>;
  return diff < 0 ? <span className="vs below">{pct}% below market</span> : <span className="vs above">{pct}% above market</span>;
}
