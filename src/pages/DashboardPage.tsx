import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardResponse } from "../types";
import { StatCard } from "../components/shared/StatCard";
import { CoinBadge } from "../components/shared/CoinBadge";
import { EdgeBar } from "../components/shared/EdgeBar";
import { LoadingSpinner, ErrorMessage } from "../components/shared/LoadingSpinner";
import { formatProbability, formatEdge } from "../utils/format";
import { useNavigate } from "react-router-dom";

const COL_STYLE: React.CSSProperties = {
  color: "#8b949e",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "0 12px 12px 0",
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Fetching market data..." />;
  if (error) return <ErrorMessage message={`Failed to load dashboard: ${error}`} />;
  if (!data) return null;

  const topOpp = data.top_opportunities ?? [];
  const maxEdge = Math.max(...topOpp.map((o) => o.edge), 0.01);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>
          Dashboard
        </h1>
        <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
          AI-powered prediction market analysis
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Active Markets"
          value={data.active_markets}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" /><path d="M9 21V9" />
            </svg>
          }
        />
        <StatCard
          label="Opportunities"
          value={data.opportunities}
          subtext="from yesterday"
          trend={12}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          }
        />
        <StatCard
          label="Avg Edge"
          value={`${(data.avg_edge * 100).toFixed(1)}%`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          }
        />
        <StatCard
          label="Model Accuracy"
          value={`${(data.model_accuracy * 100).toFixed(1)}%`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Active Markets table */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
              Active Markets
            </h2>
            <button
              onClick={() => navigate("/markets")}
              style={{
                background: "none",
                border: "none",
                color: "#00d395",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              View All →
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...COL_STYLE, textAlign: "left" }}>Market</th>
                <th style={{ ...COL_STYLE, textAlign: "right" }}>Market Price</th>
                <th style={{ ...COL_STYLE, textAlign: "right" }}>Model Est.</th>
                <th style={{ ...COL_STYLE, textAlign: "right" }}>Edge</th>
                <th style={{ ...COL_STYLE, textAlign: "left" }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {topOpp.map((opp, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: "1px solid #21262d",
                  }}
                >
                  <td style={{ padding: "14px 12px 14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CoinBadge coin={opp.coin} size="sm" />
                      <span style={{ color: "#8b949e", fontSize: 12 }}>
                        {opp.market_type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#e6edf3" }}>
                    {formatProbability(opp.market_price)}
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#00d395" }}>
                    {formatProbability(opp.our_estimate)}
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#00d395", fontWeight: 600 }}>
                    {formatEdge(opp.edge)}
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    <EdgeBar edge={opp.edge} maxEdge={maxEdge} width={70} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Opportunities sidebar */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
                Top Opportunities
              </h2>
            </div>
            <button
              onClick={() => navigate("/optimizer")}
              style={{
                background: "none",
                border: "none",
                color: "#00d395",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Optimize →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topOpp.slice(0, 5).map((opp, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#1a2332",
                  border: "1px solid #21262d",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#21262d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#e6edf3",
                    flexShrink: 0,
                  }}
                >
                  {opp.coin?.[0] ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "#e6edf3", fontWeight: 600, fontSize: 13 }}>
                      {opp.coin}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>· {opp.market_type}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>
                      Mkt <span style={{ color: "#e6edf3" }}>{formatProbability(opp.market_price)}</span>
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>
                      Model <span style={{ color: "#00d395" }}>{formatProbability(opp.our_estimate)}</span>
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#00d395", fontWeight: 700, fontSize: 14 }}>
                    {formatEdge(opp.edge)}
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 11 }}>
                    {Math.round(opp.confidence * 100)}% conf
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coin summary */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #21262d" }}>
            {data.coins.map((coin) => {
              const coinOpps = (data.top_opportunities ?? []).filter((o) => o.coin === coin);
              const maxEdgeCoin = coinOpps.length > 0 ? Math.max(...coinOpps.map((o) => o.edge)) : 0;
              return (
                <div
                  key={coin}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #21262d",
                  }}
                >
                  <CoinBadge coin={coin} size="sm" />
                  <span style={{ color: "#8b949e", fontSize: 12 }}>
                    {coinOpps.length} opp{coinOpps.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ color: "#00d395", fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
                    {formatEdge(maxEdgeCoin)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
