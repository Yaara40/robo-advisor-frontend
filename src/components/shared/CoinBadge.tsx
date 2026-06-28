import { getCoinColor } from "../../utils/format";

interface CoinBadgeProps {
  coin: string;
  size?: "sm" | "md";
}

const COIN_INITIALS: Record<string, string> = {
  BTC: "B",
  ETH: "E",
  SOL: "S",
  XRP: "X",
  BNB: "B",
  DOGE: "D",
  HYPE: "H",
};

export function CoinBadge({ coin, size = "md" }: CoinBadgeProps) {
  const color = getCoinColor(coin);
  const dim = size === "sm" ? 24 : 30;
  const fontSize = size === "sm" ? 10 : 13;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          backgroundColor: color + "22",
          border: `1px solid ${color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}
      >
        {COIN_INITIALS[coin] ?? coin[0]}
      </div>
      <span style={{ color: "#e6edf3", fontWeight: 600, fontSize: size === "sm" ? 12 : 14 }}>
        {coin}
      </span>
    </div>
  );
}
