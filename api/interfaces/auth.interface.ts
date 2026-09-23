export interface Usuario {
  id_usuario: number;
  email: string;
  nombre: string;
  apellido?: string | null;
  moneda: string;
  timezone: string;
  rol?: 'admin' | 'usuario';
  estado: string;
  creado_en?: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  moneda?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  id: number;
  email: string;
  nombre: string;
}
