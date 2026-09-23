export type ItemTipo = "ingreso" | "gasto" | "deuda" | "inversion" | "ahorro";
export type ItemEstado =
  | "pendiente"
  | "programado"
  | "en_proceso"
  | "ahorro"
  | "completado"
  | "cancelado";

export interface ItemFinanciero {
  id_item: number;
  id_usuario: number;
  titulo: string;
  tipo: ItemTipo;
  monto_total: number;
  monto_pagado: number;
  estado: ItemEstado;
  fecha?: string | null;
  notas?: string | null;
  id_item_padre?: number | null;
  cuota_mensual?: number | null;
  n_cuotas?: number | null;
  cuotas_pagadas?: number | null;
  dia_cobro?: number | null;
  cuota_inicial?: number | null;
  padre_titulo?: string | null;
  es_recurrente?: boolean;
  fecha_inicio?: string | null;
}

export interface ItemsResumen {
  gastos_mes: number;
  ingresos_mes: number;
  deuda_total: number;
  deuda_pagada: number;
  deuda_restante: number;
  deuda_pct: number;
  ahorro_total: number;
  ahorro_actual: number;
  total_items: number;
}

export const ESTADOS: { id: ItemEstado; label: string; color: string }[] = [
  { id: "pendiente", label: "Pendiente", color: "#b48000" },
  { id: "programado", label: "Programado", color: "#3b82f6" },
  { id: "en_proceso", label: "Deudas en proceso", color: "#7c3aed" },
  { id: "ahorro", label: "Ahorro", color: "#0c4136" },
  { id: "completado", label: "Completado", color: "#1a6b55" },
  { id: "cancelado", label: "Cancelado", color: "#b91c1c" },
];

export const TIPOS: { id: ItemTipo; label: string; color: string }[] = [
  { id: "ingreso", label: "Ingresos", color: "#1a6b55" },
  { id: "gasto", label: "Gastos", color: "#b91c1c" },
  { id: "deuda", label: "Deudas", color: "#7c3aed" },
  { id: "inversion", label: "Inversiones", color: "#2563eb" },
  { id: "ahorro", label: "Ahorro", color: "#0c4136" },
];
