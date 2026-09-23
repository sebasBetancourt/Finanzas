import { useEffect, useState } from "react";
import { getDashboardKpis } from "@/services/api";
import type { KpiDashboard } from "@/interfaces/kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useAuth } from "@/auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KpiDashboard | null>(null);

  useEffect(() => {
    getDashboardKpis().then(setKpis).catch(console.error);
  }, []);

  const cards = kpis
    ? [
        { label: "Ingresos del mes", value: formatMoney(kpis.ingresos_mes, user?.moneda) },
        { label: "Egresos del mes", value: formatMoney(kpis.egresos_mes, user?.moneda) },
        { label: "Balance", value: formatMoney(kpis.balance_mes, user?.moneda) },
        { label: "Tasa de ahorro", value: `${kpis.tasa_ahorro_pct}%` },
        { label: "Metas activas", value: String(kpis.metas_activas) },
        { label: "Tareas pendientes", value: String(kpis.tareas_pendientes) },
      ]
    : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Hola, {user?.nombre}</h1>
        <p className="mt-1 text-muted-foreground">Resumen de tu economía y progreso</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-forest">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Flujo mensual</CardTitle></CardHeader>
          <CardContent className="h-64">
            {kpis?.flujo_mensual?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.flujo_mensual}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="ingresos" fill="#0c4136" name="Ingresos" radius={4} />
                  <Bar dataKey="egresos" fill="#e7b61d" name="Egresos" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin movimientos aún</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Gastos por categoría</CardTitle></CardHeader>
          <CardContent className="h-64">
            {kpis?.gastos_por_categoria?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpis.gastos_por_categoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label>
                    {kpis.gastos_por_categoria.map((entry, i) => (
                      <Cell key={i} fill={entry.color || "#0c4136"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {kpis && (
        <Card>
          <CardHeader><CardTitle>Progreso de ahorros</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(kpis.ahorros_total_actual)} de {formatMoney(kpis.ahorros_total_objetivo)}
                </p>
                <p className="font-display text-3xl text-forest">{kpis.progreso_ahorros_pct}%</p>
              </div>
              <div className="h-3 flex-1 max-w-md overflow-hidden rounded-full bg-forest/10">
                <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${Math.min(kpis.progreso_ahorros_pct, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
