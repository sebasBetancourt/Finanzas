export interface Sueno {
  id_sueno: number;
  id_usuario: number;
  titulo: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  prioridad: number;
  estado: string;
  fecha_objetivo?: string | null;
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface CreateSuenoData {
  titulo: string;
  descripcion?: string;
  imagen_url?: string;
  prioridad?: number;
  estado?: string;
  fecha_objetivo?: string | null;
}

export interface UpdateSuenoData extends Partial<CreateSuenoData> {}
