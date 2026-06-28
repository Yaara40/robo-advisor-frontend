import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0d1117" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
