export interface Meta {
  id_meta: number;
  id_usuario: number;
  id_sueno?: number | null;
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  valor_objetivo?: number | null;
  valor_actual: number;
  unidad?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  progreso_pct: number;
  estado: string;
  creado_en?: Date;
}

export interface CreateMetaData {
  titulo: string;
  descripcion?: string;
  id_sueno?: number | null;
  tipo?: string;
  valor_objetivo?: number | null;
  valor_actual?: number;
  unidad?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  progreso_pct?: number;
  estado?: string;
}

export interface UpdateMetaData extends Partial<CreateMetaData> {}
