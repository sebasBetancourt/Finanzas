export interface Rutina {
  id_rutina: number;
  id_usuario: number;
  id_meta?: number | null;
  titulo: string;
  descripcion?: string | null;
  frecuencia: string;
  dias_semana: number[];
  hora_preferida?: string | null;
  activo: boolean;
}

export interface CreateRutinaData {
  titulo: string;
  descripcion?: string;
  id_meta?: number | null;
  frecuencia?: string;
  dias_semana?: number[];
  hora_preferida?: string | null;
  activo?: boolean;
}

export interface UpdateRutinaData extends Partial<CreateRutinaData> {}
