import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { MarketPrediction } from "../types";
import { CoinBadge } from "../components/shared/CoinBadge";
import { EdgeBar } from "../components/shared/EdgeBar";
import { LoadingSpinner, ErrorMessage } from "../components/shared/LoadingSpinner";
import { formatProbability, formatEdge, formatDollar, truncate } from "../utils/format";

type SortKey = "edge" | "our_estimate" | "market_price" | "confidence" | "volume";
type SortDir = "asc" | "desc";

const COINS = ["All", "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "HYPE"];
const TIMEFRAMES = ["All", "5 Min", "15 Min", "1 Hour", "4 Hour", "Daily", "Weekly"];
const TIMEFRAME_MAP: Record<string, string> = {
  "5 Min": "5min",
  "15 Min": "15min",
  "1 Hour": "1hour",
  "4 Hour": "4hour",
  Daily: "1day",
  Weekly: "weekly",
};

const COL_STYLE: React.CSSProperties = {
  color: "#8b949e",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "0 12px 14px 0",
  textAlign: "left" as const,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
};

export function MarketsPage() {
  const [data, setData] = useState<MarketPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("edge");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    api
      .markets()
      .then((r) => setData(r.markets))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "desc" ? " ↓" : " ↑";
  };

  const filtered = data
    .filter((m) => selectedCoin === "All" || m.coin === selectedCoin)
    .filter((m) => {
      if (selectedTimeframe === "All") return true;
      return m.market_type === TIMEFRAME_MAP[selectedTimeframe];
    })
    .sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      return (a[sortKey] - b[sortKey]) * mul;
    });

  const maxEdge = Math.max(...data.map((m) => Math.abs(m.edge)), 0.01);

  if (loading) return <LoadingSpinner message="Loading markets..." />;
  if (error) return <ErrorMessage message={`Failed to load markets: ${error}`} />;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>
          All Markets
        </h1>
        <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
          Browse {data.length} active prediction markets
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #21262d",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            Active Markets
          </h2>

          {/* Coin filter + Timeframe filter */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {COINS.map((coin) => (
                <button
                  key={coin}
                  onClick={() => setSelectedCoin(coin)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: selectedCoin === coin ? "#00d395" : "#21262d",
                    color: selectedCoin === coin ? "#0d1117" : "#8b949e",
                    transition: "all 0.15s",
                  }}
                >
                  {coin}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: selectedTimeframe === tf ? "#00d395" : "#21262d",
                    color: selectedTimeframe === tf ? "#0d1117" : "#8b949e",
                    transition: "all 0.15s",
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #21262d" }}>
              <th style={{ ...COL_STYLE }}>Market</th>
              <th
                style={{ ...COL_STYLE, textAlign: "right" as const }}
                onClick={() => handleSort("market_price")}
              >
                Market Price{sortIndicator("market_price")}
              </th>
              <th
                style={{ ...COL_STYLE, textAlign: "right" as const }}
                onClick={() => handleSort("our_estimate")}
              >
                Model Est.{sortIndicator("our_estimate")}
              </th>
              <th
                style={{ ...COL_STYLE, textAlign: "right" as const }}
                onClick={() => handleSort("edge")}
              >
                Edge{sortIndicator("edge")}
              </th>
              <th style={{ ...COL_STYLE }}>Confidence</th>
              <th
                style={{ ...COL_STYLE, textAlign: "right" as const }}
                onClick={() => handleSort("volume")}
              >
                Volume{sortIndicator("volume")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((market, i) => (
              <tr
                key={`${market.id}-${i}`}
                style={{ borderBottom: "1px solid #21262d" }}
              >
                <td style={{ padding: "14px 12px 14px 0", minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CoinBadge coin={market.coin} size="sm" />
                    <div>
                      <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                        {truncate(market.question, 55)}
                      </div>
                      <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>
                        {market.market_type} · Up
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#e6edf3" }}>
                  {formatProbability(market.market_price)}
                </td>
                <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: market.our_estimate > market.market_price ? "#00d395" : "#f85149" }}>
                  {formatProbability(market.our_estimate)}
                </td>
                <td style={{ padding: "14px 12px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                    <span style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: market.edge >= 0 ? "#00d395" : "#f85149",
                    }}>
                      {market.edge >= 0 ? "↗" : "↘"} {formatEdge(market.edge)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EdgeBar edge={market.edge} maxEdge={maxEdge} width={60} />
                    <span style={{ color: "#8b949e", fontSize: 12 }}>
                      {Math.round(market.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 0", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#8b949e" }}>
                  {formatDollar(market.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#8b949e", padding: "40px 0", fontSize: 14 }}>
            No markets match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
