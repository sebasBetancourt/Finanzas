import { useEffect, useState } from "react";
import { getDashboardKpis } from "@/services/api";
import type { KpiDashboard } from "@/interfaces/kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MetricasPage() {
  const [kpis, setKpis] = useState<KpiDashboard | null>(null);

  useEffect(() => {
    getDashboardKpis().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return <p className="text-muted-foreground">Cargando métricas...</p>;

  const kpisList = [
    { label: "Balance del mes", value: formatMoney(kpis.balance_mes) },
    { label: "Tasa de ahorro", value: `${kpis.tasa_ahorro_pct}%` },
    { label: "Metas completadas", value: String(kpis.metas_completadas) },
    { label: "Tareas hechas (7d)", value: String(kpis.tareas_completadas_semana) },
    { label: "Progreso ahorros", value: `${kpis.progreso_ahorros_pct}%` },
    { label: "Metas activas", value: String(kpis.metas_activas) },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Métricas y KPIs</h1>
        <p className="text-muted-foreground">Indicadores para mejorar tu economía</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpisList.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="font-sans text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-forest">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Tendencia ingresos vs egresos</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpis.flujo_mensual}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#0c4136" strokeWidth={2} />
              <Line type="monotone" dataKey="egresos" stroke="#e7b61d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top categorías de gasto (mes)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {kpis.gastos_por_categoria.map((g) => (
            <div key={g.categoria} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                {g.categoria}
              </div>
              <span className="font-medium">{formatMoney(g.total)}</span>
            </div>
          ))}
          {!kpis.gastos_por_categoria.length && <p className="text-sm text-muted-foreground">Sin datos este mes</p>}
        </CardContent>
      </Card>
    </div>
  );
}
