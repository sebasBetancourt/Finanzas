import pool from '../libs/db';
import { CreateRutinaData, UpdateRutinaData, Rutina } from '../interfaces/rutina.interface';

export class RutinaRepository {
  async list(id_usuario: number): Promise<{ data: Rutina[] | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM rutinas WHERE id_usuario = $1 ORDER BY creado_en DESC`, [id_usuario]);
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: Rutina | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM rutinas WHERE id_rutina = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreateRutinaData): Promise<{ data: Rutina | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO rutinas (id_usuario, id_meta, titulo, descripcion, frecuencia, dias_semana, hora_preferida, activo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id_usuario, data.id_meta ?? null, data.titulo, data.descripcion || null,
         data.frecuencia || 'diaria', data.dias_semana || [], data.hora_preferida || null, data.activo ?? true]
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }

  async update(id: number, id_usuario: number, data: UpdateRutinaData): Promise<{ data: Rutina | null; error: any }> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) { fields.push(`${k} = $${i++}`); values.push(v); }
    }
    if (!fields.length) return this.getById(id, id_usuario);
    fields.push('actualizado_en = NOW()');
    values.push(id, id_usuario);
    try {
      const { rows } = await pool.query(
        `UPDATE rutinas SET ${fields.join(', ')} WHERE id_rutina = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM rutinas WHERE id_rutina = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) { return { data: false, error }; }
  }
}
