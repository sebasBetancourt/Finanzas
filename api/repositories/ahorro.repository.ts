import pool from '../libs/db';
import { CreateAhorroData, UpdateAhorroData, CreateAporteData, MetaAhorro } from '../interfaces/ahorro.interface';

export class AhorroRepository {
  async list(id_usuario: number): Promise<{ data: MetaAhorro[] | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM metas_ahorro WHERE id_usuario = $1 ORDER BY creado_en DESC`, [id_usuario]);
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: MetaAhorro | null; error: any }> {
    try {
      const { rows } = await pool.query(`SELECT * FROM metas_ahorro WHERE id_ahorro = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async create(id_usuario: number, data: CreateAhorroData): Promise<{ data: MetaAhorro | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO metas_ahorro (id_usuario, id_meta, nombre, monto_objetivo, monto_actual, fecha_objetivo, aporte_sugerido, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id_usuario, data.id_meta ?? null, data.nombre, data.monto_objetivo, data.monto_actual ?? 0,
         data.fecha_objetivo || null, data.aporte_sugerido ?? null, data.estado || 'activa']
      );
      return { data: rows[0], error: null };
    } catch (error) { return { data: null, error }; }
  }

  async update(id: number, id_usuario: number, data: UpdateAhorroData): Promise<{ data: MetaAhorro | null; error: any }> {
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
        `UPDATE metas_ahorro SET ${fields.join(', ')} WHERE id_ahorro = $${i++} AND id_usuario = $${i} RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(`DELETE FROM metas_ahorro WHERE id_ahorro = $1 AND id_usuario = $2`, [id, id_usuario]);
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) { return { data: false, error }; }
  }

  async addAporte(id_ahorro: number, id_usuario: number, data: CreateAporteData): Promise<{ data: any; error: any }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const check = await client.query(`SELECT * FROM metas_ahorro WHERE id_ahorro = $1 AND id_usuario = $2 FOR UPDATE`, [id_ahorro, id_usuario]);
      if (!check.rows[0]) {
        await client.query('ROLLBACK');
        return { data: null, error: { notFound: true } };
      }
      const aporte = await client.query(
        `INSERT INTO aportes_ahorro (id_ahorro, id_usuario, monto, nota, fecha) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id_ahorro, id_usuario, data.monto, data.nota || null, data.fecha || new Date().toISOString().slice(0, 10)]
      );
      const updated = await client.query(
        `UPDATE metas_ahorro SET monto_actual = monto_actual + $1, actualizado_en = NOW(),
         estado = CASE WHEN monto_actual + $1 >= monto_objetivo THEN 'completada' ELSE estado END
         WHERE id_ahorro = $2 RETURNING *`,
        [data.monto, id_ahorro]
      );
      await client.query('COMMIT');
      return { data: { aporte: aporte.rows[0], ahorro: updated.rows[0] }, error: null };
    } catch (error) {
      await client.query('ROLLBACK');
      return { data: null, error };
    } finally {
      client.release();
    }
  }

  async listAportes(id_ahorro: number, id_usuario: number): Promise<{ data: any[] | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT a.* FROM aportes_ahorro a
         JOIN metas_ahorro m ON m.id_ahorro = a.id_ahorro
         WHERE a.id_ahorro = $1 AND m.id_usuario = $2 ORDER BY a.fecha DESC`,
        [id_ahorro, id_usuario]
      );
      return { data: rows, error: null };
    } catch (error) { return { data: null, error }; }
  }
}
