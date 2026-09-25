import pool from '../libs/db';

export type MetaMesTipo = 'ingreso' | 'ahorro' | 'pagar_deuda' | 'pagar_cuota';

export interface MetaMes {
  id_meta_mes: number;
  id_usuario: number;
  anio: number;
  mes: number;
  tipo: MetaMesTipo;
  titulo: string;
  monto_objetivo: number;
  id_item?: number | null;
  creado_en?: Date;
  actualizado_en?: Date;
}

export class MetaMesRepository {
  async list(
    id_usuario: number,
    anio: number,
    mes: number
  ): Promise<{ data: MetaMes[] | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM metas_mes
         WHERE id_usuario = $1 AND anio = $2 AND mes = $3
         ORDER BY id_meta_mes ASC`,
        [id_usuario, anio, mes]
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async create(
    id_usuario: number,
    data: {
      anio: number;
      mes: number;
      tipo: MetaMesTipo;
      titulo: string;
      monto_objetivo: number;
      id_item?: number | null;
    }
  ): Promise<{ data: MetaMes | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO metas_mes (id_usuario, anio, mes, tipo, titulo, monto_objetivo, id_item)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          id_usuario,
          data.anio,
          data.mes,
          data.tipo,
          data.titulo,
          data.monto_objetivo,
          data.id_item ?? null,
        ]
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async remove(
    id_usuario: number,
    id: number
  ): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM metas_mes WHERE id_meta_mes = $1 AND id_usuario = $2`,
        [id, id_usuario]
      );
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) {
      return { data: false, error };
    }
  }
}
