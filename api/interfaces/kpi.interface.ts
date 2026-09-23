export interface KpiDashboard {
  ingresos_mes: number;
  egresos_mes: number;
  balance_mes: number;
  tasa_ahorro_pct: number;
  metas_activas: number;
  metas_completadas: number;
  tareas_pendientes: number;
  tareas_completadas_semana: number;
  ahorros_total_objetivo: number;
  ahorros_total_actual: number;
  progreso_ahorros_pct: number;
  gastos_por_categoria: { categoria: string; color: string; total: number }[];
  flujo_mensual: { mes: string; ingresos: number; egresos: number }[];
}
