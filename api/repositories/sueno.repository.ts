import pool from '../libs/db';
import { CreateSuenoData, UpdateSuenoData, Sueno } from '../interfaces/sueno.interface';

export class SuenoRepository {
  async list(id_usuario: number): Promise<{ data: Sueno[] | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM suenos WHERE id_usuario = $1 ORDER BY prioridad ASC, creado_en DESC`,
        [id_usuario]
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: Sueno | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM suenos WHERE id_sueno = $1 AND id_usuario = $2`,
        [id, id_usuario]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async create(id_usuario: number, data: CreateSuenoData): Promise<{ data: Sueno | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO suenos (id_usuario, titulo, descripcion, imagen_url, prioridad, estado, fecha_objetivo)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id_usuario, data.titulo, data.descripcion || null, data.imagen_url || null,
         data.prioridad ?? 3, data.estado || 'activo', data.fecha_objetivo || null]
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(id: number, id_usuario: number, data: UpdateSuenoData): Promise<{ data: Sueno | null; error: any }> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields.push(`${k} = $${i++}`);
        values.push(v === '' ? null : v);
      }
    }
    if (!fields.length) return this.getById(id, id_usuario);
    fields.push(`actualizado_en = NOW()`);
    values.push(id, id_usuario);
    try {
      const { rows } = await pool.query(
        `UPDATE suenos SET ${fields.join(', ')} WHERE id_sueno = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM suenos WHERE id_sueno = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) {
      return { data: false, error };
    }
  }
}
