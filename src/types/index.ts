export type CoinSymbol = "BTC" | "ETH" | "SOL" | "XRP" | "BNB" | "DOGE" | "HYPE";

export type MarketType =
  | "5min"
  | "15min"
  | "1hour"
  | "4hour"
  | "1day"
  | "weekly"
  | "all";

export interface MarketPrediction {
  coin: CoinSymbol;
  id: string;
  question: string;
  endDate: string | null;
  market_type: MarketType;
  market_price: number;
  our_estimate: number;
  edge: number;
  volume: number;
  confidence: number;
}

export interface OptimizeRequest {
  risk_level: number;
  amount: number;
}

export interface CoinMarket {
  id: string;
  question: string;
  endDate: string | null;
  market_type: MarketType;
  market_price: number;
  our_estimate: number;
  edge: number;
  volume: number;
}

export interface CoinAllocation {
  coin: string;
  weight: number;
  dollar_amount: number;
  edge: number;
  our_estimate: number;
  market_price: number;
  confidence: number;
  market_type: MarketType;
  market: CoinMarket;
}

export interface ModelComparisonCoin {
  coin: string;
  our_estimate: number;
  lr_estimate: number;
  market_price: number;
  our_edge: number;
  lr_edge: number;
}

export interface ModelComparison {
  our_mean_edge_pct: number;
  lr_mean_edge_pct: number;
  edge_advantage_pct: number;
  prediction_correlation: number;
  n_markets: number;
  per_coin: ModelComparisonCoin[];
}

export interface OptimizeResponse {
  coins: CoinSymbol[];
  risk_level: number;
  amount: number;
  allocations: Record<string, CoinAllocation>;
  report?: string;
  model_comparison?: ModelComparison | null;
}

export interface DashboardResponse {
  active_markets: number;
  opportunities: number;
  avg_edge: number;
  model_accuracy: number;
  coins: CoinSymbol[];
  top_opportunities: (MarketPrediction & { coin: CoinSymbol })[];
}

export interface MarketsResponse {
  markets: MarketPrediction[];
  total: number;
}

// ── Backtest types ────────────────────────────────────────────────────────────

export interface StrategyStats {
  label: string;
  n_trades: number;
  total_pnl: number;
  total_bet: number;
  roi_pct: number;
  win_rate_pct: number;
  direction_accuracy_pct: number;
  sharpe: number;
  max_drawdown_pct: number;
}

export interface CumulativeChartPoint {
  date: string;
  our: number | null;
  our_flat: number | null;
  lr: number | null;
  rf: number | null;
  uniform: number | null;
}

export interface KellyChartPoint {
  date: string;
  full: number | null;
  half: number | null;
  quarter: number | null;
  uniform: number | null;
}

export interface CoinBreakdown {
  coin: string;
  n_trades: number;
  our_pnl: number;
  win_rate: number;
  mean_edge: number;
}

export interface BacktestTrade {
  coin: string;
  question: string;
  market_type: string;
  end_date: string;
  market_price: number;
  our_estimate: number;
  our_edge: number;
  outcome: number;
  direction: string;
  our_bet: number;
  our_pnl: number;
  our_correct: number;
  lr_pnl: number | null;
  uniform_pnl: number;
}

export interface BacktestMeta {
  generated_at: string;
  n_markets_seen: number;
  n_valid_trades: number;
  kelly_fraction: number;
  session_bankroll: number;
  price_filter: [number, number];
  edge_filter: [number, number];
}

export interface BacktestResponse {
  summary: {
    our_model: StrategyStats;
    our_model_flat: StrategyStats;
    lr_baseline: StrategyStats;
    rf_baseline: StrategyStats;
    uniform: StrategyStats;
  };
  kelly_comparison: StrategyStats[];
  kelly_chart: KellyChartPoint[];
  cumulative_chart: CumulativeChartPoint[];
  coin_breakdown: CoinBreakdown[];
  trades: BacktestTrade[];
  meta: BacktestMeta;
}

// ── Out-of-Sample evaluation types ───────────────────────────────────────────

export interface OOSTrade {
  coin: string;
  question: string;
  market_type: string;
  end_date: string;
  entry_price: number;
  outcome: number;
  our_estimate: number;
  our_edge: number;
  direction: string;
  our_pnl: number;
  our_correct: number;
  lr_estimate: number | null;
  lr_pnl: number | null;
  lr_correct: number | null;
  rf_estimate: number | null;
  rf_pnl: number | null;
  rf_correct: number | null;
}

export interface OOSMeta {
  generated_at: string;
  cutoff_date: string;
  n_oos_seen: number;
  n_trades: number;
  flat_bet: number;
  note: string;
}

export interface OOSResponse {
  meta: OOSMeta;
  summary: {
    our_model: StrategyStats;
    lr_baseline: StrategyStats;
    rf_baseline: StrategyStats;
    uniform: StrategyStats;
  };
  trades: OOSTrade[];
}

/** @deprecated kept for type-compatibility; real data now uses BacktestResponse */
export interface DailyHistoryPoint {
  date: string;
  daily_return: number;
  cumulative_return: number;
  win_rate: number;
}

/** @deprecated */
export interface HistoryResponse {
  total_return: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  days: number;
  history: DailyHistoryPoint[];
}
