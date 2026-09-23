import pool from '../libs/db';
import { CreatePlanData, UpdatePlanData, PlanEstrategia } from '../interfaces/plan.interface';

export class PlanRepository {
  async list(id_usuario: number, id_meta?: number): Promise<{ data: PlanEstrategia[] | null; error: any }> {
    try {
      const vals: any[] = [id_usuario];
      let sql = `SELECT * FROM planes_estrategia WHERE id_usuario = $1`;
      if (id_meta) { sql += ` AND id_meta = $2`; vals.push(id_meta); }
      sql += ` ORDER BY creado_en DESC`;
      const { rows } = await pool.query(sql, vals);
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: PlanEstrategia | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM planes_estrategia WHERE id_plan = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreatePlanData): Promise<{ data: PlanEstrategia | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO planes_estrategia (id_usuario, id_meta, titulo, descripcion, pasos, estado)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
        [id_usuario, data.id_meta, data.titulo, data.descripcion || null, JSON.stringify(data.pasos || []), data.estado || 'activo']
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }

  async update(id: number, id_usuario: number, data: UpdatePlanData): Promise<{ data: PlanEstrategia | null; error: any }> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        if (k === 'pasos') { fields.push(`pasos = $${i++}::jsonb`); values.push(JSON.stringify(v)); }
        else { fields.push(`${k} = $${i++}`); values.push(v); }
      }
    }
    if (!fields.length) return this.getById(id, id_usuario);
    fields.push('actualizado_en = NOW()');
    values.push(id, id_usuario);
    try {
      const { rows } = await pool.query(
        `UPDATE planes_estrategia SET ${fields.join(', ')} WHERE id_plan = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM planes_estrategia WHERE id_plan = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) { return { data: false, error }; }
  }
}
