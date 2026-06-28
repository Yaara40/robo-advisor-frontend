import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { OptimizerPage } from "./pages/OptimizerPage";
import { MarketsPage } from "./pages/MarketsPage";
import { HistoryPage } from "./pages/HistoryPage";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/optimizer" element={<OptimizerPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
