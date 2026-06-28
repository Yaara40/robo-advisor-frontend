export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}¢`;
}

export function formatEdge(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function formatDollar(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

export const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#8b5cf6",
  SOL: "#00ffa3",
  XRP: "#9ca3af",
  BNB: "#f3ba2f",
  DOGE: "#c2a633",
  HYPE: "#ef4444",
};

export function getCoinColor(coin: string): string {
  return COIN_COLORS[coin.toUpperCase()] ?? "#8b949e";
}
