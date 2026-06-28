import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon?: ReactNode;
  accentColor?: string;
}

export function StatCard({ label, value, subtext, trend, icon, accentColor }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #21262d",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#8b949e",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: accentColor ?? "#8b949e", opacity: 0.7 }}>{icon}</span>
        )}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#e6edf3",
          fontFamily: "JetBrains Mono, monospace",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {(subtext || trend !== undefined) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {trend !== undefined && (
            <span style={{ color: trend >= 0 ? "#00d395" : "#f85149", fontSize: 12, fontWeight: 600 }}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subtext && (
            <span style={{ color: "#8b949e", fontSize: 12 }}>{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
