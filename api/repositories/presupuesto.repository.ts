import pool from '../libs/db';

export interface PresupuestoMes {
  id_presupuesto: number;
  id_usuario: number;
  anio: number;
  mes: number;
  ingreso_total: number;
  notas?: string | null;
}

export class PresupuestoRepository {
  async get(
    id_usuario: number,
    anio: number,
    mes: number
  ): Promise<{ data: PresupuestoMes | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM presupuestos_mes
         WHERE id_usuario = $1 AND anio = $2 AND mes = $3
         LIMIT 1`,
        [id_usuario, anio, mes]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async upsert(
    id_usuario: number,
    anio: number,
    mes: number,
    ingreso_total: number,
    notas?: string | null
  ): Promise<{ data: PresupuestoMes | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO presupuestos_mes (id_usuario, anio, mes, ingreso_total, notas)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_usuario, anio, mes)
         DO UPDATE SET
           ingreso_total = EXCLUDED.ingreso_total,
           notas = COALESCE(EXCLUDED.notas, presupuestos_mes.notas),
           actualizado_en = NOW()
         RETURNING *`,
        [id_usuario, anio, mes, ingreso_total, notas ?? null]
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
