import { useState } from "react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { ErrorMessage } from "../components/shared/LoadingSpinner";
import { CoinBadge } from "../components/shared/CoinBadge";
import {
  formatPercent,
  formatEdge,
  formatDollar,
  formatProbability,
  getCoinColor,
  truncate,
} from "../utils/format";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import type { ModelComparison } from "../types";

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
      <div
        style={{
          color: "#00d395",
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {formatDollar(dollars)}
      </div>
      <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>
        {value}% of portfolio
      </div>
    </div>
  );
}

// ── Benchmark data from compare_models.py (15,325 samples, 20% test split) ──
// Each name is "line1|line2" — rendered as two-line tick by TwoLineTick
const BENCHMARK_ACCURACY = [
  { name: "Random|Baseline", value: 52.2, ours: false },
  { name: "Linear|Regression", value: 87.5, ours: false },
  { name: "Ridge|Regression", value: 87.5, ours: false },
  { name: "Logistic|Regression", value: 87.4, ours: false },
  { name: "Our|Ensemble", value: 88.2, ours: true },
];

const BENCHMARK_AUC = [
  { name: "Random|Baseline", value: 50.7, ours: false },
  { name: "Linear|Regression", value: 95.5, ours: false },
  { name: "Ridge|Regression", value: 95.5, ours: false },
  { name: "Logistic|Regression", value: 95.5, ours: false },
  { name: "Our|Ensemble", value: 96.0, ours: true },
];

const BENCHMARK_BRIER = [
  { name: "Random|Baseline", value: 47.8, ours: false },
  { name: "Linear|Regression", value: 8.44, ours: false },
  { name: "Ridge|Regression", value: 8.44, ours: false },
  { name: "Logistic|Regression", value: 8.42, ours: false },
  { name: "Our|Ensemble", value: 8.0, ours: true },
];

// Custom X-axis tick that renders "Line1|Line2" as two SVG tspan lines
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TwoLineTick({
  x,
  y,
  payload,
  ours,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  ours?: boolean;
}) {
  const nx = typeof x === "string" ? parseFloat(x) : (x ?? 0);
  const ny = typeof y === "string" ? parseFloat(y) : (y ?? 0);
  // reassign to typed vars used below
  const cx = nx;
  const cy = ny;
  const [line1, line2] = (payload?.value ?? "").split("|");
  const color = ours ? "#00d395" : "#8b949e";
  return (
    <g transform={`translate(${cx},${cy})`}>
      <text
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontWeight={ours ? 700 : 400}
      >
        <tspan x={0} dy={6}>
          {line1}
        </tspan>
        <tspan x={0} dy={13}>
          {line2}
        </tspan>
      </text>
    </g>
  );
}

function MetricBar({
  data,
  label,
  unit,
  lowerIsBetter,
}: {
  data: { name: string; value: number; ours: boolean }[];
  label: string;
  unit: string;
  lowerIsBetter?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const domain: [number, number] = lowerIsBetter
    ? [0, max * 1.08]
    : [Math.max(0, min * 0.94), Math.min(100, max * 1.04)];

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#8b949e",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}{" "}
        <span
          style={{
            color: lowerIsBetter ? "#f85149" : "#00d395",
            fontWeight: 400,
          }}
        >
          ({lowerIsBetter ? "lower = better" : "higher = better"})
        </span>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={data}
          margin={{ top: 18, right: 8, left: -10, bottom: 30 }}
          barCategoryGap="28%"
        >
          <CartesianGrid vertical={false} stroke="#21262d" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={(props) => {
              const entry = data.find((d) => d.name === props.payload?.value);
              return <TwoLineTick {...props} ours={entry?.ours} />;
            }}
          />
          <YAxis
            domain={domain}
            tick={{ fill: "#8b949e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.ours ? "#00d395" : "#21262d"}
                stroke={entry.ours ? "#00d395" : "#30363d"}
                strokeWidth={1}
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: unknown) => `${v}${unit}`}
              style={{ fill: "#e6edf3", fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Static benchmark data: grouped by model for a single grouped bar chart
const BENCHMARK_GROUPED = [
  {
    metric: "Accuracy",
    "Random Baseline": 52.2,
    "Linear Reg": 87.5,
    "Logistic Reg": 87.4,
    "Our Ensemble": 88.2,
  },
  {
    metric: "AUC-ROC",
    "Random Baseline": 50.7,
    "Linear Reg": 95.5,
    "Logistic Reg": 95.5,
    "Our Ensemble": 96.0,
  },
  {
    metric: "Brier ×100 ↓",
    "Random Baseline": 47.8,
    "Linear Reg": 8.44,
    "Logistic Reg": 8.42,
    "Our Ensemble": 8.0,
  },
];

function ModelPerformancePanel({
  comparison,
}: {
  comparison?: ModelComparison;
}) {
  const advantagePositive = (comparison?.edge_advantage_pct ?? 0) >= 0;
  const perCoinData = comparison?.per_coin ?? [];

  // For live per-coin chart: show actual probability estimates (market, LR, ours)
  const perCoinChartData = perCoinData.map((row) => ({
    coin: row.coin,
    "Market Price": parseFloat((row.market_price * 100).toFixed(1)),
    "LR Estimate": parseFloat((row.lr_estimate * 100).toFixed(1)),
    "Our Estimate": parseFloat((row.our_estimate * 100).toFixed(1)),
    our_edge: parseFloat((row.our_edge * 100).toFixed(1)),
    lr_edge: parseFloat((row.lr_edge * 100).toFixed(1)),
    advantage: parseFloat(((row.our_edge - row.lr_edge) * 100).toFixed(1)),
  }));

  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #21262d",
        borderRadius: 12,
        padding: 24,
        marginTop: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          ◈
        </div>
        <h2
          style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6edf3" }}
        >
          Model Performance vs Baselines
        </h2>
        {comparison && (
          <span style={{ fontSize: 11, color: "#8b949e", marginLeft: "auto" }}>
            Live — {comparison.n_markets} market
            {comparison.n_markets !== 1 ? "s" : ""} this run
          </span>
        )}
      </div>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 12,
          color: "#8b949e",
          lineHeight: 1.6,
        }}
      >
        {comparison
          ? "Real-time comparison on today's selected markets — same features, same data fed to both models."
          : "Benchmarked on 15,325 real Polymarket outcomes (80/20 train/test split, stratified)."}
      </p>

      {comparison ? (
        <>
          {/* 3 summary stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Our edge",
                value: `+${comparison.our_mean_edge_pct.toFixed(2)}%`,
                sub: "avg signed edge on selected markets",
                color: "#00d395",
              },
              {
                label: "LR edge (same markets)",
                value: `${comparison.lr_mean_edge_pct >= 0 ? "+" : ""}${comparison.lr_mean_edge_pct.toFixed(2)}%`,
                sub: "LR sees less alpha on our picks",
                color: "#8b949e",
              },
              {
                label: "Our advantage",
                value: `${advantagePositive ? "+" : ""}${comparison.edge_advantage_pct.toFixed(2)}%`,
                sub: `r = ${comparison.prediction_correlation.toFixed(3)} model correlation`,
                color: advantagePositive ? "#00d395" : "#f85149",
              },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #21262d",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{ fontSize: 11, color: "#8b949e", marginBottom: 4 }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 10, color: "#8b949e", marginTop: 2 }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* Per-coin grouped bar: Our Edge vs LR Edge */}
          {perCoinChartData.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "#8b949e",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Probability estimates per coin — Market vs LR vs Our Model
              </div>
              {/* Legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                {[
                  { color: "#30363d", label: "Market Price" },
                  { color: "#8b5cf6", label: "LR Estimate" },
                  { color: "#00d395", label: "Our Estimate" },
                ].map(({ color, label }) => (
                  <div
                    key={label}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: color,
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#8b949e" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={perCoinChartData}
                  margin={{ top: 14, right: 8, left: -20, bottom: 0 }}
                  barCategoryGap="25%"
                  barGap={3}
                >
                  <CartesianGrid vertical={false} stroke="#21262d" />
                  <XAxis
                    dataKey="coin"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b949e", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b949e", fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2332",
                      border: "1px solid #21262d",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e6edf3", fontWeight: 700 }}
                    formatter={(value: unknown, name: string) => [
                      `${value}%`,
                      name,
                    ]}
                  />
                  <Bar dataKey="Market Price" fill="#30363d" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="LR Estimate" fill="#8b5cf6" radius={[3, 3, 0, 0]}>
                    <LabelList
                      dataKey="LR Estimate"
                      position="top"
                      formatter={(v: unknown) => `${v}%`}
                      style={{ fill: "#8b5cf6", fontSize: 9, fontWeight: 600 }}
                    />
                  </Bar>
                  <Bar dataKey="Our Estimate" fill="#00d395" radius={[3, 3, 0, 0]}>
                    <LabelList
                      dataKey="Our Estimate"
                      position="top"
                      formatter={(v: unknown) => `${v}%`}
                      style={{ fill: "#00d395", fontSize: 9, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Per-coin breakdown table */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {perCoinChartData.map((row) => (
                  <div
                    key={row.coin}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 1fr 1fr 80px",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: "#0d1117",
                      border: "1px solid #21262d",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#e6edf3", fontWeight: 700 }}>{row.coin}</span>
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 1 }}>Market</div>
                      <span style={{ color: "#8b949e", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{row["Market Price"]}%</span>
                    </div>
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 1 }}>LR Est. <span style={{ color: row.lr_edge >= 0 ? "#8b5cf6" : "#f85149" }}>({row.lr_edge >= 0 ? "+" : ""}{row.lr_edge}%)</span></div>
                      <span style={{ color: "#8b5cf6", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{row["LR Estimate"]}%</span>
                    </div>
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 1 }}>Our Est. <span style={{ color: row.our_edge >= 0 ? "#00d395" : "#f85149" }}>({row.our_edge >= 0 ? "+" : ""}{row.our_edge}%)</span></div>
                      <span style={{ color: "#00d395", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{row["Our Estimate"]}%</span>
                    </div>
                    <div style={{
                      textAlign: "right",
                      backgroundColor: row.advantage >= 0 ? "rgba(0,211,149,0.08)" : "rgba(248,81,73,0.08)",
                      border: `1px solid ${row.advantage >= 0 ? "rgba(0,211,149,0.25)" : "rgba(248,81,73,0.25)"}`,
                      borderRadius: 6,
                      padding: "3px 8px",
                    }}>
                      <div style={{ color: "#8b949e", fontSize: 9, marginBottom: 1 }}>Our adv.</div>
                      <span style={{ color: row.advantage >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 12 }}>
                        {row.advantage >= 0 ? "+" : ""}{row.advantage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Static benchmark: grouped bar chart across 3 metrics */}
          <div
            style={{
              fontSize: 11,
              color: "#8b949e",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            Accuracy, AUC-ROC & Brier Score — 4-model comparison (15,325
            samples)
          </div>
          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            {[
              { color: "#30363d", label: "Random Baseline" },
              { color: "#6e7681", label: "Linear Reg" },
              { color: "#8b5cf6", label: "Logistic Reg" },
              { color: "#00d395", label: "Our Ensemble" },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: color,
                  }}
                />
                <span style={{ fontSize: 11, color: "#8b949e" }}>{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={BENCHMARK_GROUPED}
              margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="30%"
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke="#21262d" />
              <XAxis
                dataKey="metric"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b949e", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b949e", fontSize: 10 }}
                domain={[0, 105]}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a2332",
                  border: "1px solid #21262d",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e6edf3", fontWeight: 700 }}
                formatter={(value: unknown) => [`${value}`, ""]}
              />
              <Bar
                dataKey="Random Baseline"
                fill="#30363d"
                radius={[2, 2, 0, 0]}
              />
              <Bar dataKey="Linear Reg" fill="#6e7681" radius={[2, 2, 0, 0]} />
              <Bar
                dataKey="Logistic Reg"
                fill="#8b5cf6"
                radius={[2, 2, 0, 0]}
              />
              <Bar dataKey="Our Ensemble" fill="#00d395" radius={[2, 2, 0, 0]}>
                <LabelList
                  dataKey="Our Ensemble"
                  position="top"
                  formatter={(v: unknown) => `${v}`}
                  style={{ fill: "#00d395", fontSize: 9, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Gain callouts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            {[
              {
                label: "vs Logistic Reg — Accuracy",
                value: "+0.8pp",
                note: "88.2% vs 87.4%",
              },
              {
                label: "vs Logistic Reg — AUC-ROC",
                value: "+0.5pp",
                note: "96.0% vs 95.5%",
              },
              {
                label: "vs Logistic Reg — Brier ↓",
                value: "5.0% better",
                note: "8.00 vs 8.42",
              },
            ].map(({ label, value, note }) => (
              <div
                key={label}
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid rgba(0,211,149,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#8b949e", marginBottom: 4 }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#00d395",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 10, color: "#8b949e", marginTop: 2 }}>
                  {note}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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
    setPortfolioResult(null); // clear previous result immediately so UI resets
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
    ? Object.entries(portfolioResult.allocations).sort(
        ([, a], [, b]) => b.weight - a.weight,
      )
    : [];

  // Use the amount that was actually sent to the API (stored in portfolioResult.amount)
  const resultAmount = portfolioResult?.amount ?? amount;

  const pieData = allocations
    .filter(([, a]) => a.weight > 0)
    .map(([, a]) => ({
      name: a.coin,
      value: Math.round(a.weight * 100),
      color: getCoinColor(a.coin),
    }));

  const totalWeight = allocations.reduce((sum, [, a]) => sum + a.weight, 0);
  const totalDollarAllocated = allocations.reduce(
    (sum, [, a]) => sum + a.dollar_amount,
    0,
  );
  const cashRemaining = resultAmount - totalDollarAllocated;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}
        >
          Portfolio Optimizer
        </h1>
        <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
          Kelly-Markowitz optimal allocation across prediction markets
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Risk Tolerance */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#e6edf3",
                }}
              >
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ color: "#8b949e", fontSize: 12 }}>Conservative</span>
            <span
              style={{
                color: "#e6edf3",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {riskLevel} / 10
            </span>
            <span style={{ color: "#8b949e", fontSize: 12 }}>Aggressive</span>
          </div>

          {/* Risk level tick marks */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
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
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "#e6edf3",
              }}
            >
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
            <span style={{ color: "#8b949e", fontSize: 18, fontWeight: 600 }}>
              $
            </span>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {AMOUNT_PRESETS.map(({ value, label, sub }) => {
              const isActive = activePreset === value;
              return (
                <button
                  key={value}
                  onClick={() => handlePresetClick(value)}
                  style={{
                    background: isActive ? "rgba(0,211,149,0.08)" : "#0d1117",
                    border: isActive
                      ? "1px solid #00d395"
                      : "1px solid #21262d",
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
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>
                    {sub}
                  </div>
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
                width: 25,
                height: 25,
                border: "2px solid #8b949e",
                borderTopColor: "#e6edf3",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Running optimizer...
          </>
        ) : (
          <> Get Optimal Allocation</>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              gap: 20,
            }}
          >
            {/* Pie chart */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#e6edf3",
                }}
              >
                Allocation
              </h2>
              <p style={{ margin: "0 0 16px", color: "#8b949e", fontSize: 12 }}>
                Hover a slice for exact dollar amount
              </p>
              {/* Compact inline legend — all coins on one row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px 10px",
                  marginBottom: 8,
                }}
              >
                {pieData.map((entry) => (
                  <div
                    key={entry.name}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: entry.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#8b949e", fontSize: 11 }}>
                      {entry.name}
                    </span>
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
                  <Tooltip
                    content={(props: any) => (
                      <PieTooltip {...props} totalAmount={resultAmount} />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Per-coin dollar breakdown under pie */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {allocations
                  .filter(([, a]) => a.weight > 0)
                  .map(([key, alloc]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            backgroundColor: getCoinColor(alloc.coin),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "#8b949e", fontSize: 11 }}>
                          {alloc.coin}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#8b949e",
                            fontSize: 11,
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {formatPercent(alloc.weight)}
                        </span>
                        <span
                          style={{
                            color: "#00d395",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "JetBrains Mono, monospace",
                            minWidth: 55,
                            textAlign: "right",
                          }}
                        >
                          {formatDollar(alloc.dollar_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                {cashRemaining > 0.01 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid #21262d",
                      paddingTop: 6,
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#21262d",
                          border: "1px solid #30363d",
                        }}
                      />
                      <span style={{ color: "#8b949e", fontSize: 12 }}>
                        Cash
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <span
                        style={{
                          color: "#8b949e",
                          fontSize: 12,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {formatPercent(cashRemaining / resultAmount)}
                      </span>
                      <span
                        style={{
                          color: "#8b949e",
                          fontSize: 13,
                          fontFamily: "JetBrains Mono, monospace",
                          minWidth: 60,
                          textAlign: "right",
                        }}
                      >
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
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#e6edf3",
                  }}
                >
                  Portfolio Breakdown
                </h2>
                <p style={{ margin: 0, color: "#8b949e", fontSize: 12 }}>
                  Based on {formatDollar(resultAmount)} investment ·
                  Kelly-Markowitz optimal sizing
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...COL_STYLE }}>Coin</th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>
                      Weight
                    </th>
                    <th
                      style={{
                        ...COL_STYLE,
                        textAlign: "right" as const,
                        color: "#00d395",
                      }}
                    >
                      Invest ($)
                    </th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>
                      Market Price
                    </th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>
                      Model Est.
                    </th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>
                      Edge
                    </th>
                    <th style={{ ...COL_STYLE, textAlign: "right" as const }}>
                      Confidence
                    </th>
                    <th style={{ ...COL_STYLE }}>Horizon</th>
                    <th style={{ ...COL_STYLE }}>Market Question</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations
                    .filter(([, a]) => a.dollar_amount > 0)
                    .map(([key, alloc]) => (
                      <tr key={key} style={{ borderTop: "1px solid #21262d" }}>
                        <td style={{ padding: "14px 12px 14px 0" }}>
                          <CoinBadge coin={alloc.coin} size="sm" />
                        </td>
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "right",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#e6edf3",
                          }}
                        >
                          {formatPercent(alloc.weight)}
                        </td>
                        {/* Dollar amount — the key column, highlighted */}
                        <td
                          style={{ padding: "14px 12px", textAlign: "right" }}
                        >
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
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "right",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 14,
                            color: "#e6edf3",
                          }}
                        >
                          {formatProbability(alloc.market_price)}
                        </td>
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "right",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 14,
                            color: "#00d395",
                          }}
                        >
                          {formatProbability(alloc.our_estimate)}
                        </td>
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "right",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 13,
                            color: alloc.edge >= 0 ? "#00d395" : "#f85149",
                            fontWeight: 600,
                          }}
                        >
                          {formatEdge(alloc.edge)}
                        </td>
                        <td
                          style={{ padding: "14px 12px", textAlign: "right" }}
                        >
                          <div
                            style={{
                              display: "inline-block",
                              height: 6,
                              width: `${alloc.confidence * 60}px`,
                              minWidth: 20,
                              backgroundColor:
                                alloc.confidence > 0.7
                                  ? "#00d395"
                                  : alloc.confidence > 0.4
                                    ? "#f3ba2f"
                                    : "#8b949e",
                              borderRadius: 3,
                            }}
                          />
                          <span
                            style={{
                              color: "#8b949e",
                              fontSize: 12,
                              marginLeft: 6,
                            }}
                          >
                            {Math.round(alloc.confidence * 100)}%
                          </span>
                        </td>
                        <td style={{ padding: "14px 12px 14px 0" }}>
                          {(() => {
                            const HORIZON_LABEL: Record<string, string> = {
                              "1hour": "1 Hour",
                              "4hour": "4 Hour",
                              "1day": "Daily",
                              weekly: "Weekly",
                              all: "All",
                            };
                            const label =
                              HORIZON_LABEL[alloc.market_type] ??
                              alloc.market_type;
                            const isShort =
                              alloc.market_type === "1hour" ||
                              alloc.market_type === "4hour";
                            return (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  backgroundColor: isShort
                                    ? "rgba(0,211,149,0.08)"
                                    : "rgba(139,92,246,0.08)",
                                  border: `1px solid ${isShort ? "rgba(0,211,149,0.25)" : "rgba(139,92,246,0.25)"}`,
                                  color: isShort ? "#00d395" : "#8b5cf6",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td
                          style={{
                            padding: "14px 0",
                            color: "#8b949e",
                            fontSize: 12,
                            maxWidth: 200,
                          }}
                        >
                          {truncate(alloc.market?.question ?? "", 60)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr style={{ borderTop: "2px solid #30363d" }}>
                    <td
                      style={{
                        padding: "12px 12px 4px 0",
                        color: "#8b949e",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total
                    </td>
                    <td
                      style={{
                        padding: "12px 12px 4px",
                        textAlign: "right",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#e6edf3",
                      }}
                    >
                      {formatPercent(totalWeight)}
                    </td>
                    <td
                      style={{ padding: "12px 12px 4px", textAlign: "right" }}
                    >
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
                    <td
                      colSpan={6}
                      style={{
                        padding: "12px 0 4px",
                        color: "#8b949e",
                        fontSize: 12,
                      }}
                    >
                      {cashRemaining > 0.01 &&
                        `+ ${formatDollar(cashRemaining)} cash remaining`}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
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
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#e6edf3",
                  }}
                >
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
                  if (line === "")
                    return <div key={i} style={{ marginBottom: 4 }} />;
                  // Section headers like "━━━ This Run ━━━"
                  if (line.startsWith("━━━")) {
                    return (
                      <div
                        key={i}
                        style={{
                          color: "#00d395",
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginTop: 14,
                          marginBottom: 6,
                        }}
                      >
                        {line
                          .replace(/━━━\s*/g, "")
                          .replace(/\s*━━━/g, "")
                          .trim()}
                      </div>
                    );
                  }
                  // Top-level title line
                  if (line.startsWith("KELLY-MARKOWITZ")) {
                    return (
                      <div
                        key={i}
                        style={{
                          color: "#e6edf3",
                          fontWeight: 700,
                          fontSize: 15,
                          marginBottom: 12,
                        }}
                      >
                        {line}
                      </div>
                    );
                  }
                  // Expected gain callout — big green highlight
                  if (line.startsWith("EXPECTED GAIN")) {
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          backgroundColor: "rgba(0,211,149,0.08)",
                          border: "1px solid rgba(0,211,149,0.3)",
                          borderRadius: 10,
                          padding: "12px 18px",
                          marginBottom: 8,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ color: "#8b949e", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Est. Gain</span>
                        <span style={{ color: "#00d395", fontFamily: "JetBrains Mono, monospace", fontWeight: 800, fontSize: 22 }}>
                          {line.replace("EXPECTED GAIN", "").trim().split("  ")[0].trim()}
                        </span>
                        <span style={{ color: "#8b949e", fontSize: 12, marginLeft: 2 }}>
                          {line.replace("EXPECTED GAIN", "").trim().split("  ")[1]?.trim() ?? ""}
                        </span>
                      </div>
                    );
                  }
                  // Bullet points for coin positions
                  if (line.startsWith("•")) {
                    return (
                      <div
                        key={i}
                        style={{
                          color: "#e6edf3",
                          fontWeight: 600,
                          marginBottom: 2,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ color: "#00d395" }}>•</span>
                        {line.slice(1)}
                      </div>
                    );
                  }
                  // Indented detail lines under each coin
                  if (line.startsWith("  ")) {
                    return (
                      <div
                        key={i}
                        style={{
                          color: "#8b949e",
                          fontSize: 12,
                          paddingLeft: 14,
                          marginBottom: 2,
                        }}
                      >
                        {line.trim()}
                      </div>
                    );
                  }
                  return (
                    <div key={i} style={{ color: "#8b949e", marginBottom: 4 }}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Model performance benchmark */}
          <ModelPerformancePanel
            comparison={portfolioResult.model_comparison}
          />
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
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#8b949e",
              textTransform: "uppercase",
            }}
          >
            How It Works
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
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
                <div
                  style={{
                    color: "#00d395",
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono, monospace",
                    opacity: 0.5,
                    marginBottom: 8,
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    color: "#e6edf3",
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.5 }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
