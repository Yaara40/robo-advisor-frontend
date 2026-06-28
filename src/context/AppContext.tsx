import React, { createContext, useContext, useState } from "react";
import type { OptimizeResponse } from "../types";

interface AppContextType {
  portfolioResult: OptimizeResponse | null;
  setPortfolioResult: (r: OptimizeResponse | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [portfolioResult, setPortfolioResult] =
    useState<OptimizeResponse | null>(null);

  return (
    <AppContext.Provider value={{ portfolioResult, setPortfolioResult }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
