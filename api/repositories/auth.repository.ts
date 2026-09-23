import pool from '../libs/db';
import { RegisterData, Usuario } from '../interfaces/auth.interface';

export class AuthRepository {
  async findByEmail(email: string): Promise<{ data: (Usuario & { password_hash: string }) | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT id_usuario, email, password_hash, nombre, apellido, moneda, timezone, rol, estado, creado_en
         FROM usuarios WHERE email = $1 LIMIT 1`,
        [email.toLowerCase()]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async findById(id: number): Promise<{ data: Usuario | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT id_usuario, email, nombre, apellido, moneda, timezone, rol, estado, creado_en
         FROM usuarios WHERE id_usuario = $1 LIMIT 1`,
        [id]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async create(data: RegisterData & { password_hash: string }): Promise<{ data: Usuario | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (email, password_hash, nombre, apellido, moneda)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_usuario, email, nombre, apellido, moneda, timezone, estado, creado_en`,
        [data.email.toLowerCase(), data.password_hash, data.nombre, data.apellido || null, data.moneda || 'COP']
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
