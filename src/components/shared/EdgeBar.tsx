interface EdgeBarProps {
  edge: number;
  maxEdge?: number;
  width?: number;
}

export function EdgeBar({ edge, maxEdge = 0.25, width = 80 }: EdgeBarProps) {
  const isPositive = edge >= 0;
  const pct = Math.min(Math.abs(edge) / maxEdge, 1) * 100;
  const color = isPositive ? "#00d395" : "#f85149";

  return (
    <div
      style={{
        width,
        height: 6,
        backgroundColor: "#21262d",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
