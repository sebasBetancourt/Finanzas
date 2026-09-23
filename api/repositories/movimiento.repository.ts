import pool from '../libs/db';
import { CreateMovimientoData, UpdateMovimientoData, Movimiento } from '../interfaces/movimiento.interface';

export class MovimientoRepository {
  async list(id_usuario: number, filters?: { tipo?: string; desde?: string; hasta?: string; id_categoria?: number }): Promise<{ data: Movimiento[] | null; error: any }> {
    try {
      const cond = ['m.id_usuario = $1'];
      const vals: any[] = [id_usuario];
      let i = 2;
      if (filters?.tipo) { cond.push(`m.tipo = $${i++}`); vals.push(filters.tipo); }
      if (filters?.desde) { cond.push(`m.fecha >= $${i++}`); vals.push(filters.desde); }
      if (filters?.hasta) { cond.push(`m.fecha <= $${i++}`); vals.push(filters.hasta); }
      if (filters?.id_categoria) { cond.push(`m.id_categoria = $${i++}`); vals.push(filters.id_categoria); }
      const { rows } = await pool.query(
        `SELECT m.*, c.nombre AS categoria_nombre, c.color AS categoria_color
         FROM movimientos m
         LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
         WHERE ${cond.join(' AND ')}
         ORDER BY m.fecha DESC, m.creado_en DESC`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: Movimiento | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM movimientos WHERE id_movimiento = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreateMovimientoData): Promise<{ data: Movimiento | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO movimientos (id_usuario, id_categoria, tipo, monto, concepto, descripcion, fecha, es_recurrente)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id_usuario, data.id_categoria ?? null, data.tipo, data.monto, data.concepto,
         data.descripcion || null, data.fecha || new Date().toISOString().slice(0, 10), data.es_recurrente ?? false]
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }

  async update(id: number, id_usuario: number, data: UpdateMovimientoData): Promise<{ data: Movimiento | null; error: any }> {
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
        `UPDATE movimientos SET ${fields.join(', ')} WHERE id_movimiento = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM movimientos WHERE id_movimiento = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) { return { data: false, error }; }
  }
}
