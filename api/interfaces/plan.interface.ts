export interface PlanEstrategia {
  id_plan: number;
  id_meta: number;
  id_usuario: number;
  titulo: string;
  descripcion?: string | null;
  pasos: any[];
  estado: string;
  creado_en?: Date;
}

export interface CreatePlanData {
  id_meta: number;
  titulo: string;
  descripcion?: string;
  pasos?: any[];
  estado?: string;
}

export interface UpdatePlanData {
  titulo?: string;
  descripcion?: string;
  pasos?: any[];
  estado?: string;
  id_meta?: number;
}
