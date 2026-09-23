export interface Movimiento {
  id_movimiento: number;
  id_usuario: number;
  id_categoria?: number | null;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  descripcion?: string | null;
  fecha: string;
  es_recurrente: boolean;
  categoria_nombre?: string;
}

export interface CreateMovimientoData {
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  descripcion?: string;
  fecha?: string;
  id_categoria?: number | null;
  es_recurrente?: boolean;
}

export interface UpdateMovimientoData extends Partial<CreateMovimientoData> {}
