import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api/client";
import type { MarketPrediction } from "../types";
import { CoinBadge } from "../components/shared/CoinBadge";
import { EdgeBar } from "../components/shared/EdgeBar";
import {
  LoadingSpinner,
  ErrorMessage,
} from "../components/shared/LoadingSpinner";
import {
  formatProbability,
  formatEdge,
  formatDollar,
  truncate,
} from "../utils/format";

type SortKey =
  | "edge"
  | "our_estimate"
  | "market_price"
  | "confidence"
  | "volume";
type SortDir = "asc" | "desc";

const COINS = ["All", "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "HYPE"];
const TIMEFRAMES = ["All", "1 Hour", "4 Hour", "Daily", "Weekly", "Monthly"];
const TIMEFRAME_MAP: Record<string, string[]> = {
  "1 Hour": ["1hour"],
  "4 Hour": ["4hour"],
  Daily: ["1day"],
  // "weekly", "monthly", and "all" are longer-horizon markets; group them here
  Weekly: ["weekly", "all"],
  Monthly: ["monthly"],
};

const POLL_INTERVAL = 30_000; // 30 seconds

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
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCoin, setSelectedCoin] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("edge");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [secondsAgo, setSecondsAgo] = useState(0);

  const prevPricesRef = useRef<Record<string, number>>({});

  const fetchMarkets = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Force-bypass the server-side cache on manual refresh
      if (isManual) {
        await fetch("/api/refresh").catch(() => {});
      }
      const r = await api.markets();
      const incoming = r.markets;

      // Detect which market prices changed since last fetch
      const prev = prevPricesRef.current;
      const changed = new Set<string>();
      incoming.forEach((m) => {
        if (prev[m.id] !== undefined && prev[m.id] !== m.market_price) {
          changed.add(m.id);
        }
      });

      // Store new prices for next comparison
      const newPrices: Record<string, number> = {};
      incoming.forEach((m) => {
        newPrices[m.id] = m.market_price;
      });
      prevPricesRef.current = newPrices;
      setPrevPrices(newPrices);

      setData(incoming);
      setChangedIds(changed);
      setLastUpdated(new Date());
      setError(null);

      // Clear highlight after 2s
      if (changed.size > 0) {
        setTimeout(() => setChangedIds(new Set()), 2000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(() => fetchMarkets(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  // "X seconds ago" counter
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.round((Date.now() - lastUpdated.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey !== key ? " ↕" : sortDir === "desc" ? " ↓" : " ↑";

  const filtered = data
    .filter((m) => selectedCoin === "All" || m.coin === selectedCoin)
    .filter(
      (m) =>
        selectedTimeframe === "All" ||
        (TIMEFRAME_MAP[selectedTimeframe] ?? []).includes(m.market_type),
    )
    .sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      return (a[sortKey] - b[sortKey]) * mul;
    });

  const maxEdge = Math.max(...data.map((m) => Math.abs(m.edge)), 0.01);

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    if (secondsAgo < 5) return "just now";
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  };

  if (loading)
    return (
      <LoadingSpinner message="Fetching live markets from Polymarket..." />
    );
  if (error && data.length === 0)
    return <ErrorMessage message={`Failed to load markets: ${error}`} />;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#e6edf3",
            }}
          >
            Live Markets
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#00d395",
                boxShadow: "0 0 6px #00d395",
              }}
            />
            <p style={{ margin: 0, color: "#8b949e", fontSize: 14 }}>
              {data.length} active prediction markets · updated{" "}
              {formatLastUpdated()}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMarkets(true)}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            backgroundColor: refreshing ? "#21262d" : "#1a2332",
            border: "1px solid #21262d",
            borderRadius: 8,
            cursor: refreshing ? "not-allowed" : "pointer",
            color: refreshing ? "#8b949e" : "#00d395",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes flash { 0%,100% { background: transparent; } 50% { background: rgba(0,211,149,0.12); } }`}</style>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #21262d",
          borderRadius: 12,
          padding: 24,
        }}
      >
        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Coin tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                    backgroundColor:
                      selectedCoin === coin ? "#00d395" : "#21262d",
                    color: selectedCoin === coin ? "#0d1117" : "#8b949e",
                    transition: "all 0.15s",
                  }}
                >
                  {coin}
                </button>
              ))}
            </div>

            {/* Timeframe tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                    backgroundColor:
                      selectedTimeframe === tf ? "#00d395" : "#21262d",
                    color: selectedTimeframe === tf ? "#0d1117" : "#8b949e",
                    transition: "all 0.15s",
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            <span
              style={{ color: "#8b949e", fontSize: 12, marginLeft: "auto" }}
            >
              {filtered.length} markets shown
            </span>
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
            {filtered.map((market, i) => {
              const changed = changedIds.has(market.id);
              const prevPrice = prevPrices[market.id];
              const priceDir =
                changed && prevPrice !== undefined
                  ? market.market_price > prevPrice
                    ? "up"
                    : "down"
                  : null;

              return (
                <tr
                  key={`${market.id}-${i}`}
                  style={{
                    borderBottom: "1px solid #21262d",
                    animation: changed ? "flash 2s ease" : "none",
                    transition: "background 0.3s",
                  }}
                >
                  <td style={{ padding: "14px 12px 14px 0", minWidth: 240 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <CoinBadge coin={market.coin} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: "#e6edf3",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {truncate(market.question, 52)}
                        </div>
                        <div
                          style={{
                            color: "#8b949e",
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {market.market_type}
                          {market.endDate && (
                            <span style={{ marginLeft: 6 }}>
                              · ends{" "}
                              {new Date(market.endDate).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 14,
                        color:
                          priceDir === "up"
                            ? "#00d395"
                            : priceDir === "down"
                              ? "#f85149"
                              : "#e6edf3",
                        fontWeight: priceDir ? 700 : 400,
                        transition: "color 0.3s",
                      }}
                    >
                      {formatProbability(market.market_price)}
                    </span>
                    {priceDir && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 11,
                          color: priceDir === "up" ? "#00d395" : "#f85149",
                        }}
                      >
                        {priceDir === "up" ? "▲" : "▼"}
                      </span>
                    )}
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 14,
                      color:
                        market.our_estimate > market.market_price
                          ? "#00d395"
                          : "#f85149",
                    }}
                  >
                    {formatProbability(market.our_estimate)}
                  </td>

                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color: market.edge >= 0 ? "#00d395" : "#f85149",
                      }}
                    >
                      {market.edge >= 0 ? "↗" : "↘"} {formatEdge(market.edge)}
                    </span>
                  </td>

                  <td style={{ padding: "14px 12px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <EdgeBar
                        edge={market.edge}
                        maxEdge={maxEdge}
                        width={60}
                      />
                      <span style={{ color: "#8b949e", fontSize: 12 }}>
                        {Math.round(market.confidence * 100)}%
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "14px 0",
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 13,
                      color: "#8b949e",
                    }}
                  >
                    {formatDollar(market.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#8b949e",
              padding: "40px 0",
              fontSize: 14,
            }}
          >
            No markets match the selected filters.
          </div>
        )}

        {/* Footer: next refresh countdown */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid #21262d",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#00d395",
              boxShadow: "0 0 5px #00d395",
            }}
          />
          <span style={{ color: "#8b949e", fontSize: 12 }}>
            Auto-refreshes every 30 seconds · next refresh in{" "}
            {Math.max(0, 30 - (secondsAgo % 30))}s
          </span>
        </div>
      </div>
    </div>
  );
}
