export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "80px 0",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #21262d",
          borderTopColor: "#00d395",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ color: "#8b949e", fontSize: 14 }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(248,81,73,0.08)",
        border: "1px solid rgba(248,81,73,0.3)",
        borderRadius: 10,
        padding: "16px 20px",
        color: "#f85149",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
