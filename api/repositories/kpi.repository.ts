import pool from '../libs/db';
import { KpiDashboard } from '../interfaces/kpi.interface';

export class KpiRepository {
  async getDashboard(id_usuario: number): Promise<{ data: KpiDashboard | null; error: any }> {
    try {
      const balance = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0)::float AS ingresos_mes,
           COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0)::float AS egresos_mes
         FROM movimientos
         WHERE id_usuario = $1
           AND fecha >= date_trunc('month', CURRENT_DATE)
           AND fecha < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [id_usuario]
      );

      const metas = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE estado IN ('pendiente', 'en_progreso'))::int AS activas,
           COUNT(*) FILTER (WHERE estado = 'completada')::int AS completadas
         FROM metas WHERE id_usuario = $1`,
        [id_usuario]
      );

      const tareas = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE completada = false AND fecha_programada >= CURRENT_DATE)::int AS pendientes,
           COUNT(*) FILTER (WHERE completada = true AND fecha_programada >= CURRENT_DATE - INTERVAL '7 days')::int AS completadas_semana
         FROM tareas WHERE id_usuario = $1`,
        [id_usuario]
      );

      const ahorros = await pool.query(
        `SELECT
           COALESCE(SUM(monto_objetivo), 0)::float AS total_objetivo,
           COALESCE(SUM(monto_actual), 0)::float AS total_actual
         FROM metas_ahorro WHERE id_usuario = $1 AND estado = 'activa'`,
        [id_usuario]
      );

      const porCat = await pool.query(
        `SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria,
                COALESCE(c.color, '#888888') AS color,
                SUM(m.monto)::float AS total
         FROM movimientos m
         LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
         WHERE m.id_usuario = $1 AND m.tipo = 'egreso'
           AND m.fecha >= date_trunc('month', CURRENT_DATE)
         GROUP BY c.nombre, c.color
         ORDER BY total DESC
         LIMIT 8`,
        [id_usuario]
      );

      const flujo = await pool.query(
        `SELECT to_char(date_trunc('month', fecha), 'YYYY-MM') AS mes,
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0)::float AS ingresos,
                COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0)::float AS egresos
         FROM movimientos
         WHERE id_usuario = $1
           AND fecha >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
         GROUP BY 1
         ORDER BY 1`,
        [id_usuario]
      );

      const ingresos = balance.rows[0].ingresos_mes;
      const egresos = balance.rows[0].egresos_mes;
      const balanceMes = ingresos - egresos;
      const tasa = ingresos > 0 ? (balanceMes / ingresos) * 100 : 0;
      const obj = ahorros.rows[0].total_objetivo;
      const act = ahorros.rows[0].total_actual;

      const data: KpiDashboard = {
        ingresos_mes: ingresos,
        egresos_mes: egresos,
        balance_mes: balanceMes,
        tasa_ahorro_pct: Math.round(tasa * 100) / 100,
        metas_activas: metas.rows[0].activas,
        metas_completadas: metas.rows[0].completadas,
        tareas_pendientes: tareas.rows[0].pendientes,
        tareas_completadas_semana: tareas.rows[0].completadas_semana,
        ahorros_total_objetivo: obj,
        ahorros_total_actual: act,
        progreso_ahorros_pct: obj > 0 ? Math.round((act / obj) * 10000) / 100 : 0,
        gastos_por_categoria: porCat.rows,
        flujo_mensual: flujo.rows,
      };

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
