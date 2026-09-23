import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Target,
  CalendarDays,
  Repeat,
  PiggyBank,
  Wallet,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Tablero", icon: LayoutDashboard, end: true },
  { href: "/dashboard/suenos", label: "Sueños", icon: Sparkles },
  { href: "/dashboard/metas", label: "Metas", icon: Target },
  { href: "/dashboard/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/dashboard/rutinas", label: "Rutinas", icon: Repeat },
  { href: "/dashboard/ahorros", label: "Ahorros", icon: PiggyBank },
  { href: "/dashboard/gastos", label: "Gastos", icon: Wallet },
  { href: "/dashboard/metricas", label: "Métricas", icon: BarChart3 },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-forest/10 bg-forest text-cream">
      <div className="px-6 py-8">
        <p className="font-display text-2xl tracking-tight">Finanzas</p>
        <p className="mt-1 text-xs text-cream/60">Metas · Hábitos · Economía</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive ? "bg-amber text-forest font-medium" : "text-cream/80 hover:bg-white/10"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium">{user?.nombre}</p>
        <p className="truncate text-xs text-cream/50">{user?.email}</p>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-3 flex items-center gap-2 text-xs text-cream/70 hover:text-amber"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
