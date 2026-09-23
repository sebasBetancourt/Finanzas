import pool from '../libs/db';
import {
  CreateItemData,
  UpdateItemData,
  ItemFinanciero,
  ItemsResumen,
} from '../interfaces/item.interface';

function toDateOnly(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, '0');
    const d = String(v.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const d = String(parsed.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

export class ItemRepository {
  async list(
    id_usuario: number,
    filters?: { tipo?: string; estado?: string; desde?: string; hasta?: string }
  ): Promise<{ data: ItemFinanciero[] | null; error: any }> {
    try {
      const cond = ['i.id_usuario = $1'];
      const vals: any[] = [id_usuario];
      let i = 2;
      if (filters?.tipo) {
        cond.push(`i.tipo = $${i++}`);
        vals.push(filters.tipo);
      }
      if (filters?.estado) {
        cond.push(`i.estado = $${i++}`);
        vals.push(filters.estado);
      }
      if (filters?.desde) {
        cond.push(`i.fecha >= $${i++}`);
        vals.push(filters.desde);
      }
      if (filters?.hasta) {
        cond.push(`i.fecha <= $${i++}`);
        vals.push(filters.hasta);
      }
      const { rows } = await pool.query(
        `SELECT i.*, p.titulo AS padre_titulo
         FROM items_financieros i
         LEFT JOIN items_financieros p ON p.id_item = i.id_item_padre
         WHERE ${cond.join(' AND ')}
         ORDER BY i.fecha NULLS LAST, i.creado_en DESC`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Vista mensual: ítems del mes + deudas padre (siempre visibles).
   * Si todos=true, sin filtro de mes.
   */
  async listBoard(
    id_usuario: number,
    opts?: { mes?: string; todos?: boolean }
  ): Promise<{ data: ItemFinanciero[] | null; error: any }> {
    try {
      if (opts?.todos || !opts?.mes) {
        return this.list(id_usuario);
      }
      const [y, m] = opts.mes.split('-').map(Number);
      const { rows } = await pool.query(
        `SELECT i.*, p.titulo AS padre_titulo
         FROM items_financieros i
         LEFT JOIN items_financieros p ON p.id_item = i.id_item_padre
         WHERE i.id_usuario = $1
           AND (
             -- Deudas totales (padres) siempre
             (i.tipo = 'deuda' AND i.id_item_padre IS NULL AND i.estado NOT IN ('cancelado'))
             OR
             -- Resto filtrado por mes
             (
               i.fecha IS NOT NULL
               AND EXTRACT(YEAR FROM i.fecha) = $2
               AND EXTRACT(MONTH FROM i.fecha) = $3
               AND NOT (i.tipo = 'deuda' AND i.id_item_padre IS NULL)
             )
           )
         ORDER BY
           CASE WHEN i.tipo = 'deuda' AND i.id_item_padre IS NULL THEN 0 ELSE 1 END,
           i.fecha NULLS LAST,
           i.creado_en DESC`,
        [id_usuario, y, m]
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async auditoriaMes(
    id_usuario: number,
    anio: number,
    mes: number
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT
           -- Pagado: solo Completado del mes (gastos/inversiones/cuotas; no deudas padre)
           COALESCE(SUM(CASE
             WHEN estado = 'completado'
              AND tipo != 'ingreso'
              AND NOT (tipo = 'deuda' AND id_item_padre IS NULL)
             THEN monto_total ELSE 0 END), 0)::float AS pagado,
           -- Falta por pagar: SOLO columna Pendiente (todo lo pendiente del mes, sin ingresos)
           COALESCE(SUM(CASE
             WHEN estado = 'pendiente' AND tipo != 'ingreso'
             THEN monto_total ELSE 0 END), 0)::float AS pendiente,
           COALESCE(SUM(CASE WHEN tipo IN ('gasto','inversion') AND estado = 'cancelado'
             THEN monto_total ELSE 0 END), 0)::float AS cancelado,
           COALESCE(SUM(CASE WHEN tipo = 'ingreso'
             THEN monto_total ELSE 0 END), 0)::float AS ingresos_items,
           COALESCE(SUM(CASE
             WHEN tipo != 'ingreso' AND estado != 'cancelado'
              AND NOT (tipo = 'deuda' AND id_item_padre IS NULL AND estado = 'en_proceso')
             THEN monto_total ELSE 0 END), 0)::float AS gastos_planificados,
           COUNT(*) FILTER (
             WHERE estado = 'completado'
               AND tipo != 'ingreso'
               AND NOT (tipo = 'deuda' AND id_item_padre IS NULL)
           )::int AS n_pagados,
           COUNT(*) FILTER (
             WHERE estado = 'pendiente' AND tipo != 'ingreso'
           )::int AS n_pendientes
         FROM items_financieros
         WHERE id_usuario = $1
           AND fecha IS NOT NULL
           AND EXTRACT(YEAR FROM fecha) = $2
           AND EXTRACT(MONTH FROM fecha) = $3`,
        [id_usuario, anio, mes]
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async copiarMes(
    id_usuario: number,
    desde: string,
    hacia: string
  ): Promise<{ data: ItemFinanciero[] | null; error: any }> {
    try {
      const [hy, hm] = hacia.split('-').map(Number);
      const haciaStart = `${hacia}-01`;

      // Solo recurrentes sueltos. Las cuotas de deudas las maneja ensureCuotasDelMes.
      const { rows: origen } = await pool.query(
        `SELECT DISTINCT ON (titulo, tipo) *
         FROM items_financieros
         WHERE id_usuario = $1
           AND es_recurrente = true
           AND estado != 'cancelado'
           AND fecha IS NOT NULL
           AND fecha < $2::date
           AND id_item_padre IS NULL
           AND NOT (tipo = 'deuda' AND estado = 'en_proceso')
         ORDER BY titulo, tipo, fecha DESC`,
        [id_usuario, haciaStart]
      );

      let source = origen;
      if (!source.length && desde) {
        const [dy, dm] = desde.split('-').map(Number);
        const { rows } = await pool.query(
          `SELECT * FROM items_financieros
           WHERE id_usuario = $1
             AND fecha IS NOT NULL
             AND EXTRACT(YEAR FROM fecha) = $2
             AND EXTRACT(MONTH FROM fecha) = $3
             AND es_recurrente = true
             AND estado != 'cancelado'
             AND id_item_padre IS NULL
             AND NOT (tipo = 'deuda' AND estado = 'en_proceso')`,
          [id_usuario, dy, dm]
        );
        source = rows;
      }

      const created: ItemFinanciero[] = [];
      for (const item of source) {
        if (item.id_item_padre) continue;

        const itemInicio = toDateOnly(item.fecha_inicio) || toDateOnly(item.fecha);
        if (itemInicio) {
          const [iy, im] = itemInicio.split('-').map(Number);
          if (hy < iy || (hy === iy && hm < im)) continue;
        }

        const day = Math.min(
          item.fecha ? new Date(item.fecha).getUTCDate() || 1 : 1,
          new Date(hy, hm, 0).getDate()
        );
        const fecha = `${hy}-${String(hm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const exists = await pool.query(
          `SELECT 1 FROM items_financieros
           WHERE id_usuario = $1 AND titulo = $2 AND tipo = $3
             AND estado != 'cancelado'
             AND id_item_padre IS NULL
             AND EXTRACT(YEAR FROM fecha) = $4 AND EXTRACT(MONTH FROM fecha) = $5
           LIMIT 1`,
          [id_usuario, item.titulo, item.tipo, hy, hm]
        );
        if (exists.rows.length) continue;

        const { rows } = await pool.query(
          `INSERT INTO items_financieros
            (id_usuario, titulo, tipo, monto_total, monto_pagado, estado, fecha, notas, id_item_padre, es_recurrente, fecha_inicio)
           VALUES ($1,$2,$3,$4,0,'pendiente',$5,$6,NULL,true,$7)
           RETURNING *`,
          [
            id_usuario,
            item.titulo,
            item.tipo,
            item.monto_total,
            fecha,
            item.notas,
            toDateOnly(item.fecha_inicio) || toDateOnly(item.fecha),
          ]
        );
        created.push(rows[0]);
      }
      return { data: created, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getById(id: number, id_usuario: number): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT i.*, p.titulo AS padre_titulo
         FROM items_financieros i
         LEFT JOIN items_financieros p ON p.id_item = i.id_item_padre
         WHERE i.id_item = $1 AND i.id_usuario = $2`,
        [id, id_usuario]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async create(id_usuario: number, data: CreateItemData): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO items_financieros
          (id_usuario, titulo, tipo, monto_total, monto_pagado, estado, fecha, notas,
           id_item_padre, cuota_mensual, n_cuotas, cuotas_pagadas, dia_cobro, cuota_inicial, es_recurrente, fecha_inicio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          id_usuario,
          data.titulo,
          data.tipo,
          data.monto_total,
          data.monto_pagado ?? 0,
          data.estado || 'pendiente',
          data.fecha || null,
          data.notas || null,
          data.id_item_padre ?? null,
          data.cuota_mensual ?? null,
          data.n_cuotas ?? null,
          data.cuotas_pagadas ?? null,
          data.dia_cobro ?? null,
          data.cuota_inicial ?? null,
          data.es_recurrente ?? false,
          data.fecha_inicio || data.fecha || null,
        ]
      );
      return { data: rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(
    id: number,
    id_usuario: number,
    data: UpdateItemData
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
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
        `UPDATE items_financieros SET ${fields.join(', ')}
         WHERE id_item = $${i++} AND id_usuario = $${i}
         RETURNING *`,
        values
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async remove(id: number, id_usuario: number): Promise<{ data: boolean; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM items_financieros WHERE id_item = $1 AND id_usuario = $2`,
        [id, id_usuario]
      );
      return { data: (r.rowCount ?? 0) > 0, error: null };
    } catch (error) {
      return { data: false, error };
    }
  }

  async addAbono(
    id: number,
    id_usuario: number,
    monto: number
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `UPDATE items_financieros
         SET monto_pagado = LEAST(monto_total, monto_pagado + $1),
             estado = CASE
               WHEN LEAST(monto_total, monto_pagado + $1) >= monto_total THEN 'completado'
               WHEN estado = 'pendiente' THEN 'en_proceso'
               ELSE estado
             END,
             actualizado_en = NOW()
         WHERE id_item = $2 AND id_usuario = $3
         RETURNING *`,
        [monto, id, id_usuario]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Recalcula monto_pagado y cuotas_pagadas de una deuda plan
   * desde sus cuotas/hijos en estado completado (+ cuota_inicial).
   */
  async resyncDeudaDesdeHijos(
    id_padre: number,
    id_usuario: number
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const padreRes = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_item = $1 AND id_usuario = $2 AND tipo = 'deuda'`,
        [id_padre, id_usuario]
      );
      const padre = padreRes.rows[0];
      if (!padre || !padre.cuota_mensual) {
        return { data: padre || null, error: null };
      }

      const { rows: hijos } = await pool.query(
        `SELECT monto_total FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado = 'completado'`,
        [id_usuario, id_padre]
      );

      const cuotaMensual = Number(padre.cuota_mensual) || 0;
      const cuotaInicial = Number(padre.cuota_inicial) || 0;
      const nCuotas = Number(padre.n_cuotas) || 999;
      const montoTotal = Number(padre.monto_total);

      let pagadoHijos = 0;
      let cuotasDesdeHijos = 0;
      for (const h of hijos) {
        const m = Number(h.monto_total) || 0;
        pagadoHijos += m;
        if (cuotaMensual > 0) {
          cuotasDesdeHijos += Math.max(1, Math.round(m / cuotaMensual));
        } else {
          cuotasDesdeHijos += 1;
        }
      }

      const montoPagado = Math.min(montoTotal, Math.max(0, cuotaInicial + pagadoHijos));
      const cuotasFinal = Math.min(nCuotas, Math.max(0, cuotasDesdeHijos));

      let estado = padre.estado;
      if (estado !== 'cancelado') {
        if (montoPagado >= montoTotal) estado = 'completado';
        else estado = 'en_proceso';
      }

      const { rows } = await pool.query(
        `UPDATE items_financieros
         SET monto_pagado = $1,
             cuotas_pagadas = $2,
             estado = $3,
             actualizado_en = NOW()
         WHERE id_item = $4 AND id_usuario = $5
         RETURNING *`,
        [montoPagado, cuotasFinal, estado, id_padre, id_usuario]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async incrementCuotasPagadas(
    id: number,
    id_usuario: number,
    cantidad = 1
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const n = Math.max(1, Math.floor(cantidad));
      const { rows } = await pool.query(
        `UPDATE items_financieros
         SET cuotas_pagadas = LEAST(COALESCE(n_cuotas, 999), COALESCE(cuotas_pagadas, 0) + $3),
             actualizado_en = NOW()
         WHERE id_item = $1 AND id_usuario = $2
         RETURNING *`,
        [id, id_usuario, n]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /** Cancela vinculados de meses calendario anteriores a fecha_inicio (no por día). */
  async cancelarVinculadosAntesDe(
    id_usuario: number,
    id_padre: number,
    fechaInicio: string
  ): Promise<{ data: number; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado IN ('pendiente', 'programado', 'en_proceso', 'cancelado')
           AND fecha IS NOT NULL
           AND (
             EXTRACT(YEAR FROM fecha) < EXTRACT(YEAR FROM $3::date)
             OR (
               EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $3::date)
               AND EXTRACT(MONTH FROM fecha) < EXTRACT(MONTH FROM $3::date)
             )
           )`,
        [id_usuario, id_padre, fechaInicio]
      );
      return { data: r.rowCount ?? 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  /** Cualquier cuota abierta de la deuda (para cuotas únicas). */
  async findAnyOpenCuota(
    id_usuario: number,
    id_padre: number
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado IN ('pendiente', 'programado', 'en_proceso')
         ORDER BY fecha ASC NULLS LAST, id_item ASC
         LIMIT 1`,
        [id_usuario, id_padre]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteOtrasCuotasAbiertas(
    id_usuario: number,
    id_padre: number,
    keepId: number
  ): Promise<{ data: number; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND id_item != $3
           AND estado IN ('pendiente', 'programado', 'en_proceso')`,
        [id_usuario, id_padre, keepId]
      );
      return { data: r.rowCount ?? 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  /** Al pagar una cuota acumulada, completa las pendientes de meses anteriores. */
  async completarCuotasAnteriores(
    id_usuario: number,
    id_padre: number,
    fechaCuota: string | null
  ): Promise<{ data: number; error: any }> {
    if (!fechaCuota) return { data: 0, error: null };
    try {
      const r = await pool.query(
        `UPDATE items_financieros
         SET estado = 'completado',
             monto_pagado = monto_total,
             actualizado_en = NOW()
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado IN ('pendiente', 'programado', 'en_proceso')
           AND fecha IS NOT NULL
           AND (
             EXTRACT(YEAR FROM fecha) < EXTRACT(YEAR FROM $3::date)
             OR (
               EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $3::date)
               AND EXTRACT(MONTH FROM fecha) < EXTRACT(MONTH FROM $3::date)
             )
           )`,
        [id_usuario, id_padre, fechaCuota]
      );
      return { data: r.rowCount ?? 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  /** Cuota abierta en un mes estrictamente posterior (ya se arrastró el pago). */
  async findCuotaAbiertaPosterior(
    id_usuario: number,
    id_padre: number,
    year: number,
    month: number
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado IN ('pendiente', 'programado', 'en_proceso')
           AND fecha IS NOT NULL
           AND (
             EXTRACT(YEAR FROM fecha) > $3
             OR (EXTRACT(YEAR FROM fecha) = $3 AND EXTRACT(MONTH FROM fecha) > $4)
           )
         ORDER BY fecha ASC, id_item ASC
         LIMIT 1`,
        [id_usuario, id_padre, year, month]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async dedupeCuotasMes(
    id_usuario: number,
    id_padre: number,
    year: number,
    month: number,
    keepId: number
  ): Promise<{ data: number; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND id_item != $3
           AND estado IN ('pendiente', 'programado', 'en_proceso')
           AND EXTRACT(YEAR FROM fecha) = $4
           AND EXTRACT(MONTH FROM fecha) = $5`,
        [id_usuario, id_padre, keepId, year, month]
      );
      return { data: r.rowCount ?? 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  /** Borra cuotas vinculadas canceladas (basura del arrastre automático). */
  async purgeCuotasCanceladasAuto(id_usuario: number): Promise<{ data: number; error: any }> {
    try {
      const r = await pool.query(
        `DELETE FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre IS NOT NULL
           AND estado = 'cancelado'`,
        [id_usuario]
      );
      return { data: r.rowCount ?? 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  }

  /** Cuotas/pagos vinculados sin completar, anteriores al mes dado (solo desde fecha_inicio). */
  async findUnpaidLinkedBefore(
    id_usuario: number,
    id_padre: number,
    year: number,
    month: number,
    fechaInicio?: string | null
  ): Promise<{ data: ItemFinanciero[] | null; error: any }> {
    try {
      const vals: any[] = [id_usuario, id_padre, year, month];
      let inicioSql = '';
      if (fechaInicio) {
        vals.push(fechaInicio);
        // Incluir desde el mes calendario de fecha_inicio (no cortar por día)
        inicioSql = ` AND (
          EXTRACT(YEAR FROM fecha) > EXTRACT(YEAR FROM $${vals.length}::date)
          OR (
            EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $${vals.length}::date)
            AND EXTRACT(MONTH FROM fecha) >= EXTRACT(MONTH FROM $${vals.length}::date)
          )
        )`;
      }
      const { rows } = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado IN ('pendiente', 'programado', 'en_proceso')
           AND fecha IS NOT NULL
           AND (EXTRACT(YEAR FROM fecha) < $3
             OR (EXTRACT(YEAR FROM fecha) = $3 AND EXTRACT(MONTH FROM fecha) < $4))
           ${inicioSql}
         ORDER BY fecha DESC, id_item DESC`,
        vals
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /** Deudas con plan de cuotas activas (aún quedan cuotas). */
  async listDeudasConPlan(id_usuario: number): Promise<{ data: ItemFinanciero[] | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_usuario = $1
           AND tipo = 'deuda'
           AND id_item_padre IS NULL
           AND cuota_mensual IS NOT NULL
           AND cuota_mensual > 0
           AND n_cuotas IS NOT NULL
           AND COALESCE(cuotas_pagadas, 0) < n_cuotas
           AND estado NOT IN ('completado', 'cancelado')`,
        [id_usuario]
      );
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async findCuotaMes(
    id_usuario: number,
    id_padre: number,
    year: number,
    month: number
  ): Promise<{ data: ItemFinanciero | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM items_financieros
         WHERE id_usuario = $1
           AND id_item_padre = $2
           AND estado != 'cancelado'
           AND EXTRACT(YEAR FROM fecha) = $3
           AND EXTRACT(MONTH FROM fecha) = $4
         ORDER BY
           CASE estado
             WHEN 'pendiente' THEN 0
             WHEN 'programado' THEN 1
             WHEN 'en_proceso' THEN 2
             WHEN 'completado' THEN 3
             ELSE 4
           END,
           id_item DESC
         LIMIT 1`,
        [id_usuario, id_padre, year, month]
      );
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async resumen(id_usuario: number): Promise<{ data: ItemsResumen | null; error: any }> {
    try {
      const { rows } = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN tipo = 'gasto'
             AND fecha >= date_trunc('month', CURRENT_DATE)
             AND fecha < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
             AND estado != 'cancelado'
             THEN monto_total ELSE 0 END), 0)::float AS gastos_mes,
           COALESCE(SUM(CASE WHEN tipo = 'ingreso'
             AND fecha >= date_trunc('month', CURRENT_DATE)
             AND fecha < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
             THEN monto_total ELSE 0 END), 0)::float AS ingresos_mes,
           COALESCE(SUM(CASE WHEN tipo = 'deuda' AND id_item_padre IS NULL AND estado != 'cancelado'
             THEN monto_total ELSE 0 END), 0)::float AS deuda_total,
           COALESCE(SUM(CASE WHEN tipo = 'deuda' AND id_item_padre IS NULL AND estado != 'cancelado'
             THEN monto_pagado ELSE 0 END), 0)::float AS deuda_pagada,
           COALESCE(SUM(CASE WHEN tipo = 'ahorro' AND estado != 'cancelado'
             THEN monto_total ELSE 0 END), 0)::float AS ahorro_total,
           COALESCE(SUM(CASE WHEN tipo = 'ahorro' AND estado != 'cancelado'
             THEN monto_pagado ELSE 0 END), 0)::float AS ahorro_actual,
           COUNT(*)::int AS total_items
         FROM items_financieros
         WHERE id_usuario = $1`,
        [id_usuario]
      );
      const r = rows[0];
      const deuda_total = Number(r.deuda_total);
      const deuda_pagada = Number(r.deuda_pagada);
      const deuda_restante = Math.max(0, deuda_total - deuda_pagada);
      const deuda_pct = deuda_total > 0 ? Math.round((deuda_pagada / deuda_total) * 10000) / 100 : 0;

      return {
        data: {
          gastos_mes: Number(r.gastos_mes),
          ingresos_mes: Number(r.ingresos_mes),
          deuda_total,
          deuda_pagada,
          deuda_restante,
          deuda_pct,
          ahorro_total: Number(r.ahorro_total),
          ahorro_actual: Number(r.ahorro_actual),
          total_items: Number(r.total_items),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}
