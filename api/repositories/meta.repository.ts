import pool from '../libs/db';
import { CreateMetaData, UpdateMetaData, Meta } from '../interfaces/meta.interface';

export class MetaRepository {
  async list(id_usuario: number, filters?: { id_sueno?: number; estado?: string }): Promise<{ data: Meta[] | null; error: any }> {
    try {
      const cond = ['id_usuario = $1'];
      const vals: any[] = [id_usuario];
      let i = 2;
      if (filters?.id_sueno) { cond.push(`id_sueno = $${i++}`); vals.push(filters.id_sueno); }
      if (filters?.estado) { cond.push(`estado = $${i++}`); vals.push(filters.estado); }
      const { rows } = await pool.query(
        `SELECT * FROM metas WHERE ${cond.join(' AND ')} ORDER BY fecha_fin NULLS LAST, creado_en DESC`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: Meta | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM metas WHERE id_meta = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async create(id_usuario: number, data: CreateMetaData): Promise<{ data: Meta | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO metas (id_usuario, id_sueno, titulo, descripcion, tipo, valor_objetivo, valor_actual, unidad, fecha_inicio, fecha_fin, progreso_pct, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [id_usuario, data.id_sueno ?? null, data.titulo, data.descripcion || null, data.tipo || 'personal',
         data.valor_objetivo ?? null, data.valor_actual ?? 0, data.unidad || 'COP',
         data.fecha_inicio || null, data.fecha_fin || null, data.progreso_pct ?? 0, data.estado || 'pendiente']
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(id: number, id_usuario: number, data: UpdateMetaData): Promise<{ data: Meta | null; error: any }> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields.push(`${k} = $${i++}`);
        values.push(v);
      }
    }
    if (!fields.length) return this.getById(id, id_usuario);
    fields.push('actualizado_en = NOW()');
    values.push(id, id_usuario);
    try {
      const { rows } = await pool.query(
        `UPDATE metas SET ${fields.join(', ')} WHERE id_meta = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM metas WHERE id_meta = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) {
      return { data: false, error };
    }
  }
}
