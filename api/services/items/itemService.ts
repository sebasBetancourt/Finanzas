import { ItemRepository } from '../../repositories/item.repository';
import { PresupuestoRepository } from '../../repositories/presupuesto.repository';
import {
  CreateItemData,
  CreateDeudaPlanData,
  UpdateItemData,
} from '../../interfaces/item.interface';

const repo = new ItemRepository();
const presupuestoRepo = new PresupuestoRepository();

function fechaCobroMes(dia: number, ref = new Date()): string {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(dia || 1, lastDay);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Normaliza DATE de Postgres (objeto Date) a YYYY-MM-DD. */
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

/** Lo que aún se debe de una cuota. Si está pendiente pero monto_pagado quedó lleno, cuenta el total. */
function montoPendienteCuota(item: {
  estado?: string;
  monto_total?: number | string;
  monto_pagado?: number | string | null;
}): number {
  const total = Number(item.monto_total) || 0;
  const pagado = Number(item.monto_pagado || 0);
  const abierto = ['pendiente', 'programado', 'en_proceso'].includes(String(item.estado || ''));
  if (abierto && pagado >= total && total > 0) return total;
  return Math.max(0, total - pagado);
}

export class ItemServiceClass {
  async list(
    userId: number,
    filters?: {
      tipo?: string;
      estado?: string;
      desde?: string;
      hasta?: string;
      mes?: string;
      todos?: boolean;
    }
  ) {
    const ref = filters?.mes
      ? new Date(Number(filters.mes.slice(0, 4)), Number(filters.mes.slice(5, 7)) - 1, 1)
      : new Date();
    await this.ensureCuotasDelMes(userId, ref);

    // Al entrar a un mes, traer automáticamente gastos/inversiones recurrentes del mes anterior → Pendiente
    if (filters?.mes) {
      await this.ensureRecurrentesDelMes(userId, filters.mes);
    }

    if (filters?.mes || filters?.todos) {
      const { data, error } = await repo.listBoard(userId, {
        mes: filters.mes,
        todos: filters.todos,
      });
      if (error) return { data: null, error: { status: 500, message: 'Error al listar ítems', details: error } };
      return { data, error: null };
    }

    const { data, error } = await repo.list(userId, filters);
    if (error) return { data: null, error: { status: 500, message: 'Error al listar ítems', details: error } };
    return { data, error: null };
  }

  async auditoriaMes(userId: number, anio: number, mes: number) {
    const { data: audit, error } = await repo.auditoriaMes(userId, anio, mes);
    if (error) return { data: null, error: { status: 500, message: 'Error en auditoría', details: error } };

    const { data: presupuesto } = await presupuestoRepo.get(userId, anio, mes);
    const ingreso_total = Number(presupuesto?.ingreso_total || audit?.ingresos_items || 0);
    const pagado = Number(audit?.pagado || 0);
    const pendiente = Number(audit?.pendiente || 0);
    const disponible = ingreso_total - pagado;

    return {
      data: {
        anio,
        mes,
        ingreso_total,
        ingreso_items: Number(audit?.ingresos_items || 0),
        pagado,
        pendiente,
        cancelado: Number(audit?.cancelado || 0),
        gastos_planificados: Number(audit?.gastos_planificados || 0),
        disponible,
        n_pagados: Number(audit?.n_pagados || 0),
        n_pendientes: Number(audit?.n_pendientes || 0),
        presupuesto,
      },
      error: null,
    };
  }

  async getPresupuesto(userId: number, anio: number, mes: number) {
    const { data, error } = await presupuestoRepo.get(userId, anio, mes);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener presupuesto', details: error } };
    return { data: data || { anio, mes, ingreso_total: 0 }, error: null };
  }

  async setPresupuesto(
    userId: number,
    anio: number,
    mes: number,
    ingreso_total: number,
    notas?: string | null
  ) {
    const { data, error } = await presupuestoRepo.upsert(userId, anio, mes, ingreso_total, notas);
    if (error) return { data: null, error: { status: 500, message: 'Error al guardar presupuesto', details: error } };
    return { data, error: null };
  }

  async copiarMes(userId: number, desde: string, hacia: string) {
    const { data, error } = await repo.copiarMes(userId, desde, hacia);
    if (error) return { data: null, error: { status: 500, message: 'Error al copiar mes', details: error } };
    return { data, error: null };
  }

  async get(userId: number, id: number) {
    const { data, error } = await repo.getById(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener ítem', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };
    return { data, error: null };
  }

  async create(userId: number, input: CreateItemData) {
    const { data, error } = await repo.create(userId, input);
    if (error) return { data: null, error: { status: 500, message: 'Error al crear ítem', details: error } };
    return { data, error: null };
  }

  async createDeudaPlan(userId: number, input: CreateDeudaPlanData) {
    const cuotaMensual = Number(input.cuota_mensual);
    const nCuotas = Number(input.n_cuotas);
    const cuotaInicial = Number(input.cuota_inicial || 0);
    const diaCobro = input.dia_cobro || 1;
    const fechaInicio =
      toDateOnly(input.fecha_inicio) || fechaCobroMes(diaCobro);

    const montoTotal = cuotaInicial + cuotaMensual * nCuotas;

    let cuotasPagadas = Math.min(Math.max(0, Number(input.cuotas_pagadas || 0)), nCuotas);
    let montoPagado =
      input.monto_pagado != null && input.monto_pagado !== undefined
        ? Math.min(Math.max(0, Number(input.monto_pagado)), montoTotal)
        : Math.min(cuotaInicial + cuotaMensual * cuotasPagadas, montoTotal);

    // Si mandaron monto, estimar cuotas pagadas
    if (input.monto_pagado != null && input.monto_pagado !== undefined && cuotaMensual > 0) {
      const despuesInicial = Math.max(0, montoPagado - cuotaInicial);
      cuotasPagadas = Math.min(nCuotas, Math.floor(despuesInicial / cuotaMensual));
    }

    const padre = await repo.create(userId, {
      titulo: input.titulo,
      tipo: 'deuda',
      monto_total: montoTotal,
      monto_pagado: montoPagado,
      estado: montoPagado >= montoTotal ? 'completado' : 'en_proceso',
      notas: input.notas,
      cuota_mensual: cuotaMensual,
      n_cuotas: nCuotas,
      cuotas_pagadas: cuotasPagadas,
      dia_cobro: diaCobro,
      cuota_inicial: cuotaInicial,
      fecha: fechaInicio,
      fecha_inicio: fechaInicio,
    });

    if (padre.error || !padre.data) {
      return { data: null, error: { status: 500, message: 'Error al crear deuda', details: padre.error } };
    }

    let cuota = null;
    if (cuotasPagadas < nCuotas) {
      const created = await repo.create(userId, {
        titulo: `Cuota ${input.titulo}`,
        tipo: 'gasto',
        monto_total: cuotaMensual,
        monto_pagado: 0,
        estado: 'pendiente',
        fecha: fechaInicio,
        id_item_padre: padre.data.id_item,
        notas: `Cuota ${cuotasPagadas + 1}/${nCuotas} · ${input.titulo}`,
      });
      cuota = created.data;
    }

    return { data: { deuda: padre.data, cuota_mes: cuota }, error: null };
  }

  async update(userId: number, id: number, input: UpdateItemData) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) {
      return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };
    }

    const prevEstado = existing.data.estado;
    const prevPadre = existing.data.id_item_padre;

    // Completado ↔ pendiente: sincronizar monto_pagado de la cuota
    const patch: UpdateItemData = { ...input };
    if (input.estado !== undefined && input.estado !== prevEstado && input.monto_pagado === undefined) {
      if (input.estado === 'completado') {
        patch.monto_pagado = Number(existing.data.monto_total);
      } else if (prevEstado === 'completado') {
        patch.monto_pagado = 0;
      }
    }

    const { data, error } = await repo.update(id, userId, patch);
    if (error) return { data: null, error: { status: 500, message: 'Error al actualizar ítem', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };

    const padresAResync = new Set<number>();
    if (prevPadre) padresAResync.add(Number(prevPadre));
    if (data.id_item_padre) padresAResync.add(Number(data.id_item_padre));

    const estadoCambio = input.estado !== undefined && input.estado !== prevEstado;
    const vinculoCambio = input.id_item_padre !== undefined && input.id_item_padre !== prevPadre;
    const montoCambio = input.monto_total !== undefined;

    if ((estadoCambio || vinculoCambio || montoCambio) && padresAResync.size) {
      // Si completas una cuota acumulada, marca como pagadas las de meses anteriores
      if (
        input.estado === 'completado' &&
        prevEstado !== 'completado' &&
        data.id_item_padre
      ) {
        await repo.completarCuotasAnteriores(
          userId,
          Number(data.id_item_padre),
          toDateOnly(data.fecha)
        );
      }
      for (const pid of padresAResync) {
        await repo.resyncDeudaDesdeHijos(pid, userId);
      }
    }

    return { data, error: null };
  }

  async remove(userId: number, id: number) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) {
      return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };
    }
    const padreId = existing.data.id_item_padre;

    const { data, error } = await repo.remove(id, userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al eliminar ítem', details: error } };
    if (!data) return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };

    if (padreId) {
      await repo.resyncDeudaDesdeHijos(Number(padreId), userId);
    }
    return { data: true, error: null };
  }

  async addAbono(userId: number, id: number, monto: number) {
    const existing = await repo.getById(id, userId);
    if (!existing.data) {
      return { data: null, error: { status: 404, message: 'Ítem no encontrado', details: null } };
    }
    if (!['deuda', 'ahorro'].includes(existing.data.tipo)) {
      return { data: null, error: { status: 400, message: 'Solo deudas o ahorros aceptan abonos', details: null } };
    }
    const { data, error } = await repo.addAbono(id, userId, monto);
    if (error) return { data: null, error: { status: 500, message: 'Error al registrar abono', details: error } };
    return { data, error: null };
  }

  async resumen(userId: number) {
    await this.ensureCuotasDelMes(userId);
    const { data, error } = await repo.resumen(userId);
    if (error) return { data: null, error: { status: 500, message: 'Error al obtener resumen', details: error } };
    return { data, error: null };
  }

  async ensureCuotasDelMes(userId: number, ref = new Date()) {
    const { data: deudas } = await repo.listDeudasConPlan(userId);
    if (!deudas?.length) return;

    const year = ref.getFullYear();
    const month = ref.getMonth() + 1;

    for (const deuda of deudas) {
      const pagadas = Number(deuda.cuotas_pagadas || 0);
      const n = Number(deuda.n_cuotas || 0);
      if (pagadas >= n) continue;

      const cuotaMensual = Number(deuda.cuota_mensual);
      if (!cuotaMensual) continue;

      const dia = Number(deuda.dia_cobro || 1);
      const inicioRaw =
        toDateOnly(deuda.fecha_inicio) || toDateOnly(deuda.fecha) || null;
      if (inicioRaw) {
        const [iy, im] = inicioRaw.split('-').map(Number);
        if (year < iy || (year === iy && month < im)) continue;
      }

      let fechaCobro = fechaCobroMes(dia, ref);
      if (inicioRaw && fechaCobro < inicioRaw && fechaCobro.slice(0, 7) === inicioRaw.slice(0, 7)) {
        fechaCobro = inicioRaw;
      }

      const solaCuota = n === 1;

      // Cuota única: una sola tarjeta que se mueve al mes que estás viendo
      if (solaCuota) {
        const abierta = await repo.findAnyOpenCuota(userId, deuda.id_item);
        if (abierta.data) {
          await repo.update(abierta.data.id_item, userId, {
            titulo: `Cuota ${deuda.titulo}`,
            monto_total: Math.max(cuotaMensual, Number(abierta.data.monto_total) || cuotaMensual),
            monto_pagado: 0,
            estado: 'pendiente',
            fecha: fechaCobro,
            notas: `Cuota única · ${deuda.titulo}`,
          });
          await repo.dedupeCuotasMes(userId, deuda.id_item, year, month, abierta.data.id_item);
          // Quitar duplicados de otros meses
          await repo.deleteOtrasCuotasAbiertas(userId, deuda.id_item, abierta.data.id_item);
        } else {
          await repo.create(userId, {
            titulo: `Cuota ${deuda.titulo}`,
            tipo: 'gasto',
            monto_total: cuotaMensual,
            monto_pagado: 0,
            estado: 'pendiente',
            fecha: fechaCobro,
            id_item_padre: deuda.id_item,
            notas: `Cuota única · ${deuda.titulo}`,
            es_recurrente: false,
          });
        }
        continue;
      }

      // Varias cuotas: cada mes tiene su tarjeta; el mes actual suma atrasos SIN borrar los meses previos
      const existing = await repo.findCuotaMes(userId, deuda.id_item, year, month);
      const unpaid = await repo.findUnpaidLinkedBefore(
        userId,
        deuda.id_item,
        year,
        month,
        inicioRaw
      );
      const atrasados = (unpaid.data || []).filter((i) => montoPendienteCuota(i) > 0);
      const atrasos = atrasados.reduce((s, i) => s + montoPendienteCuota(i), 0);
      const montoFinal = cuotaMensual + atrasos;
      const nota =
        atrasos > 0
          ? `Cuota ${formatMoneyNote(cuotaMensual)} + atraso ${formatMoneyNote(atrasos)}`
          : `Cuota ${pagadas + 1}/${n} · ${deuda.titulo}`;

      if (existing.data) {
        if (Number(existing.data.monto_total) !== montoFinal) {
          await repo.update(existing.data.id_item, userId, {
            monto_total: montoFinal,
            monto_pagado: 0,
            estado: 'pendiente',
            fecha: fechaCobro,
            notas: nota,
          });
        }
        await repo.dedupeCuotasMes(userId, deuda.id_item, year, month, existing.data.id_item);
        continue;
      }

      await repo.create(userId, {
        titulo: `Cuota ${deuda.titulo}`,
        tipo: 'gasto',
        monto_total: montoFinal,
        monto_pagado: 0,
        estado: 'pendiente',
        fecha: fechaCobro,
        id_item_padre: deuda.id_item,
        notas: nota,
        es_recurrente: false,
      });
    }

    await repo.purgeCuotasCanceladasAuto(userId);
  }

  /**
   * Recurrentes del mes anterior → Pendiente.
   * Si estaban vinculados a una deuda y NO se completaron, se acumulan (100 → 200).
   */
  async ensureRecurrentesDelMes(userId: number, mesKey: string) {
    const prev = new Date(Number(mesKey.slice(0, 4)), Number(mesKey.slice(5, 7)) - 2, 1);
    const desde = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    await repo.copiarMes(userId, desde, mesKey);
  }
}

function formatMoneyNote(n: number) {
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}

export const itemService = new ItemServiceClass();
