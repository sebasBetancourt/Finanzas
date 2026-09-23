export interface Categoria {
  id_categoria: number;
  id_usuario?: number | null;
  nombre: string;
  slug: string;
  tipo: 'ingreso' | 'egreso';
  color?: string | null;
  icono?: string | null;
  estado: string;
}

export interface CreateCategoriaData {
  nombre: string;
  slug?: string;
  tipo: 'ingreso' | 'egreso';
  color?: string;
  icono?: string;
}
