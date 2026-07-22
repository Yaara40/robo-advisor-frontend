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

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#e6edf3" }}>
          How It Works
        </h2>

        {/* Three-column method overview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d395" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              ),
              title: "1. Market Scanning",
              body: "Every 5 minutes we pull all active Polymarket binary markets for 7 coins (BTC, ETH, SOL, XRP, BNB, DOGE, HYPE) across four timeframes: 1-hour, 4-hour, daily, and weekly windows.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              title: "2. ML Probability Estimate",
              body: "An ensemble of gradient-boosted classifiers — one trained per timeframe — outputs P(YES) for each market. Features include CLOB price trajectory, momentum, volatility, and volume. Trained on ~13,000 closed markets.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f3ba2f" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              ),
              title: "3. Kelly-Markowitz Sizing",
              body: "Edges are translated into optimal bet sizes via fractional Kelly, then a Markowitz correlation penalty prevents over-concentration in correlated coins. Risk level 1–10 controls both the Kelly fraction and the penalty strength.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, color: "#e6edf3", marginBottom: 8, fontSize: 14 }}>{card.title}</div>
              <div style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>

        {/* Model advantage */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>
            Why Our Model Outperforms Baselines
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ color: "#8b949e", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
                Ensemble (our model)
              </div>
              {[
                ["56.1% direction accuracy", "Correctly picks YES/NO majority of the time"],
                ["+11.9% in-sample ROI", "Flat $20 bet across 1,342 trades"],
                ["+25.2% OOS ROI", "Tested on 2,290 unseen June 2026 markets"],
                ["Sharpe 1.91", "Strong risk-adjusted return"],
                ["Per-timeframe models", "Separate GBM for 1h, 4h, 1day, weekly — each tuned to its window's dynamics"],
              ].map(([metric, desc]) => (
                <div key={metric} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#00d395", fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <div>
                    <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{metric}</span>
                    <span style={{ color: "#8b949e", fontSize: 12 }}> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: "#8b949e", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
                Baselines (flat bet, same data)
              </div>
              {[
                ["LR: −14.6% ROI, 42.5% accuracy", "Logistic regression on the same features — underfits the non-linear price dynamics"],
                ["RF: −26.1% ROI, 36.7% accuracy", "Random forest — overfits in-sample but fails out-of-sample on evolving market regimes"],
                ["Always-YES: −44.8% ROI", "Naive bet — markets price in YES fairly, so blindly betting YES loses to the vig"],
              ].map(([metric, desc]) => (
                <div key={metric} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#f85149", fontSize: 14, marginTop: 1, flexShrink: 0 }}>✗</span>
                  <div>
                    <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{metric}</span>
                    <span style={{ color: "#8b949e", fontSize: 12 }}> — {desc}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: "10px 14px", backgroundColor: "rgba(0,211,149,0.06)", borderRadius: 8, border: "1px solid rgba(0,211,149,0.15)" }}>
                <span style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.6 }}>
                  All comparisons use identical markets, identical features, and a flat $20 bet per trade —
                  the gap reflects pure model quality, not bet sizing.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
