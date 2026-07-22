import type {
  OptimizeRequest,
  OptimizeResponse,
  DashboardResponse,
  MarketsResponse,
  BacktestResponse,
  OOSResponse,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  optimize: (body: OptimizeRequest) =>
    request<OptimizeResponse>("/optimize", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  markets: () => request<MarketsResponse>("/markets"),
  dashboard: () => request<DashboardResponse>("/dashboard"),
  history: () => request<BacktestResponse>("/history"),
  runBacktest: () =>
    request<{ status: string; n_trades: number }>("/backtest/run", {
      method: "POST",
    }),
  oosHistory: () => request<OOSResponse>("/history/oos"),
};
