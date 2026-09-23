import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addItemAbono,
  copiarMes,
  createDeudaPlan,
  createItem,
  deleteItem,
  getAuditoriaMes,
  getItemsResumen,
  listItems,
  setPresupuestoMes,
  updateItem,
} from "@/services/api";
import type { ItemFinanciero, ItemsResumen, ItemEstado } from "@/interfaces/item";
import { ESTADOS, TIPOS } from "@/interfaces/item";
import { ItemCard } from "@/components/tablero/ItemCard";
import { ItemModal, type ItemFormValues } from "@/components/tablero/ItemModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";

type Vista = "tablero" | "calendario" | "categoria" | "deudas" | "ahorro";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "tablero", label: "Tablero" },
  { id: "calendario", label: "Calendario" },
  { id: "categoria", label: "Por categoría" },
  { id: "deudas", label: "Deudas" },
  { id: "ahorro", label: "Ahorro" },
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Auditoria = Awaited<ReturnType<typeof getAuditoriaMes>>;

export default function TableroPage() {
  const now = new Date();
  const [vista, setVista] = useState<Vista>("tablero");
  const [verTodos, setVerTodos] = useState(false);
  const [boardMonth, setBoardMonth] = useState(now);
  const [items, setItems] = useState<ItemFinanciero[]>([]);
  const [resumen, setResumen] = useState<ItemsResumen | null>(null);
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalDefaults, setModalDefaults] = useState<Partial<ItemFormValues>>({});
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(now);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editIngreso, setEditIngreso] = useState("");

  const mesKey = format(boardMonth, "yyyy-MM");
  const anio = boardMonth.getFullYear();
  const mesNum = boardMonth.getMonth() + 1;

  const load = useCallback(async () => {
    try {
      const params = verTodos ? { todos: true as const } : { mes: mesKey };
      const [list, sum] = await Promise.all([listItems(params), getItemsResumen()]);
      setItems(list || []);
      setResumen(sum);
      if (!verTodos) {
        const aud = await getAuditoriaMes(anio, mesNum);
        setAuditoria(aud);
        setEditIngreso(String(aud.ingreso_total || ""));
      } else {
        setAuditoria(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar tablero");
    } finally {
      setLoading(false);
    }
  }, [verTodos, mesKey, anio, mesNum]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const deudasPadre = useMemo(
    () =>
      items.filter(
        (i) =>
          i.tipo === "deuda" &&
          !i.id_item_padre &&
          i.estado === "en_proceso"
      ),
    [items]
  );

  const openNuevo = (defaults?: Partial<ItemFormValues>) => {
    const fechaDefault = verTodos
      ? new Date().toISOString().slice(0, 10)
      : format(startOfMonth(boardMonth), "yyyy-MM-dd");
    setModalMode("create");
    setEditingId(null);
    setModalDefaults({ fecha: fechaDefault, ...defaults });
    setModalOpen(true);
  };

  const openEdit = (item: ItemFinanciero) => {
    setModalMode("edit");
    setEditingId(item.id_item);
    const hasPlan =
      item.tipo === "deuda" &&
      !item.id_item_padre &&
      (Boolean(item.cuota_mensual) || item.estado === "en_proceso");
    setModalDefaults({
      titulo: item.titulo,
      tipo: item.tipo,
      monto_total: Number(item.monto_total),
      monto_pagado: Number(item.monto_pagado),
      estado: item.estado,
      fecha: item.fecha ? String(item.fecha).slice(0, 10) : null,
      fecha_inicio: item.fecha_inicio
        ? String(item.fecha_inicio).slice(0, 10)
        : item.fecha
          ? String(item.fecha).slice(0, 10)
          : null,
      notas: item.notas || "",
      es_recurrente: Boolean(item.es_recurrente),
      cuota_mensual: item.cuota_mensual != null ? Number(item.cuota_mensual) : undefined,
      n_cuotas: item.n_cuotas != null ? Number(item.n_cuotas) : undefined,
      cuota_inicial: item.cuota_inicial != null ? Number(item.cuota_inicial) : undefined,
      cuotas_pagadas: item.cuotas_pagadas != null ? Number(item.cuotas_pagadas) : undefined,
      dia_cobro: item.dia_cobro != null ? Number(item.dia_cobro) : 1,
      es_plan_deuda: hasPlan,
    });
    setModalOpen(true);
  };

  const handleCreate = async (values: ItemFormValues) => {
    if (modalMode === "edit" && editingId) {
      if (values.es_plan_deuda) {
        await updateItem(editingId, {
          titulo: values.titulo,
          tipo: "deuda",
          monto_total: values.monto_total,
          monto_pagado: values.monto_pagado,
          estado: values.estado,
          fecha: values.fecha,
          fecha_inicio: values.fecha_inicio || values.fecha,
          notas: values.notas,
          cuota_mensual: values.cuota_mensual,
          n_cuotas: values.n_cuotas,
          cuota_inicial: values.cuota_inicial,
          cuotas_pagadas: values.cuotas_pagadas,
          dia_cobro: values.dia_cobro,
        });
      } else {
        await updateItem(editingId, {
          titulo: values.titulo,
          tipo: values.tipo,
          monto_total: values.monto_total,
          monto_pagado: values.monto_pagado,
          estado: values.estado,
          fecha: values.fecha,
          fecha_inicio: values.fecha_inicio || values.fecha,
          notas: values.notas,
          es_recurrente: values.es_recurrente,
        });
      }
      toast.success("Ítem actualizado");
      await load();
      return;
    }
    if (values.es_plan_deuda) {
      await createDeudaPlan({
        titulo: values.titulo,
        cuota_mensual: values.cuota_mensual!,
        n_cuotas: values.n_cuotas!,
        cuota_inicial: values.cuota_inicial,
        cuotas_pagadas: values.cuotas_pagadas,
        monto_pagado: values.monto_pagado,
        dia_cobro: values.dia_cobro,
        fecha_inicio: values.fecha_inicio || values.fecha || undefined,
        notas: values.notas,
      });
      toast.success("Deuda creada · cuota del mes en Pendiente");
    } else {
      await createItem({
        ...values,
        fecha: values.fecha || format(startOfMonth(boardMonth), "yyyy-MM-dd"),
        fecha_inicio:
          values.fecha_inicio ||
          values.fecha ||
          format(startOfMonth(boardMonth), "yyyy-MM-dd"),
      });
      toast.success("Ítem creado");
    }
    await load();
  };

  const handleDelete = async (item: ItemFinanciero) => {
    if (!confirm(`¿Eliminar "${item.titulo}"?`)) return;
    try {
      await deleteItem(item.id_item);
      toast.success("Eliminado");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleRecurrente = async (item: ItemFinanciero) => {
    try {
      await updateItem(item.id_item, { es_recurrente: !item.es_recurrente });
      toast.success(
        item.es_recurrente ? "Ya no es recurrente" : "Marcado como gasto recurrente"
      );
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDropOnColumn = async (estado: ItemEstado, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = Number(e.dataTransfer.getData("text/item-id"));
    const from = e.dataTransfer.getData("text/estado");
    if (!id || from === estado) return;
    try {
      await updateItem(id, { estado });
      const item = items.find((i) => i.id_item === id);
      if (estado === "completado" && item?.id_item_padre) {
        toast.success(`Abonado ${formatMoney(Number(item.monto_total))} a la deuda`);
      }
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEstado = async (id: number, estado: string) => {
    try {
      const item = items.find((i) => i.id_item === id);
      await updateItem(id, { estado });
      if (estado === "completado" && item?.id_item_padre) {
        toast.success(`Abonado ${formatMoney(Number(item.monto_total))} a la deuda`);
      }
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVincular = async (id: number, idPadre: number | null) => {
    try {
      await updateItem(id, { id_item_padre: idPadre });
      toast.success(idPadre ? "Vinculado a la deuda" : "Desvinculado");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAbono = async (item: ItemFinanciero) => {
    const raw = prompt(`Abono para "${item.titulo}" (COP)`);
    if (!raw) return;
    const monto = Number(raw);
    if (!monto || monto <= 0) {
      toast.error("Monto inválido");
      return;
    }
    try {
      await addItemAbono(item.id_item, monto);
      toast.success("Abono registrado");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveIngreso = async () => {
    const val = Number(editIngreso);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Ingreso inválido");
      return;
    }
    try {
      await setPresupuestoMes({ anio, mes: mesNum, ingreso_total: val });
      toast.success("Ingreso del mes actualizado");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCopiarMesAnterior = async () => {
    const prev = subMonths(boardMonth, 1);
    const desde = format(prev, "yyyy-MM");
    try {
      const created = await copiarMes(desde, mesKey);
      toast.success(
        created?.length
          ? `Se copiaron ${created.length} gastos recurrentes`
          : "No hay recurrentes por copiar (márcalos con el botón Recurrente)"
      );
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const byEstado = useMemo(() => {
    const map: Record<ItemEstado, ItemFinanciero[]> = {
      pendiente: [],
      programado: [],
      en_proceso: [],
      ahorro: [],
      completado: [],
      cancelado: [],
    };
    items.forEach((i) => {
      if (map[i.estado]) map[i.estado].push(i);
    });
    return map;
  }, [items]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 1, y, y + 1];
  }, [now]);

  const days = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const itemsForDay = (day: Date) =>
    items.filter((i) => i.fecha && isSameDay(parseISO(String(i.fecha).slice(0, 10)), day));

  const cardProps = (item: ItemFinanciero, opts?: { draggable?: boolean }) => ({
    item,
    deudas: deudasPadre,
    draggable: opts?.draggable,
    onEstadoChange: (e: string) => handleEstado(item.id_item, e),
    onAbono: () => handleAbono(item),
    onVincular: (idPadre: number | null) => handleVincular(item.id_item, idPadre),
    onEdit: () => openEdit(item),
    onDelete: () => handleDelete(item),
    onToggleRecurrente: () => handleToggleRecurrente(item),
  });

  if (loading) {
    return <p className="text-forest/50">Cargando tablero…</p>;
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-3 md:h-[calc(100vh-5rem)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-forest md:text-3xl">Finanzas Personales</h1>
          <p className="mt-0.5 text-sm text-forest/50">
            {verTodos
              ? "Vista de todos los meses · las deudas siguen en el pipeline"
              : `Tablero de ${format(boardMonth, "MMMM yyyy", { locale: es })} · deudas siempre visibles`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!verTodos && (
            <Button variant="outline" size="sm" onClick={handleCopiarMesAnterior} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Traer recurrentes
            </Button>
          )}
          <Button onClick={() => openNuevo()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </div>
      </header>

      {/* Selector mes / año */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-forest/10 bg-white/70 px-3 py-2">
        <button
          type="button"
          onClick={() => setVerTodos(true)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm",
            verTodos ? "bg-forest text-cream" : "text-forest/60 hover:bg-forest/5"
          )}
        >
          Todos los meses
        </button>
        <span className="text-forest/20">|</span>
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-forest/5 disabled:opacity-30"
          disabled={verTodos}
          onClick={() => setBoardMonth(subMonths(boardMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <select
          className="h-9 rounded-lg border border-forest/15 bg-cream/50 px-2 text-sm capitalize disabled:opacity-40"
          disabled={verTodos}
          value={boardMonth.getMonth()}
          onChange={(e) => {
            setVerTodos(false);
            setBoardMonth(new Date(boardMonth.getFullYear(), Number(e.target.value), 1));
          }}
        >
          {MESES.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-forest/15 bg-cream/50 px-2 text-sm disabled:opacity-40"
          disabled={verTodos}
          value={boardMonth.getFullYear()}
          onChange={(e) => {
            setVerTodos(false);
            setBoardMonth(new Date(Number(e.target.value), boardMonth.getMonth(), 1));
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-forest/5 disabled:opacity-30"
          disabled={verTodos}
          onClick={() => setBoardMonth(addMonths(boardMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setVerTodos(false);
            setBoardMonth(new Date());
          }}
          className={cn(
            "ml-auto rounded-lg px-3 py-1.5 text-sm",
            !verTodos && isSameMonth(boardMonth, now)
              ? "bg-amber/30 text-forest font-medium"
              : "text-forest/50 hover:bg-forest/5"
          )}
        >
          Mes actual
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-forest/10 pb-px">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            className={cn(
              "shrink-0 rounded-t-lg px-3 py-2 text-sm transition-colors",
              vista === v.id
                ? "bg-white font-medium text-forest shadow-sm"
                : "text-forest/50 hover:text-forest"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Auditoría del mes + ingreso */}
      {!verTodos && auditoria && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 rounded-xl border border-forest/15 bg-white/80 px-3 py-2.5 sm:col-span-1 lg:col-span-2">
            <p className="text-[11px] text-forest/50">Ingreso total del mes</p>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                min={0}
                value={editIngreso}
                onChange={(e) => setEditIngreso(e.target.value)}
                className="h-9 border-forest/15 bg-cream/40 font-display text-base"
              />
              <Button size="sm" className="h-9 shrink-0" onClick={handleSaveIngreso}>
                Guardar
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-forest/40">
              Disponible tras pagos: {formatMoney(auditoria.disponible)}
            </p>
          </div>
          <StatChip label="Pagado este mes" value={formatMoney(auditoria.pagado)} />
          <StatChip label="Falta por pagar" value={formatMoney(auditoria.pendiente)} accent />
          <StatChip label="Deuda restante" value={formatMoney(resumen?.deuda_restante || 0)} />
          <StatChip
            label="Ítems"
            value={`${auditoria.n_pagados} ✓ / ${auditoria.n_pendientes} pendientes`}
          />
        </div>
      )}

      {verTodos && resumen && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip label="Gastos del mes actual" value={formatMoney(resumen.gastos_mes)} />
          <StatChip label="Ingresos del mes actual" value={formatMoney(resumen.ingresos_mes)} />
          <StatChip label="Deuda restante" value={formatMoney(resumen.deuda_restante)} accent />
          <StatChip label="Deudas pagadas" value={`${resumen.deuda_pct}%`} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {vista === "tablero" && (
          <div className="flex h-full gap-3 overflow-x-auto pb-4">
            {ESTADOS.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => handleDropOnColumn(col.id, e)}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border bg-white/50 transition",
                  dragOverCol === col.id
                    ? "border-forest border-2 bg-forest/5"
                    : "border-forest/10"
                )}
              >
                <div className="flex items-center gap-2 border-b border-forest/5 px-3 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-medium text-forest">{col.label}</span>
                  <span className="ml-auto text-xs text-forest/40">{byEstado[col.id].length}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  {byEstado[col.id].map((item) => (
                    <ItemCard key={item.id_item} {...cardProps(item, { draggable: true })} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => openNuevo({ estado: col.id })}
                  className="m-2 rounded-lg border border-dashed border-forest/20 py-2 text-xs text-forest/50 hover:border-forest/40 hover:text-forest"
                >
                  + Nuevo ítem
                </button>
              </div>
            ))}
          </div>
        )}

        {vista === "calendario" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-forest/15 p-1.5 hover:bg-white"
                onClick={() => setCalMonth(subMonths(calMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="font-display text-lg capitalize text-forest">
                {format(calMonth, "MMMM yyyy", { locale: es })}
              </h3>
              <button
                type="button"
                className="rounded-lg border border-forest/15 p-1.5 hover:bg-white"
                onClick={() => setCalMonth(addMonths(calMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-forest/40">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const dayItems = itemsForDay(day);
                const active = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[4.5rem] rounded-lg border p-1.5 text-left transition",
                      active ? "border-forest bg-forest/5" : "border-forest/10 bg-white/70 hover:border-forest/25",
                      !isSameMonth(day, calMonth) && "opacity-40"
                    )}
                  >
                    <span className="text-xs font-medium text-forest">{format(day, "d")}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 3).map((i) => (
                        <div
                          key={i.id_item}
                          className="truncate rounded px-1 text-[9px] text-white"
                          style={{ background: TIPOS.find((t) => t.id === i.tipo)?.color || "#0c4136" }}
                        >
                          {i.titulo}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedDay && (
              <div className="rounded-xl border border-forest/10 bg-white/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-display text-forest">
                    {format(selectedDay, "d MMMM yyyy", { locale: es })}
                  </h4>
                  <Button size="sm" onClick={() => openNuevo({ fecha: format(selectedDay, "yyyy-MM-dd") })}>
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {itemsForDay(selectedDay).map((item) => (
                    <ItemCard key={item.id_item} {...cardProps(item)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {vista === "categoria" && (
          <div className="space-y-6">
            {TIPOS.map((tipo) => {
              const group = items.filter((i) => i.tipo === tipo.id);
              if (!group.length) return null;
              const sum = group.reduce((a, i) => a + Number(i.monto_total), 0);
              return (
                <section key={tipo.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: tipo.color }} />
                    <h3 className="font-display text-lg text-forest">{tipo.label}</h3>
                    <span className="ml-auto text-sm text-forest/50">{formatMoney(sum)}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.map((item) => (
                      <ItemCard key={item.id_item} {...cardProps(item)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {vista === "deudas" && (
          <DeudasView
            items={deudasPadre}
            resumen={resumen}
            onEstado={handleEstado}
            onAbono={handleAbono}
            onNuevo={() => openNuevo({ tipo: "deuda", estado: "en_proceso", es_plan_deuda: true })}
          />
        )}

        {vista === "ahorro" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openNuevo({ tipo: "ahorro" })}>
                <Plus className="h-3.5 w-3.5" /> Meta de ahorro
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .filter((i) => i.tipo === "ahorro")
                .map((item) => (
                  <ItemCard key={item.id_item} {...cardProps(item)} />
                ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <ItemModal
          key={`${modalMode}-${editingId}-${JSON.stringify(modalDefaults)}`}
          open={modalOpen}
          mode={modalMode}
          defaults={modalDefaults}
          onClose={() => {
            setModalOpen(false);
            setEditingId(null);
          }}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        accent ? "border-amber/40 bg-amber/10" : "border-forest/10 bg-white/70"
      )}
    >
      <p className="text-[11px] text-forest/50">{label}</p>
      <p className="font-display text-lg text-forest leading-tight">{value}</p>
    </div>
  );
}

function DeudasView({
  items,
  resumen,
  onEstado,
  onAbono,
  onNuevo,
}: {
  items: ItemFinanciero[];
  resumen: ItemsResumen | null;
  onEstado: (id: number, estado: string) => void;
  onAbono: (item: ItemFinanciero) => void;
  onNuevo: () => void;
}) {
  return (
    <div className="space-y-4">
      {resumen && (
        <div className="sticky top-0 z-10 grid grid-cols-2 gap-2 rounded-xl border border-forest/10 bg-cream/95 p-3 backdrop-blur sm:grid-cols-4">
          <StatChip label="Total deudas" value={formatMoney(resumen.deuda_total)} />
          <StatChip label="Pagado" value={formatMoney(resumen.deuda_pagada)} />
          <StatChip label="Restante" value={formatMoney(resumen.deuda_restante)} accent />
          <StatChip label="Avance" value={`${resumen.deuda_pct}%`} />
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" onClick={onNuevo}>
          <Plus className="h-3.5 w-3.5" /> Nueva deuda
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard
            key={item.id_item}
            item={item}
            onEstadoChange={(e) => onEstado(item.id_item, e)}
            onAbono={() => onAbono(item)}
          />
        ))}
      </div>
    </div>
  );
}
