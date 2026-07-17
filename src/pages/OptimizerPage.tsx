import { useState } from "react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { ErrorMessage } from "../components/shared/LoadingSpinner";
import { CoinBadge } from "../components/shared/CoinBadge";
import { formatPercent, formatEdge, formatDollar, formatProbability, getCoinColor, truncate } from "../utils/format";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RISK_LABELS: Record<number, string> = {
  1: "Very Conservative",
  2: "Conservative",
  3: "Moderate",
  4: "Moderate+",
  5: "Balanced",
  6: "Balanced+",
  7: "Growth",
  8: "Aggressive",
  9: "Very Aggressive",
  10: "Max Risk",
};

const AMOUNT_PRESETS = [
  { value: 100, label: "$100", sub: "Test the waters" },
  { value: 500, label: "$500", sub: "Balanced play" },
  { value: 1000, label: "$1,000", sub: "Serious allocation" },
  { value: 5000, label: "$5,000", sub: "High conviction" },
];

const COL_STYLE: React.CSSProperties = {
  color: "#8b949e",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "0 12px 12px 0",
  textAlign: "left" as const,
};

// Custom pie tooltip that shows both % and dollar amount
function PieTooltip({
  active,
  payload,
  totalAmount,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  totalAmount: number;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const dollars = (value / 100) * totalAmount;
  return (
    <div
      style={{
        backgroundColor: "#1a2332",
        border: "1px solid #21262d",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#e6edf3",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ color: "#00d395", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 15 }}>
        {formatDollar(dollars)}
      </div>
      <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>{value}% of portfolio</div>
    </div>
  );
}

export function OptimizerPage() {
  // Single source of truth: `amount` is always the current dollar value
  const [amount, setAmount] = useState(500);
  const [inputText, setInputText] = useState("500");
  const [activePreset, setActivePreset] = useState<number | null>(500);
  const [riskLevel, setRiskLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { portfolioResult, setPortfolioResult } = useAppContext();

  const handleAmountInput = (val: string) => {
    setInputText(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
      // Clear preset highlight if user typed a non-preset value
      const matchingPreset = AMOUNT_PRESETS.find((p) => p.value === parsed);
      setActivePreset(matchingPreset ? parsed : null);
    } else {
      setActivePreset(null);
    }
  };

  const handlePresetClick = (value: number) => {
    setAmount(value);
    setInputText(String(value));
    setActivePreset(value);
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.optimize({
        risk_level: riskLevel,
        amount,
      });
      setPortfolioResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const allocations = portfolioResult
    ? Object.entries(portfolioResult.allocations).sort(([, a], [, b]) => b.weight - a.weight)
    : [];

  // Use the amount that was actually sent to the API (stored in portfolioResult.amount)
  const resultAmount = portfolioResult?.amount ?? amount;

  const pieData = allocations
    .filter(([, a]) => a.weight > 0)
    .map(([coin, a]) => ({
      name: coin,
      value: Math.round(a.weight * 100),
      color: getCoinColor(coin),
    }));

  const totalWeight = allocations.reduce((sum, [, a]) => sum + a.weight, 0);
  const totalDollarAllocated = allocations.reduce((sum, [, a]) => sum + a.dollar_amount, 0);
  const cashRemaining = resultAmount - totalDollarAllocated;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>
          Portfolio Optimizer
        </h1>
        <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
          Kelly-Markowitz optimal allocation across prediction markets
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Risk Tolerance */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
                Risk Tolerance
              </h2>
              <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: 13 }}>
                Adjust portfolio aggressiveness
              </p>
            </div>
            <div
              style={{
                backgroundColor: "rgba(0,211,149,0.12)",
                border: "1px solid rgba(0,211,149,0.3)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#00d395",
              }}
            >
              ⚡ {RISK_LABELS[riskLevel]}
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            value={riskLevel}
            onChange={(e) => setRiskLevel(Number(e.target.value))}
            style={{ width: "100%", cursor: "pointer" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ color: "#8b949e", fontSize: 12 }}>Conservative</span>
            <span style={{ color: "#e6edf3", fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600 }}>
              {riskLevel} / 10
            </span>
            <span style={{ color: "#8b949e", fontSize: 12 }}>Aggressive</span>
          </div>

          {/* Risk level tick marks */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 2,
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: i < riskLevel ? "#00d395" : "#21262d",
                }}
              />
            ))}
          </div>
        </div>

        {/* Investment Amount */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
              Investment Amount
            </h2>
            <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: 13 }}>
              How much to allocate across markets
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#0d1117",
              border: "1px solid #21262d",
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ color: "#8b949e", fontSize: 18, fontWeight: 600 }}>$</span>
            <input
              type="number"
              value={inputText}
              onChange={(e) => handleAmountInput(e.target.value)}
              min={1}
              style={{
                background: "none",
                border: "none",
                color: "#e6edf3",
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "JetBrains Mono, monospace",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {AMOUNT_PRESETS.map(({ value, label, sub }) => {
              const isActive = activePreset === value;
              return (
                <button
                  key={value}
                  onClick={() => handlePresetClick(value)}
                  style={{
                    background: isActive ? "rgba(0,211,149,0.08)" : "#0d1117",
                    border: isActive ? "1px solid #00d395" : "1px solid #21262d",
                    borderRadius: 10,
                    padding: "12px 8px",
                    cursor: "pointer",
                    color: isActive ? "#00d395" : "#8b949e",
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optimize button */}
      <button
        onClick={handleOptimize}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px 24px",
          backgroundColor: loading ? "#21262d" : "#00d395",
          border: "none",
          borderRadius: 12,
          cursor: loading ? "not-allowed" : "pointer",
          color: loading ? "#8b949e" : "#0d1117",
          fontSize: 16,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 24,
          transition: "background-color 0.2s",
        }}
      >
        {loading ? (
          <>
            <div
              style={{
                width: 18,
                height: 18,
                border: "2px solid #8b949e",
                borderTopColor: "#e6edf3",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Running optimizer...
          </>
        ) : (
          <>✦ Get Optimal Allocation</>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{ marginBottom: 24 }}>
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Results */}
      {portfolioResult && !loading && (
        <>
          {/* Summary banner */}
          <div
            style={{
              backgroundColor: "rgba(0,211,149,0.06)",
              border: "1px solid rgba(0,211,149,0.25)",
              borderRadius: 12,
              padding: "16px 24px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: "#8b949e", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                Allocation Summary
              </div>
              <div style={{ color: "#e6edf3", fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                {formatDollar(resultAmount)} total investment
              </div>
            </div>
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#8b949e", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Deployed</div>
                <div style={{ color: "#00d395", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 16 }}>
                  {formatDollar(totalDollarAllocated)}
                </div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>{formatPercent(totalWeight)} of budget</div>
              </div>
              {cashRemaining > 0.01 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#8b949e", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Cash</div>
                  <div style={{ color: "#e6edf3", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 16 }}>
                    {formatDollar(cashRemaining)}
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 11 }}>unallocated</div>
                </div>
              )}
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#8b949e", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Markets</div>
                <div style={{ color: "#e6edf3", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 16 }}>
                  {allocations.length}
                </div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>positions</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
            {/* Pie chart */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
                Allocation
              </h2>
              <p style={{ margin: "0 0 16px", color: "#8b949e", fontSize: 12 }}>
                Hover a slice for exact dollar amount
              </p>
              {/* Compact inline legend — all coins on one row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginBottom: 8 }}>
                {pieData.map((entry) => (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: entry.color, flexShrink: 0 }} />
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{entry.name}</span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={(props: any) => <PieTooltip {...props} totalAmount={resultAmount} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Per-coin dollar breakdown under pie */}
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                {allocations.filter(([, a]) => a.weight > 0).map(([coin, alloc]) => (
                  <div key={coin} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: getCoinColor(coin), flexShrink: 0 }} />
                      <span style={{ color: "#8b949e", fontSize: 11 }}>{coin}</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: "#8b949e", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        {formatPercent(alloc.weight)}
                      </span>
                      <span style={{ color: "#00d395", fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", minWidth: 55, textAlign: "right" }}>
                        {formatDollar(alloc.dollar_amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {cashRemaining > 0.01 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #21262d", paddingTop: 6, marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#21262d", border: "1px solid #30363d" }} />
                      <span style={{ color: "#8b949e", fontSize: 12 }}>Cash</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: "#8b949e", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                        {formatPercent(cashRemaining / resultAmount)}
                      </span>
                      <span style={{ color: "#8b949e", fontSize: 13, fontFamily: "JetBrains Mono, monospace", minWidth: 60, textAlign: "right" }}>
                        {formatDollar(cashRemaining)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Allocation table */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 24,
                overflowX: "auto",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
                  Portfolio Breakdown
                </h2>
                <p style={{ margin: 0, color: "#8b949e", fontSize: 12 }}>
                  Based on {formatDollar(resultAmount)} investment · Kelly-Markowitz optimal sizing
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...COL_STYLE }}>Coin</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>Weight</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const, color: "#00d395" }}>
                      Invest ($)
                    </th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>Market Price</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>Model Est.</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>Edge</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>Confidence</th>
                    <th style={{ ...COL_STYLE }}>Market Question</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map(([coin, alloc]) => (
                    <tr key={coin} style={{ borderTop: "1px solid #21262d" }}>
                      <td style={{ padding: "14px 12px 14px 0" }}>
                        <CoinBadge coin={coin} size="sm" />
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>
                        {formatPercent(alloc.weight)}
                      </td>
                      {/* Dollar amount — the key column, highlighted */}
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-block",
                            backgroundColor: "rgba(0,211,149,0.1)",
                            border: "1px solid rgba(0,211,149,0.25)",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#00d395",
                          }}
                        >
                          {formatDollar(alloc.dollar_amount)}
                        </div>
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#e6edf3" }}>
                        {formatProbability(alloc.market_price)}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#00d395" }}>
                        {formatProbability(alloc.our_estimate)}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: alloc.edge >= 0 ? "#00d395" : "#f85149", fontWeight: 600 }}>
                        {formatEdge(alloc.edge)}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-block",
                            height: 6,
                            width: `${alloc.confidence * 60}px`,
                            minWidth: 20,
                            backgroundColor: alloc.confidence > 0.7 ? "#00d395" : alloc.confidence > 0.4 ? "#f3ba2f" : "#8b949e",
                            borderRadius: 3,
                          }}
                        />
                        <span style={{ color: "#8b949e", fontSize: 12, marginLeft: 6 }}>
                          {Math.round(alloc.confidence * 100)}%
                        </span>
                      </td>
                      <td style={{ padding: "14px 0", color: "#8b949e", fontSize: 12, maxWidth: 200 }}>
                        {truncate(alloc.market?.question ?? "", 60)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr style={{ borderTop: "2px solid #30363d" }}>
                    <td style={{ padding: "12px 12px 4px 0", color: "#8b949e", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Total
                    </td>
                    <td style={{ padding: "12px 12px 4px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>
                      {formatPercent(totalWeight)}
                    </td>
                    <td style={{ padding: "12px 12px 4px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-block",
                          backgroundColor: "rgba(0,211,149,0.15)",
                          border: "1px solid rgba(0,211,149,0.4)",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#00d395",
                        }}
                      >
                        {formatDollar(totalDollarAllocated)}
                      </div>
                    </td>
                    <td colSpan={5} style={{ padding: "12px 0 4px", color: "#8b949e", fontSize: 12 }}>
                      {cashRemaining > 0.01 && `+ ${formatDollar(cashRemaining)} cash remaining`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Reasoning report */}
          {portfolioResult.report && (
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 24,
                marginTop: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "rgba(0,211,149,0.12)",
                    border: "1px solid rgba(0,211,149,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>
                  Why This Allocation?
                </h2>
              </div>
              <div
                style={{
                  color: "#8b949e",
                  fontSize: 13,
                  lineHeight: 1.8,
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "pre-wrap",
                }}
              >
                {portfolioResult.report.split("\n").map((line, i) => {
                  if (line.startsWith("•")) {
                    return (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <span style={{ color: "#00d395" }}>•</span>
                        <span>{line.slice(1)}</span>
                      </div>
                    );
                  }
                  if (line === "") return <div key={i} style={{ marginBottom: 6 }} />;
                  // First non-empty line is the risk level summary — highlight it
                  if (i === 0) {
                    return (
                      <div key={i} style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 6 }}>
                        {line}
                      </div>
                    );
                  }
                  if (line === "Allocation breakdown:") {
                    return (
                      <div key={i} style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 4, marginTop: 4 }}>
                        {line}
                      </div>
                    );
                  }
                  return <div key={i} style={{ marginBottom: 4 }}>{line}</div>;
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* How it works */}
      {!portfolioResult && !loading && (
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#8b949e", textTransform: "uppercase" }}>
            How It Works
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                num: "01",
                title: "Probability Estimation",
                desc: "ML models analyze price trajectories to predict true probabilities for each market",
              },
              {
                num: "02",
                title: "Edge Detection",
                desc: "Compare model estimates vs market prices to find mispriced contracts",
              },
              {
                num: "03",
                title: "Kelly-Markowitz",
                desc: "Optimize position sizing using Kelly Criterion constrained by portfolio theory",
              },
            ].map(({ num, title, desc }) => (
              <div key={num}>
                <div style={{ color: "#00d395", fontSize: 22, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", opacity: 0.5, marginBottom: 8 }}>
                  {num}
                </div>
                <div style={{ color: "#e6edf3", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
                <div style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
