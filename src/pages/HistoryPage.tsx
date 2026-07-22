import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { BacktestResponse, OOSResponse, StrategyStats, KellyChartPoint } from "../types";
import { StatCard } from "../components/shared/StatCard";
import { LoadingSpinner, ErrorMessage } from "../components/shared/LoadingSpinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#1a2332",
  border: "1px solid #21262d",
  borderRadius: 8,
  color: "#e6edf3",
  fontSize: 12,
};

const CARD_STYLE = {
  backgroundColor: "#161b22",
  border: "1px solid #21262d",
  borderRadius: 12,
  padding: 24,
};

function SummaryTable({ stats }: { stats: StrategyStats[] }) {
  const cols: { key: keyof StrategyStats; label: string; fmt: (v: number | string) => string }[] = [
    { key: "n_trades",               label: "Trades",       fmt: (v) => String(v) },
    { key: "total_pnl",              label: "Total PnL",    fmt: (v) => `$${(+v).toFixed(2)}` },
    { key: "roi_pct",                label: "ROI",          fmt: (v) => `${(+v).toFixed(2)}%` },
    { key: "win_rate_pct",           label: "Win Rate",     fmt: (v) => `${(+v).toFixed(1)}%` },
    { key: "direction_accuracy_pct", label: "Dir. Acc.",    fmt: (v) => `${(+v).toFixed(1)}%` },
    { key: "sharpe",                 label: "Sharpe",       fmt: (v) => `${(+v).toFixed(3)}` },
    { key: "max_drawdown_pct",       label: "Max DD",       fmt: (v) => `${(+v).toFixed(1)}%` },
  ];

  const colors = ["#00d395", "#8b5cf6", "#45aaf2", "#f3ba2f"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#8b949e", fontWeight: 600, borderBottom: "1px solid #21262d" }}>Strategy</th>
            {cols.map((c) => (
              <th key={c.key} style={{ textAlign: "right", padding: "8px 12px", color: "#8b949e", fontWeight: 600, borderBottom: "1px solid #21262d" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={s.label} style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
              <td style={{ padding: "10px 12px", color: colors[i], fontWeight: 700 }}>{s.label}</td>
              {cols.map((c) => {
                const raw = s[c.key] as number;
                const isROI  = c.key === "roi_pct" || c.key === "total_pnl";
                const color  = isROI ? (raw >= 0 ? "#00d395" : "#f85149") : "#e6edf3";
                return (
                  <td key={c.key} style={{ textAlign: "right", padding: "10px 12px", color, fontFamily: "JetBrains Mono, monospace" }}>
                    {c.fmt(raw)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HistoryPage() {
  const [data, setData]       = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [oosData, setOosData] = useState<OOSResponse | null>(null);
  const [oosLoading, setOosLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api.history()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setOosLoading(true);
    api.oosHistory()
      .then(setOosData)
      .catch(() => setOosData(null))
      .finally(() => setOosLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunBacktest = async () => {
    setRunning(true);
    setError(null);
    try {
      await api.runBacktest();
      load();
    } catch (e) {
      setError((e as Error).message);
      setRunning(false);
    }
  };

  const tickFormat = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  };

  // ── No backtest data yet ──────────────────────────────────────────────────
  if (!loading && (error?.includes("No backtest results") || error?.includes("404"))) {
    return (
      <div>
        <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>Performance</h1>
        <p style={{ color: "#8b949e", fontSize: 14, marginBottom: 32 }}>Real backtested results against closed Polymarket markets.</p>
        <div style={{ ...CARD_STYLE, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h2 style={{ color: "#e6edf3", marginBottom: 8 }}>No backtest data yet</h2>
          <p style={{ color: "#8b949e", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Run the backtester to fetch closed markets, simulate our model vs baselines, and generate real performance metrics.
            This takes a few minutes.
          </p>
          <button
            onClick={handleRunBacktest}
            disabled={running}
            style={{
              padding: "12px 28px",
              borderRadius: 8,
              border: "none",
              cursor: running ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: running ? "#21262d" : "#00d395",
              color: running ? "#8b949e" : "#0d1117",
            }}
          >
            {running ? "Running backtest... (this takes a few minutes)" : "Run Backtest Now"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading backtest results..." />;
  if (error)   return <ErrorMessage message={`Failed to load backtest: ${error}`} />;
  if (!data)   return null;

  const { summary, cumulative_chart, coin_breakdown, meta, trades } = data;
  const our = summary.our_model_flat ?? summary.our_model;
  const statsArray = [
    summary.our_model_flat,
    summary.lr_baseline,
    ...(summary.rf_baseline ? [summary.rf_baseline] : []),
    summary.uniform,
  ];

  // Fill nulls in chart for display
  const chartData = cumulative_chart.map((pt) => ({
    date:     pt.date,
    our_flat: pt.our_flat ?? undefined,
    lr:       pt.lr       ?? undefined,
    rf:       pt.rf       ?? undefined,
    uniform:  pt.uniform  ?? undefined,
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e6edf3" }}>Performance</h1>
          <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: 14 }}>
            Real backtest on {meta.n_valid_trades} closed Polymarket markets · generated {meta.generated_at.slice(0, 10)}
          </p>
        </div>
        <button
          onClick={handleRunBacktest}
          disabled={running}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            cursor: running ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600,
            backgroundColor: running ? "#21262d" : "#21262d",
            color: running ? "#8b949e" : "#e6edf3",
            transition: "all 0.15s",
          }}
        >
          {running ? "Running..." : "Re-run Backtest"}
        </button>
      </div>

      {/* Stat Cards — Our model */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Our Model ROI"
          value={`${our.roi_pct >= 0 ? "+" : ""}${our.roi_pct.toFixed(2)}%`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>}
        />
        <StatCard
          label="Total PnL"
          value={`${our.total_pnl >= 0 ? "+$" : "-$"}${Math.abs(our.total_pnl).toFixed(2)}`}
          subtext={`across ${our.n_trades} trades`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>}
        />
        <StatCard
          label="Win Rate"
          value={`${our.win_rate_pct.toFixed(1)}%`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>}
        />
        <StatCard
          label="Sharpe Ratio"
          value={our.sharpe.toFixed(3)}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 20 18 10" /><polyline points="12 20 12 4" /><polyline points="6 20 6 14" /></svg>}
        />
      </div>

      {/* Cumulative PnL Chart — fair flat-bet comparison */}
      <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
          Cumulative PnL by Strategy
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8b949e" }}>
          All strategies use a flat $20 bet per trade — fair model quality comparison
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="date" tickFormatter={tickFormat} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any, name: any) => [`$${Number(v).toFixed(2)}`, name]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(l: any) => tickFormat(String(l))}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#8b949e" }} />
            <ReferenceLine y={0} stroke="#30363d" />
            <Line type="monotone" dataKey="our_flat" name="Our Model (Flat $20)"     stroke="#00d395" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="lr"        name="LR Baseline (Flat $20)"  stroke="#8b5cf6" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="rf"        name="Random Forest (Flat $20)" stroke="#45aaf2" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="uniform"   name="Always-YES (Flat $20)"   stroke="#f3ba2f" strokeWidth={1.5} dot={false} strokeDasharray="4 4" activeDot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Comparison Table */}
      <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
          Strategy Comparison
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8b949e" }}>
          Same closed markets, same features, flat $20 bet per trade — pure model quality comparison
        </p>
        <SummaryTable stats={statsArray} />
      </div>

      {/* Kelly Fraction Comparison */}
      {data.kelly_comparison?.length > 0 && (
        <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            Kelly Fraction Comparison
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8b949e" }}>
            Same model predictions, same 516 trades — only the bet sizing changes. Shows the risk/return trade-off between Full, Half, and Quarter Kelly.
          </p>

          {/* Kelly chart */}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={(data.kelly_chart as KellyChartPoint[]).map(p => ({ ...p }))}
              margin={{ top: 4, right: 12, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="date" tickFormatter={(d) => { const dt = new Date(d); return `${dt.toLocaleString("default",{month:"short"})} ${dt.getDate()}`; }} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => [`$${Number(v).toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b949e" }} />
              <ReferenceLine y={0} stroke="#30363d" />
              <Line type="monotone" dataKey="full"    name="Full Kelly (1.0×)"     stroke="#f85149" strokeWidth={2}   dot={false} connectNulls />
              <Line type="monotone" dataKey="half"    name="Half Kelly (0.5×)"     stroke="#00d395" strokeWidth={2}   dot={false} connectNulls />
              <Line type="monotone" dataKey="quarter" name="Quarter Kelly (0.25×)" stroke="#8b5cf6" strokeWidth={2}   dot={false} connectNulls />
              <Line type="monotone" dataKey="uniform" name="Uniform ($20 flat)"    stroke="#f3ba2f" strokeWidth={1.5} dot={false} strokeDasharray="4 4" connectNulls />
            </LineChart>
          </ResponsiveContainer>

          {/* Kelly stats table */}
          <div style={{ marginTop: 20 }}>
            <SummaryTable stats={data.kelly_comparison} />
          </div>
        </div>
      )}

      {/* Per-coin breakdown */}
      <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
          Per-Coin Breakdown (Our Model)
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Coin", "Trades", "Total PnL", "Win Rate", "Mean Edge"].map((h) => (
                <th key={h} style={{ textAlign: h === "Coin" ? "left" : "right", padding: "8px 12px", color: "#8b949e", fontWeight: 600, borderBottom: "1px solid #21262d" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coin_breakdown.sort((a, b) => b.our_pnl - a.our_pnl).map((c, i) => (
              <tr key={c.coin} style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td style={{ padding: "10px 12px", color: "#e6edf3", fontWeight: 700 }}>{c.coin}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#8b949e" }}>{c.n_trades}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: c.our_pnl >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace" }}>
                  {c.our_pnl >= 0 ? "+$" : "-$"}{Math.abs(c.our_pnl).toFixed(2)}
                </td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#e6edf3" }}>{c.win_rate.toFixed(1)}%</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#8b949e" }}>{c.mean_edge.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent trades table */}
      <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
          Recent Trades ({trades.length} total)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Date", "Coin", "Market", "Price", "Est.", "Edge", "Bet", "Outcome", "PnL"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Market" ? "left" : "right", padding: "8px 10px", color: "#8b949e", fontWeight: 600, borderBottom: "1px solid #21262d", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...trades].reverse().slice(0, 50).map((t, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e", whiteSpace: "nowrap" }}>{t.end_date}</td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: "#e6edf3", fontWeight: 700 }}>{t.coin}</td>
                  <td style={{ padding: "8px 10px", color: "#8b949e", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.question}</td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e", fontFamily: "JetBrains Mono, monospace" }}>{(t.market_price * 100).toFixed(1)}¢</td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: "#e6edf3", fontFamily: "JetBrains Mono, monospace" }}>{(t.our_estimate * 100).toFixed(1)}¢</td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: t.our_edge >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace" }}>
                    {t.our_edge >= 0 ? "+" : ""}{(t.our_edge * 100).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e", fontFamily: "JetBrains Mono, monospace" }}>${t.our_bet.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "8px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      backgroundColor: t.outcome === 1 ? "rgba(0,211,149,0.15)" : "rgba(248,81,73,0.15)",
                      color: t.outcome === 1 ? "#00d395" : "#f85149",
                    }}>
                      {t.outcome === 1 ? "YES" : "NO"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", padding: "8px 10px", color: t.our_pnl >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                    {t.our_pnl >= 0 ? "+$" : "-$"}{Math.abs(t.our_pnl).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length > 50 && (
            <p style={{ textAlign: "center", color: "#8b949e", fontSize: 12, marginTop: 12 }}>
              Showing 50 of {trades.length} trades
            </p>
          )}
        </div>
      </div>

      {/* Backtest config */}
      <div style={{ ...CARD_STYLE, marginBottom: 20, fontSize: 12, color: "#8b949e" }}>
        <strong style={{ color: "#e6edf3" }}>Backtest Config</strong>
        <span style={{ marginLeft: 16 }}>Kelly fraction: {meta.kelly_fraction}</span>
        <span style={{ marginLeft: 16 }}>Session bankroll: ${meta.session_bankroll}</span>
        <span style={{ marginLeft: 16 }}>Price zone: {(meta.price_filter[0]*100).toFixed(0)}¢–{(meta.price_filter[1]*100).toFixed(0)}¢</span>
        <span style={{ marginLeft: 16 }}>Edge filter: {(meta.edge_filter[0]*100).toFixed(0)}%–{(meta.edge_filter[1]*100).toFixed(0)}%</span>
        <span style={{ marginLeft: 16 }}>Markets seen: {meta.n_markets_seen.toLocaleString()}</span>
      </div>

      {/* ── Out-of-Sample Evaluation section ─────────────────────────────── */}
      <div style={{ ...CARD_STYLE, marginBottom: 20, borderColor: "rgba(0,211,149,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
            Out-of-Sample Evaluation
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            backgroundColor: "rgba(0,211,149,0.15)", color: "#00d395", letterSpacing: "0.05em",
          }}>TRUE OOS</span>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#8b949e" }}>
          Models trained exclusively on pre-June 2026 data, tested on June 2026 markets they have never seen.
          Flat $20 bet per trade — fair comparison across all models.
        </p>

        {oosLoading ? (
          <p style={{ color: "#8b949e", fontSize: 13 }}>Loading OOS results...</p>
        ) : !oosData ? (
          <p style={{ color: "#8b949e", fontSize: 13 }}>
            No OOS results found. Run: <code style={{ color: "#00d395" }}>python -m src.backtest.oos_eval</code>
          </p>
        ) : (
          <>
            {/* OOS summary cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Our Model ROI", value: `${oosData.summary.our_model.roi_pct >= 0 ? "+" : ""}${oosData.summary.our_model.roi_pct.toFixed(1)}%`, positive: oosData.summary.our_model.roi_pct >= 0 },
                { label: "LR Baseline ROI", value: `${oosData.summary.lr_baseline.roi_pct >= 0 ? "+" : ""}${oosData.summary.lr_baseline.roi_pct.toFixed(1)}%`, positive: oosData.summary.lr_baseline.roi_pct >= 0 },
                { label: "RF Baseline ROI", value: `${oosData.summary.rf_baseline.roi_pct >= 0 ? "+" : ""}${oosData.summary.rf_baseline.roi_pct.toFixed(1)}%`, positive: oosData.summary.rf_baseline.roi_pct >= 0 },
                { label: "OOS Trades", value: String(oosData.meta.n_trades), positive: true },
              ].map((card) => (
                <div key={card.label} style={{
                  flex: "1 1 140px",
                  backgroundColor: "#0d1117",
                  border: "1px solid #21262d",
                  borderRadius: 10,
                  padding: "14px 18px",
                }}>
                  <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 6, fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: card.positive ? "#00d395" : "#f85149" }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* OOS comparison table */}
            <SummaryTable stats={[
              oosData.summary.our_model,
              oosData.summary.lr_baseline,
              oosData.summary.rf_baseline,
              oosData.summary.uniform,
            ]} />

            {/* OOS trade list */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>
                OOS Trades ({oosData.trades.length})
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Date", "Coin", "Type", "Market", "Price", "Est.", "Edge", "Outcome", "Our PnL", "LR PnL", "RF PnL"].map((h) => (
                        <th key={h} style={{ textAlign: h === "Market" ? "left" : "right", padding: "8px 10px", color: "#8b949e", fontWeight: 600, borderBottom: "1px solid #21262d", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {oosData.trades.map((t, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e", whiteSpace: "nowrap" }}>{t.end_date}</td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: "#e6edf3", fontWeight: 700 }}>{t.coin}</td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e" }}>{t.market_type}</td>
                        <td style={{ padding: "8px 10px", color: "#8b949e", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.question}</td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: "#8b949e", fontFamily: "JetBrains Mono, monospace" }}>{(t.entry_price * 100).toFixed(1)}¢</td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: "#e6edf3", fontFamily: "JetBrains Mono, monospace" }}>{(t.our_estimate * 100).toFixed(1)}¢</td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: t.our_edge >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace" }}>
                          {t.our_edge >= 0 ? "+" : ""}{(t.our_edge * 100).toFixed(1)}%
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 10px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                            backgroundColor: t.outcome === 1 ? "rgba(0,211,149,0.15)" : "rgba(248,81,73,0.15)",
                            color: t.outcome === 1 ? "#00d395" : "#f85149",
                          }}>
                            {t.outcome === 1 ? "YES" : "NO"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: t.our_pnl >= 0 ? "#00d395" : "#f85149", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                          {t.our_pnl >= 0 ? "+$" : "-$"}{Math.abs(t.our_pnl).toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: (t.lr_pnl ?? 0) >= 0 ? "#8b5cf6" : "#f85149", fontFamily: "JetBrains Mono, monospace" }}>
                          {t.lr_pnl != null ? `${t.lr_pnl >= 0 ? "+$" : "-$"}${Math.abs(t.lr_pnl).toFixed(2)}` : "—"}
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 10px", color: (t.rf_pnl ?? 0) >= 0 ? "#45aaf2" : "#f85149", fontFamily: "JetBrains Mono, monospace" }}>
                          {t.rf_pnl != null ? `${t.rf_pnl >= 0 ? "+$" : "-$"}${Math.abs(t.rf_pnl).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: 10, fontSize: 11, color: "#8b949e" }}>
                Cutoff: {oosData.meta.cutoff_date} · OOS markets scanned: {oosData.meta.n_oos_seen} · Valid trades: {oosData.meta.n_trades}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 4, backgroundColor: "rgba(243,186,47,0.06)",
        border: "1px solid rgba(243,186,47,0.25)", borderRadius: 10,
        padding: "14px 20px", fontSize: 13, color: "#8b949e", lineHeight: 1.5,
      }}>
        <strong style={{ color: "#f3ba2f" }}>Disclaimer:</strong> Results are backtested on historical closed markets and do not guarantee future performance. Prediction markets involve significant risk. This tool is for research purposes only — not financial advice.
      </div>
    </div>
  );
}
