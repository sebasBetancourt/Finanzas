import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMetaMes,
  deleteMetaMes,
  getAuditoriaMes,
  listItems,
  listMetasMes,
  type MetaMes,
  type MetaMesTipo,
} from "@/services/api";
import type { ItemFinanciero, ItemEstado } from "@/interfaces/item";
import { ESTADOS, TIPOS } from "@/interfaces/item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, cn, parseMoneyInput } from "@/lib/utils";
import { toast } from "sonner";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";

type DayStats = {
  day: Date;
  items: ItemFinanciero[];
  ingresos: number;
  gastos: number;
  neto: number;
  pagado: number;
  pendiente: number;
  nPagado: number;
  nPendiente: number;
};

const OPEN_ESTADOS: ItemEstado[] = ["pendiente", "programado", "en_proceso"];

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function isParentDebt(i: ItemFinanciero) {
  return i.tipo === "deuda" && !i.id_item_padre;
}

function isCountableMovement(i: ItemFinanciero) {
  if (isParentDebt(i)) return false;
  if (i.estado === "cancelado") return false;
  return true;
}

function isPaid(i: ItemFinanciero) {
  return i.estado === "completado";
}

function isOpen(i: ItemFinanciero) {
  return OPEN_ESTADOS.includes(i.estado);
}

function estadoLabel(estado: string) {
  return ESTADOS.find((e) => e.id === estado)?.label || estado;
}

function estadoBadgeClass(estado: string) {
  if (estado === "completado") return "bg-emerald-100 text-emerald-800";
  if (estado === "pendiente") return "bg-amber-100 text-amber-900";
  if (estado === "programado") return "bg-sky-100 text-sky-800";
  if (estado === "en_proceso") return "bg-violet-100 text-violet-800";
  if (estado === "ahorro") return "bg-forest/10 text-forest";
  return "bg-forest/10 text-forest/60";
}

function formatMoneyShort(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}$${m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  return formatMoney(n);
}

function ItemRow({
  item,
  onEdit,
}: {
  item: ItemFinanciero;
  onEdit?: (item: ItemFinanciero) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit?.(item)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-forest/10 bg-white px-3 py-2.5 text-left transition hover:border-forest/30 hover:bg-cream/40"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-forest">{item.titulo}</p>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              estadoBadgeClass(item.estado)
            )}
          >
            {estadoLabel(item.estado)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-forest/45">
          {TIPOS.find((t) => t.id === item.tipo)?.label || item.tipo}
          {item.padre_titulo ? ` · ${item.padre_titulo}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          item.tipo === "ingreso"
            ? "text-emerald-700"
            : isPaid(item)
              ? "text-forest"
              : "text-amber-800"
        )}
      >
        {item.tipo === "ingreso" ? "+" : "−"}
        {formatMoney(Number(item.monto_total))}
      </span>
    </button>
  );
}

export function FinanceCalendar({
  onAddForDay,
  onEditItem,
  refreshKey = 0,
  month,
  onMonthChange,
}: {
  onAddForDay: (opts: {
    fecha: string;
    tipo: "gasto" | "ingreso";
    estado?: string;
  }) => void;
  onEditItem?: (item: ItemFinanciero) => void;
  refreshKey?: number;
  /** Mes del selector del tablero (controlado) */
  month: Date;
  onMonthChange: (month: Date) => void;
}) {
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    const today = new Date();
    return isSameMonth(today, month) ? today : startOfMonth(month);
  });
  const [items, setItems] = useState<ItemFinanciero[]>([]);
  const [metas, setMetas] = useState<MetaMes[]>([]);
  const [auditoria, setAuditoria] = useState<{
    ingreso_total: number;
    pagado: number;
    pendiente: number;
    disponible: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [metaTipo, setMetaTipo] = useState<MetaMesTipo>("ingreso");
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaMonto, setMetaMonto] = useState("");
  const [metaItemId, setMetaItemId] = useState("");

  const mesKey = format(month, "yyyy-MM");
  const anio = month.getFullYear();
  const mesNum = month.getMonth() + 1;

  const goMonth = (next: Date) => {
    onMonthChange(startOfMonth(next));
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, metasList, aud] = await Promise.all([
        listItems({ mes: mesKey }),
        listMetasMes(anio, mesNum),
        getAuditoriaMes(anio, mesNum),
      ]);
      setItems(list || []);
      setMetas(metasList || []);
      setAuditoria({
        ingreso_total: Number(aud?.ingreso_total || 0),
        pagado: Number(aud?.pagado || 0),
        pendiente: Number(aud?.pendiente || 0),
        disponible: Number(aud?.disponible || 0),
      });
    } catch (err: any) {
      toast.error(err.message || "Error al cargar calendario");
    } finally {
      setLoading(false);
    }
  }, [mesKey, anio, mesNum]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const deudasPadre = useMemo(
    () =>
      items.filter(
        (i) => i.tipo === "deuda" && !i.id_item_padre && i.estado === "en_proceso"
      ),
    [items]
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, DayStats>();
    for (const day of calendarDays) {
      map.set(dayKey(day), {
        day,
        items: [],
        ingresos: 0,
        gastos: 0,
        neto: 0,
        pagado: 0,
        pendiente: 0,
        nPagado: 0,
        nPendiente: 0,
      });
    }
    for (const item of items) {
      if (!item.fecha || !isCountableMovement(item)) continue;
      const key = String(item.fecha).slice(0, 10);
      const stats = map.get(key);
      if (!stats) continue;
      stats.items.push(item);
      const monto = Number(item.monto_total) || 0;
      if (item.tipo === "ingreso") {
        stats.ingresos += monto;
        if (isPaid(item)) {
          stats.pagado += monto;
          stats.nPagado += 1;
        }
      } else if (["gasto", "inversion"].includes(item.tipo)) {
        stats.gastos += monto;
        if (isPaid(item)) {
          stats.pagado += monto;
          stats.nPagado += 1;
        } else if (isOpen(item)) {
          stats.pendiente += monto;
          stats.nPendiente += 1;
        }
      } else if (item.tipo === "ahorro") {
        const ahorroAmt = Number(item.monto_pagado || monto);
        stats.gastos += ahorroAmt;
        if (isPaid(item) || Number(item.monto_pagado) > 0) {
          stats.pagado += ahorroAmt;
          stats.nPagado += 1;
        } else if (isOpen(item)) {
          stats.pendiente += monto;
          stats.nPendiente += 1;
        }
      }
      stats.neto = stats.ingresos - stats.gastos;
    }
    for (const stats of map.values()) {
      stats.items.sort((a, b) => {
        const rank = (e: string) =>
          e === "pendiente" ? 0 : e === "programado" ? 1 : e === "en_proceso" ? 2 : e === "completado" ? 3 : 4;
        return rank(a.estado) - rank(b.estado);
      });
    }
    return map;
  }, [calendarDays, items]);

  const monthStats = useMemo(() => {
    let ingresos = 0;
    let gastosPagados = 0;
    let gastosPendientes = 0;
    let cuotasPend = 0;
    let cuotasPag = 0;
    let nPagado = 0;
    let nPendiente = 0;
    let ahorro = 0;
    const pendientes: ItemFinanciero[] = [];
    const pagados: ItemFinanciero[] = [];
    for (const item of items) {
      if (isParentDebt(item) || item.estado === "cancelado") continue;
      if (!item.fecha || !isSameMonth(parseISO(String(item.fecha).slice(0, 10)), month)) {
        continue;
      }
      const monto = Number(item.monto_total) || 0;
      if (item.tipo === "ingreso") ingresos += monto;
      if (["gasto", "inversion"].includes(item.tipo)) {
        if (isPaid(item)) {
          gastosPagados += monto;
          nPagado += 1;
          pagados.push(item);
          if (item.id_item_padre) cuotasPag += 1;
        } else if (isOpen(item)) {
          gastosPendientes += monto;
          nPendiente += 1;
          pendientes.push(item);
          if (item.id_item_padre) cuotasPend += 1;
        }
      }
      if (item.tipo === "ahorro") {
        ahorro += Number(item.monto_pagado || monto);
        if (isPaid(item)) {
          nPagado += 1;
          pagados.push(item);
        } else if (isOpen(item)) {
          nPendiente += 1;
          pendientes.push(item);
        }
      }
    }
    const ingresoMeta = metas.find((m) => m.tipo === "ingreso");
    const ahorroMeta = metas.find((m) => m.tipo === "ahorro");
    return {
      ingresos,
      gastos: gastosPagados,
      gastosPendientes,
      cuotasPend,
      cuotasPag,
      nPagado,
      nPendiente,
      ahorro,
      pendientes,
      pagados,
      ingresoObjetivo: Number(ingresoMeta?.monto_objetivo || 0),
      ahorroObjetivo: Number(ahorroMeta?.monto_objetivo || 0),
    };
  }, [items, month, metas]);

  // Si el día seleccionado queda fuera del mes visible, ir al 1º o a hoy
  useEffect(() => {
    if (!selectedDay || isSameMonth(selectedDay, month)) return;
    const today = new Date();
    setSelectedDay(isSameMonth(today, month) ? today : startOfMonth(month));
  }, [month, selectedDay]);

  const selectedStats = selectedDay ? byDay.get(dayKey(selectedDay)) : null;
  const selectedPagados = (selectedStats?.items || []).filter(isPaid);
  const selectedPendientes = (selectedStats?.items || []).filter(isOpen);
  const selectedOtros = (selectedStats?.items || []).filter(
    (i) => !isPaid(i) && !isOpen(i)
  );

  const createMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseMoneyInput(metaMonto);
    if (!metaTitulo.trim() || !monto) {
      toast.error("Título y monto son obligatorios");
      return;
    }
    if ((metaTipo === "pagar_deuda" || metaTipo === "pagar_cuota") && !metaItemId) {
      toast.error("Elige la deuda o cuota a vincular");
      return;
    }
    try {
      await createMetaMes({
        anio,
        mes: mesNum,
        tipo: metaTipo,
        titulo: metaTitulo.trim(),
        monto_objetivo: monto,
        id_item: metaItemId ? Number(metaItemId) : null,
      });
      toast.success("Meta del mes creada");
      setMetaTitulo("");
      setMetaMonto("");
      setMetaItemId("");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeMeta = async (id: number) => {
    try {
      await deleteMetaMes(id);
      toast.success("Meta eliminada");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <p className="text-forest/50">Cargando calendario…</p>;
  }

  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="pb-6">
      {/* Header mes */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl capitalize text-forest md:text-3xl">
            {format(month, "MMMM yyyy", { locale: es })}
          </h3>
          <p className="mt-0.5 text-sm text-forest/50">
            Elige un día para ver pagados y pendientes
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-forest/15 bg-white p-1 shadow-sm">
          <button
            type="button"
            className="rounded-full p-2 text-forest hover:bg-forest/5"
            onClick={() => goMonth(subMonths(month, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest/5"
            onClick={() => {
              goMonth(now);
              setSelectedDay(now);
            }}
          >
            Hoy
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-forest hover:bg-forest/5"
            onClick={() => goMonth(addMonths(month, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Calendario grande */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-forest/10 bg-cream/40">
              {weekdays.map((d) => (
                <div
                  key={d}
                  className="px-1 py-3 text-center text-xs font-semibold uppercase tracking-wide text-forest/45"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const stats = byDay.get(dayKey(day))!;
                const inMonth = isSameMonth(day, month);
                const active = selectedDay && isSameDay(day, selectedDay);
                const isToday = isSameDay(day, now);
                const hasPending = stats.nPendiente > 0;
                const hasPaid = stats.nPagado > 0;
                const row = Math.floor(idx / 7);
                const col = idx % 7;
                const totalRows = Math.ceil(calendarDays.length / 7);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "relative flex min-h-[5.75rem] flex-col items-stretch gap-1 p-2 text-left transition sm:min-h-[6.75rem] sm:p-2.5 md:min-h-[7.5rem]",
                      col < 6 && "border-r border-forest/10",
                      row < totalRows - 1 && "border-b border-forest/10",
                      !inMonth && "bg-cream/30 text-forest/30",
                      inMonth && "bg-white hover:bg-cream/50",
                      active && "z-[1] bg-forest/10 ring-2 ring-inset ring-forest"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                          isToday && !active && "bg-forest text-cream",
                          active && "bg-forest text-cream",
                          !isToday && !active && inMonth && "text-forest",
                          !inMonth && "text-forest/30"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {(hasPaid || hasPending) && inMonth && (
                        <span className="mt-1 flex gap-0.5">
                          {hasPaid && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" title="Pagado" />
                          )}
                          {hasPending && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Pendiente" />
                          )}
                        </span>
                      )}
                    </div>

                    {inMonth && (hasPaid || hasPending) && (
                      <div className="mt-auto space-y-0.5">
                        {hasPaid && (
                          <p className="truncate text-[11px] font-medium tabular-nums text-emerald-700 sm:text-xs">
                            {formatMoneyShort(stats.pagado)}
                          </p>
                        )}
                        {hasPending && (
                          <p className="truncate text-[11px] font-medium tabular-nums text-amber-800 sm:text-xs">
                            {formatMoneyShort(stats.pendiente)}
                            <span className="text-amber-700/70"> pend.</span>
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-forest/50">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> Pagado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] text-cream">
                {format(now, "d")}
              </span>
              Hoy
            </span>
          </div>

          {/* Detalle del día debajo del calendario en pantallas grandes */}
          {selectedDay && (
            <div className="mt-5 rounded-2xl border border-forest/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-xl capitalize text-forest sm:text-2xl">
                    {format(selectedDay, "EEEE d MMMM", { locale: es })}
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      <Check className="h-3.5 w-3.5" />
                      Pagado {formatMoney(selectedStats?.pagado || 0)}
                      {selectedStats?.nPagado ? ` · ${selectedStats.nPagado}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                      <Clock className="h-3.5 w-3.5" />
                      Pendiente {formatMoney(selectedStats?.pendiente || 0)}
                      {selectedStats?.nPendiente ? ` · ${selectedStats.nPendiente}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onAddForDay({
                        fecha: dayKey(selectedDay),
                        tipo: "ingreso",
                        estado: "completado",
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Ingreso
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      onAddForDay({
                        fecha: dayKey(selectedDay),
                        tipo: "gasto",
                        estado: "pendiente",
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Gasto
                  </Button>
                </div>
              </div>

              {(selectedStats?.items || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-forest/15 py-10 text-center text-sm text-forest/40">
                  Sin movimientos este día · agrega un gasto o ingreso
                </p>
              ) : (
                <div className="space-y-4">
                  {[
                    { title: "Pendientes", items: selectedPendientes },
                    { title: "Pagados", items: selectedPagados },
                    { title: "Otros", items: selectedOtros },
                  ]
                    .filter((g) => g.items.length > 0)
                    .map((group) => (
                      <div key={group.title}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-forest/40">
                          {group.title} ({group.items.length})
                        </p>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <ItemRow key={item.id_item} item={item} onEdit={onEditItem} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar métricas */}
        <aside className="min-w-0 space-y-3 xl:sticky xl:top-2 xl:self-start">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-forest/10 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Ingreso del mes</p>
              <p className="mt-1 font-display text-xl text-forest tabular-nums">
                {formatMoney(Math.max(monthStats.ingresos, auditoria?.ingreso_total || 0))}
              </p>
              {monthStats.ingresoObjetivo > 0 && (
                <p className="mt-1 text-[11px] text-forest/45">
                  Meta {formatMoney(monthStats.ingresoObjetivo)}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Pagado</p>
              <p className="mt-1 font-display text-xl text-emerald-800 tabular-nums">
                {formatMoney(auditoria?.pagado ?? monthStats.gastos)}
              </p>
              <p className="mt-1 text-[11px] text-forest/45">{monthStats.nPagado} ítems</p>
            </div>
            <div className="rounded-2xl border border-amber/30 bg-amber/10 p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Falta por pagar</p>
              <p className="mt-1 font-display text-xl text-amber-900 tabular-nums">
                {formatMoney(auditoria?.pendiente ?? monthStats.gastosPendientes)}
              </p>
              <p className="mt-1 text-[11px] text-forest/45">{monthStats.nPendiente} pendientes</p>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Disponible</p>
              <p className="mt-1 font-display text-xl text-forest tabular-nums">
                {formatMoney(auditoria?.disponible ?? monthStats.ingresos - monthStats.gastos)}
              </p>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Cuotas</p>
              <p className="mt-1 font-display text-lg text-forest">
                {monthStats.cuotasPag} / {monthStats.cuotasPend}
              </p>
              <p className="mt-1 text-[11px] text-forest/45">pagadas / pendientes</p>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-medium text-forest/50">Ahorro</p>
              <p className="mt-1 font-display text-xl text-forest tabular-nums">
                {formatMoney(monthStats.ahorro)}
              </p>
            </div>
          </div>

          {monthStats.pendientes.length > 0 && (
            <div className="rounded-2xl border border-amber/25 bg-white p-3.5 shadow-sm">
              <h4 className="font-display text-base text-forest">Pendientes del mes</h4>
              <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                {monthStats.pendientes.map((item) => (
                  <button
                    key={item.id_item}
                    type="button"
                    onClick={() => {
                      if (item.fecha) {
                        const d = parseISO(String(item.fecha).slice(0, 10));
                        if (!isSameMonth(d, month)) goMonth(d);
                        setSelectedDay(d);
                      }
                      onEditItem?.(item);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-amber/15 bg-amber/5 px-2.5 py-2 text-left hover:border-amber/35"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-forest">{item.titulo}</p>
                      <p className="text-[10px] text-forest/45">
                        {item.fecha
                          ? format(parseISO(String(item.fecha).slice(0, 10)), "d MMM", {
                              locale: es,
                            })
                          : "—"}
                        {" · "}
                        {estadoLabel(item.estado)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-amber-900">
                      {formatMoneyShort(Number(item.monto_total))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {monthStats.pagados.length > 0 && (
            <div className="rounded-2xl border border-emerald-200/70 bg-white p-3.5 shadow-sm">
              <h4 className="font-display text-base text-forest">Pagados del mes</h4>
              <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-0.5">
                {monthStats.pagados.map((item) => (
                  <button
                    key={item.id_item}
                    type="button"
                    onClick={() => {
                      if (item.fecha) {
                        const d = parseISO(String(item.fecha).slice(0, 10));
                        if (!isSameMonth(d, month)) goMonth(d);
                        setSelectedDay(d);
                      }
                      onEditItem?.(item);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-2.5 py-2 text-left hover:border-emerald-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-forest">{item.titulo}</p>
                      <p className="text-[10px] text-forest/45">
                        {item.fecha
                          ? format(parseISO(String(item.fecha).slice(0, 10)), "d MMM", {
                              locale: es,
                            })
                          : "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-800">
                      {formatMoneyShort(Number(item.monto_total))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-forest/10 bg-white p-3.5 shadow-sm">
            <h4 className="font-display text-base text-forest">Metas del mes</h4>
            <div className="mt-2 space-y-2">
              {metas.length === 0 && (
                <p className="text-[11px] text-forest/40">Aún no hay metas este mes</p>
              )}
              {metas.map((m) => (
                <div
                  key={m.id_meta_mes}
                  className="rounded-xl border border-forest/10 bg-cream/40 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-forest">{m.titulo}</p>
                      <p className="text-[10px] text-forest/45">{m.tipo.replace("_", " ")}</p>
                    </div>
                    <button
                      type="button"
                      className="text-forest/35 hover:text-red-600"
                      onClick={() => removeMeta(m.id_meta_mes)}
                      aria-label="Eliminar meta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest/10">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${Math.min(100, m.progreso_pct || 0)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-forest/50">
                    {formatMoney(Number(m.avance || 0))} / {formatMoney(Number(m.monto_objetivo))} ·{" "}
                    {m.progreso_pct || 0}%
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={createMeta} className="mt-3 space-y-2 border-t border-forest/10 pt-3">
              <p className="text-[11px] font-medium text-forest/70">Nueva meta</p>
              <select
                className="h-9 w-full rounded-lg border border-forest/15 bg-white px-2 text-xs"
                value={metaTipo}
                onChange={(e) => setMetaTipo(e.target.value as MetaMesTipo)}
              >
                <option value="ingreso">Meta de ingreso</option>
                <option value="ahorro">Meta de ahorro</option>
                <option value="pagar_deuda">Pagar deuda</option>
                <option value="pagar_cuota">Pagar cuota</option>
              </select>
              <Input
                className="h-9 text-xs"
                placeholder="Título (ej. Ahorro para viaje)"
                value={metaTitulo}
                onChange={(e) => setMetaTitulo(e.target.value)}
                required
              />
              <Input
                className="h-9 text-xs"
                inputMode="numeric"
                placeholder="Monto objetivo"
                value={metaMonto}
                onChange={(e) => setMetaMonto(e.target.value)}
                required
              />
              {(metaTipo === "pagar_deuda" || metaTipo === "pagar_cuota") && (
                <select
                  className="h-9 w-full rounded-lg border border-forest/15 bg-white px-2 text-xs"
                  value={metaItemId}
                  onChange={(e) => setMetaItemId(e.target.value)}
                  required
                >
                  <option value="">Vincular a…</option>
                  {deudasPadre.map((d) => (
                    <option key={d.id_item} value={d.id_item}>
                      {d.titulo} · resta{" "}
                      {formatMoney(Number(d.monto_total) - Number(d.monto_pagado))}
                    </option>
                  ))}
                  {items
                    .filter(
                      (i) =>
                        i.id_item_padre &&
                        ["pendiente", "programado", "en_proceso"].includes(i.estado)
                    )
                    .map((c) => (
                      <option key={c.id_item} value={c.id_item}>
                        {c.titulo} · {formatMoney(Number(c.monto_total))}
                      </option>
                    ))}
                </select>
              )}
              <Button type="submit" size="sm" className="w-full">
                Guardar meta
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
