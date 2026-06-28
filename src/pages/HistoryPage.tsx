import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { HistoryResponse } from "../types";
import { StatCard } from "../components/shared/StatCard";
import { LoadingSpinner, ErrorMessage } from "../components/shared/LoadingSpinner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

export function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    api
      .history()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading performance data..." />;
  if (error) return <ErrorMessage message={`Failed to load history: ${error}`} />;
  if (!data) return null;

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const history = data.history.slice(-days);

  const tickFormat = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  };

  const tooltipStyle = {
    backgroundColor: "#1a2332",
    border: "1px solid #21262d",
    borderRadius: 8,
    color: "#e6edf3",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>
            Performance
          </h1>
          <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
            Historical backtested performance of model recommendations
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: period === p ? "#00d395" : "#21262d",
                color: period === p ? "#0d1117" : "#8b949e",
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Cumulative Return"
          value={`${data.total_return >= 0 ? "+" : ""}${data.total_return.toFixed(1)}%`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          }
        />
        <StatCard
          label="Portfolio Value"
          value={`$${((1 + data.total_return / 100) * 10000).toFixed(0)}`}
          subtext="starting from $10,000"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          }
        />
        <StatCard
          label="Avg Win Rate"
          value={`${(data.win_rate * 100).toFixed(1)}%`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          }
        />
        <StatCard
          label="Sharpe Ratio"
          value={data.sharpe_ratio.toFixed(2)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 20 18 10" /><polyline points="12 20 12 4" /><polyline points="6 20 6 14" />
            </svg>
          }
        />
      </div>

      {/* Cumulative Return Chart */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #21262d",
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
          Cumulative Return
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormat}
              tick={{ fill: "#8b949e", fontSize: 11 }}
              axisLine={{ stroke: "#21262d" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#8b949e", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Cumulative Return"]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => tickFormat(String(label))}
            />
            <ReferenceLine y={0} stroke="#21262d" />
            <Line
              type="monotone"
              dataKey="cumulative_return"
              stroke="#00d395"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#00d395" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Daily Returns */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            Daily Returns
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={tickFormat}
                tick={{ fill: "#8b949e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#8b949e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Daily Return"]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(label: any) => tickFormat(String(label))}
              />
              <ReferenceLine y={0} stroke="#21262d" />
              <Bar dataKey="daily_return" radius={[2, 2, 0, 0]}>
                {history.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.daily_return >= 0 ? "#00d395" : "#f85149"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win Rate Over Time */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            Win Rate Over Time
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tickFormatter={tickFormat}
                tick={{ fill: "#8b949e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fill: "#8b949e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0.3, 0.9]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${(Number(v) * 100).toFixed(1)}%`, "Win Rate"]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(label: any) => tickFormat(String(label))}
              />
              <Line
                type="monotone"
                dataKey="win_rate"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: 24,
          backgroundColor: "rgba(243,186,47,0.06)",
          border: "1px solid rgba(243,186,47,0.25)",
          borderRadius: 10,
          padding: "14px 20px",
          fontSize: 13,
          color: "#8b949e",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#f3ba2f" }}>Disclaimer:</strong> Performance shown is backtested and does not guarantee future results. Prediction markets involve significant risk. Past model accuracy may not persist. This tool is for informational purposes only — not financial advice.
      </div>
    </div>
  );
}
