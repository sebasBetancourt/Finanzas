export type ItemTipo = 'ingreso' | 'gasto' | 'deuda' | 'inversion' | 'ahorro';
export type ItemEstado = 'pendiente' | 'programado' | 'en_proceso' | 'ahorro' | 'completado' | 'cancelado';

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
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface CreateItemData {
  titulo: string;
  tipo: ItemTipo;
  monto_total: number;
  monto_pagado?: number;
  estado?: ItemEstado;
  fecha?: string | null;
  notas?: string;
  id_item_padre?: number | null;
  cuota_mensual?: number | null;
  n_cuotas?: number | null;
  cuotas_pagadas?: number | null;
  dia_cobro?: number | null;
  cuota_inicial?: number | null;
  es_recurrente?: boolean;
  fecha_inicio?: string | null;
}

export interface UpdateItemData {
  titulo?: string;
  tipo?: ItemTipo;
  monto_total?: number;
  monto_pagado?: number;
  estado?: ItemEstado;
  fecha?: string | null;
  notas?: string | null;
  id_item_padre?: number | null;
  cuota_mensual?: number | null;
  n_cuotas?: number | null;
  cuotas_pagadas?: number | null;
  dia_cobro?: number | null;
  cuota_inicial?: number | null;
  es_recurrente?: boolean;
  fecha_inicio?: string | null;
}

/** Crear deuda con plan de cuotas mensuales */
export interface CreateDeudaPlanData {
  titulo: string;
  cuota_mensual: number;
  n_cuotas: number;
  cuota_inicial?: number;
  cuotas_pagadas?: number;
  monto_pagado?: number;
  dia_cobro?: number;
  fecha_inicio?: string;
  notas?: string;
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
