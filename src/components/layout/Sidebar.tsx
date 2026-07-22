import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import kymarketLogo from "../../assets/kymarket-logo.png";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/optimizer",
    label: "Optimizer",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    to: "/markets",
    label: "Markets",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: "/history",
    label: "History",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dashboard()
      .then((d) => setLiveCount(d.active_markets))
      .catch(() => {});
  }, []);

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        backgroundColor: "#161b22",
        borderRight: "1px solid #21262d",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "10px 30px 10px",
          borderBottom: "1px solid #21262d",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <img
            src={kymarketLogo}
            alt="Kymarket"
            style={{ height: 110, width: "150", objectFit: "contain" }}
          />
        </div>

        {/* Markets live indicator */}
        <button
          onClick={() => navigate("/markets")}
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#1a2332",
            borderRadius: 8,
            padding: "6px 10px",
            border: "1px solid #21262d",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#00d395",
              display: "inline-block",
              boxShadow: "0 0 6px #00d395",
            }}
          />
          <span style={{ color: "#8b949e", fontSize: 12, flex: 1 }}>
            Markets Live
          </span>
          <span
            style={{
              backgroundColor: "#21262d",
              color: liveCount ? "#00d395" : "#8b949e",
              fontSize: 11,
              borderRadius: 4,
              padding: "1px 6px",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
            }}
          >
            {liveCount ?? "…"}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? "#00d395" : "#8b949e",
              backgroundColor: isActive
                ? "rgba(0,211,149,0.08)"
                : "transparent",
              borderLeft: isActive
                ? "2px solid #00d395"
                : "2px solid transparent",
              transition: "all 0.15s ease",
            })}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Model Accuracy footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #21262d",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00d395"
            strokeWidth="2"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
          <span style={{ color: "#8b949e", fontSize: 12 }}>Model Accuracy</span>
        </div>
        <div>
          <span
            style={{
              color: "#e6edf3",
              fontWeight: 700,
              fontSize: 20,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            64.2%
          </span>
          <span style={{ color: "#8b949e", fontSize: 11, marginLeft: 6 }}>
            last 7d
          </span>
        </div>
      </div>
    </aside>
  );
}
