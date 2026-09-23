import pool from '../libs/db';
import { CreateTareaData, UpdateTareaData, Tarea } from '../interfaces/tarea.interface';

export class TareaRepository {
  async list(id_usuario: number, desde?: string, hasta?: string): Promise<{ data: Tarea[] | null; error: any }> {
    try {
      const cond = ['id_usuario = $1'];
      const vals: any[] = [id_usuario];
      let i = 2;
      if (desde) { cond.push(`fecha_programada >= $${i++}`); vals.push(desde); }
      if (hasta) { cond.push(`fecha_programada <= $${i++}`); vals.push(hasta); }
      const { rows } = await pool.query(
        `SELECT * FROM tareas WHERE ${cond.join(' AND ')} ORDER BY fecha_programada ASC, prioridad ASC`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: Tarea | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM tareas WHERE id_tarea = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreateTareaData): Promise<{ data: Tarea | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO tareas (id_usuario, id_meta, id_rutina, id_plan, titulo, descripcion, fecha_programada, hora_inicio, hora_fin, prioridad, completada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [id_usuario, data.id_meta ?? null, data.id_rutina ?? null, data.id_plan ?? null,
         data.titulo, data.descripcion || null, data.fecha_programada,
         data.hora_inicio || null, data.hora_fin || null, data.prioridad ?? 3, data.completada ?? false]
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }

  async update(id: number, id_usuario: number, data: UpdateTareaData): Promise<{ data: Tarea | null; error: any }> {
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
        `UPDATE tareas SET ${fields.join(', ')} WHERE id_tarea = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM tareas WHERE id_tarea = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) { return { data: false, error }; }
  }
}
