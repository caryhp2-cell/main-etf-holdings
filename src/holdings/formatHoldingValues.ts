export function formatShareDeltaLots(value: number | null): string {
  if (value == null) return "-";

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value / 1000);
}
