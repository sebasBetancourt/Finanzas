export interface Tarea {
  id_tarea: number;
  id_usuario: number;
  id_meta?: number | null;
  id_rutina?: number | null;
  id_plan?: number | null;
  titulo: string;
  descripcion?: string | null;
  fecha_programada: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  completada: boolean;
  prioridad: number;
}

export interface CreateTareaData {
  titulo: string;
  descripcion?: string;
  fecha_programada: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  id_meta?: number | null;
  id_rutina?: number | null;
  id_plan?: number | null;
  prioridad?: number;
  completada?: boolean;
}

export interface UpdateTareaData extends Partial<CreateTareaData> {}
