export interface MetaAhorro {
  id_ahorro: number;
  id_usuario: number;
  id_meta?: number | null;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_objetivo?: string | null;
  aporte_sugerido?: number | null;
  estado: string;
}

export interface CreateAhorroData {
  nombre: string;
  monto_objetivo: number;
  monto_actual?: number;
  fecha_objetivo?: string | null;
  aporte_sugerido?: number | null;
  id_meta?: number | null;
  estado?: string;
}

export interface UpdateAhorroData extends Partial<CreateAhorroData> {}

export interface CreateAporteData {
  monto: number;
  nota?: string;
  fecha?: string;
}
