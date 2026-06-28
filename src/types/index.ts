export type CoinSymbol = "BTC" | "ETH" | "SOL" | "XRP" | "BNB" | "DOGE" | "HYPE";

export type MarketType =
  | "5min"
  | "15min"
  | "1hour"
  | "4hour"
  | "1day"
  | "weekly"
  | "monthly"
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
  weight: number;
  dollar_amount: number;
  edge: number;
  our_estimate: number;
  market_price: number;
  confidence: number;
  market: CoinMarket;
}

export interface OptimizeResponse {
  coins: CoinSymbol[];
  risk_level: number;
  amount: number;
  allocations: Record<string, CoinAllocation>;
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

export interface DailyHistoryPoint {
  date: string;
  daily_return: number;
  cumulative_return: number;
  win_rate: number;
}

export interface HistoryResponse {
  total_return: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  days: number;
  history: DailyHistoryPoint[];
}
