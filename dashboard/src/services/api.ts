import { apiFetch } from "@/auth/apiFetch";
import type { KpiDashboard } from "@/interfaces/kpi";
import type { ItemFinanciero, ItemsResumen } from "@/interfaces/item";

export const getDashboardKpis = () =>
  apiFetch("/kpis/dashboard") as Promise<KpiDashboard>;

export const listItems = (params?: {
  tipo?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  mes?: string;
  todos?: boolean;
  q?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.tipo) q.set("tipo", params.tipo);
  if (params?.estado) q.set("estado", params.estado);
  if (params?.desde) q.set("desde", params.desde);
  if (params?.hasta) q.set("hasta", params.hasta);
  if (params?.mes) q.set("mes", params.mes);
  if (params?.todos) q.set("todos", "true");
  if (params?.q?.trim()) q.set("q", params.q.trim());
  const qs = q.toString();
  return apiFetch(`/items${qs ? `?${qs}` : ""}`) as Promise<ItemFinanciero[]>;
};

export const getItemsResumen = () =>
  apiFetch("/items/resumen") as Promise<ItemsResumen>;

export const getAuditoriaMes = (anio: number, mes: number) =>
  apiFetch(`/items/auditoria?anio=${anio}&mes=${mes}`) as Promise<{
    anio: number;
    mes: number;
    ingreso_total: number;
    ingreso_items: number;
    pagado: number;
    pendiente: number;
    cancelado: number;
    gastos_planificados: number;
    disponible: number;
    n_pagados: number;
    n_pendientes: number;
  }>;

export const setPresupuestoMes = (body: {
  anio: number;
  mes: number;
  ingreso_total: number;
  notas?: string;
}) =>
  apiFetch("/items/presupuesto", {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const copiarMes = (desde: string, hacia: string) =>
  apiFetch("/items/copiar-mes", {
    method: "POST",
    body: JSON.stringify({ desde, hacia }),
  }) as Promise<ItemFinanciero[]>;

export const createItem = (body: unknown) =>
  apiFetch("/items", { method: "POST", body: JSON.stringify(body) }) as Promise<ItemFinanciero>;

export const createDeudaPlan = (body: {
  titulo: string;
  cuota_mensual: number;
  n_cuotas: number;
  cuota_inicial?: number;
  cuotas_pagadas?: number;
  monto_pagado?: number;
  dia_cobro?: number;
  fecha_inicio?: string;
  notas?: string;
}) =>
  apiFetch("/items/deuda-plan", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateItem = (id: number, body: unknown) =>
  apiFetch(`/items/${id}`, { method: "PUT", body: JSON.stringify(body) }) as Promise<ItemFinanciero>;

export const deleteItem = (id: number) =>
  apiFetch(`/items/${id}`, { method: "DELETE" });

export const addItemAbono = (id: number, monto: number) =>
  apiFetch(`/items/${id}/abonos`, {
    method: "POST",
    body: JSON.stringify({ monto }),
  }) as Promise<ItemFinanciero>;

export const listSuenos = () => apiFetch("/suenos");
export const createSueno = (body: unknown) =>
  apiFetch("/suenos", { method: "POST", body: JSON.stringify(body) });

export const listMetas = (params?: { id_sueno?: number; estado?: string }) => {
  const q = new URLSearchParams();
  if (params?.id_sueno) q.set("id_sueno", String(params.id_sueno));
  if (params?.estado) q.set("estado", params.estado);
  const qs = q.toString();
  return apiFetch(`/metas${qs ? `?${qs}` : ""}`);
};
export const createMeta = (body: unknown) =>
  apiFetch("/metas", { method: "POST", body: JSON.stringify(body) });

export const listTareas = (desde?: string, hasta?: string) => {
  const q = new URLSearchParams();
  if (desde) q.set("desde", desde);
  if (hasta) q.set("hasta", hasta);
  const qs = q.toString();
  return apiFetch(`/tareas${qs ? `?${qs}` : ""}`);
};
export const createTarea = (body: unknown) =>
  apiFetch("/tareas", { method: "POST", body: JSON.stringify(body) });
export const updateTarea = (id: number, body: unknown) =>
  apiFetch(`/tareas/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const listRutinas = () => apiFetch("/rutinas");
export const createRutina = (body: unknown) =>
  apiFetch("/rutinas", { method: "POST", body: JSON.stringify(body) });

export const listAhorros = () => apiFetch("/ahorros");
export const createAhorro = (body: unknown) =>
  apiFetch("/ahorros", { method: "POST", body: JSON.stringify(body) });
export const addAporte = (id: number, body: unknown) =>
  apiFetch(`/ahorros/${id}/aportes`, { method: "POST", body: JSON.stringify(body) });

export const listCategorias = (tipo?: string) =>
  apiFetch(`/categorias${tipo ? `?tipo=${tipo}` : ""}`);

export const listMovimientos = (params?: { tipo?: string; desde?: string; hasta?: string }) => {
  const q = new URLSearchParams();
  if (params?.tipo) q.set("tipo", params.tipo);
  if (params?.desde) q.set("desde", params.desde);
  if (params?.hasta) q.set("hasta", params.hasta);
  const qs = q.toString();
  return apiFetch(`/movimientos${qs ? `?${qs}` : ""}`);
};
export const createMovimiento = (body: unknown) =>
  apiFetch("/movimientos", { method: "POST", body: JSON.stringify(body) });
