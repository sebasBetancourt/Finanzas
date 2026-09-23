import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/TableroPage";
import SuenosPage from "@/pages/SuenosPage";
import MetasPage from "@/pages/MetasPage";
import CalendarioPage from "@/pages/CalendarioPage";
import RutinasPage from "@/pages/RutinasPage";
import AhorrosPage from "@/pages/AhorrosPage";
import GastosPage from "@/pages/GastosPage";
import MetricasPage from "@/pages/MetricasPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-forest/60">
        Cargando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/suenos" element={<SuenosPage />} />
        <Route path="dashboard/metas" element={<MetasPage />} />
        <Route path="dashboard/calendario" element={<CalendarioPage />} />
        <Route path="dashboard/rutinas" element={<RutinasPage />} />
        <Route path="dashboard/ahorros" element={<AhorrosPage />} />
        <Route path="dashboard/gastos" element={<GastosPage />} />
        <Route path="dashboard/metricas" element={<MetricasPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
