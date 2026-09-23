import { apiFetch } from "@/auth/apiFetch";
import type { KpiDashboard } from "@/interfaces/kpi";

export const getDashboardKpis = () =>
  apiFetch("/kpis/dashboard") as Promise<KpiDashboard>;

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
