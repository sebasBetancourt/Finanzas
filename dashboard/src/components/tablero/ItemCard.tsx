import { TIPOS, type ItemFinanciero, type ItemTipo } from "@/interfaces/item";
import { formatMoney, cn } from "@/lib/utils";
import { GripVertical, Link2, Pencil, Trash2, Repeat } from "lucide-react";

function tipoMeta(tipo: ItemTipo) {
  return TIPOS.find((t) => t.id === tipo) || TIPOS[1];
}

export function ItemCard({
  item,
  deudas,
  onEstadoChange,
  onAbono,
  onVincular,
  onEdit,
  onDelete,
  onToggleRecurrente,
  draggable,
  compact,
}: {
  item: ItemFinanciero;
  deudas?: ItemFinanciero[];
  onEstadoChange?: (estado: string) => void;
  onAbono?: () => void;
  onVincular?: (idPadre: number | null) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleRecurrente?: () => void;
  draggable?: boolean;
  compact?: boolean;
}) {
  const tipo = tipoMeta(item.tipo);
  const total = Number(item.monto_total);
  const pagado = Number(item.monto_pagado);
  const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0;
  const showProgress = item.tipo === "deuda" || item.tipo === "ahorro";
  const isCuota = Boolean(item.id_item_padre);
  const canLink =
    onVincular &&
    deudas &&
    !showProgress &&
    item.tipo !== "ingreso" &&
    !(item.tipo === "deuda" && !item.id_item_padre);
  const hasPlan = Boolean(item.cuota_mensual && item.n_cuotas);
  const cuotasPagadas = Number(item.cuotas_pagadas || 0);
  const nCuotas = Number(item.n_cuotas || 0);
  const recurrente = Boolean(item.es_recurrente);

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/item-id", String(item.id_item));
        e.dataTransfer.setData("text/estado", item.estado);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      className={cn(
        "rounded-xl border border-forest/10 bg-white/90 p-3 shadow-sm transition hover:border-forest/25",
        isCuota && "border-l-4 border-l-violet-500",
        recurrente && "ring-1 ring-amber/40",
        draggable && "cursor-grab active:cursor-grabbing",
        compact && "p-2.5"
      )}
    >
      <div className="flex items-start gap-1">
        {draggable && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-forest/25" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-forest leading-snug">{item.titulo}</h4>
            <div className="flex shrink-0 items-center gap-0.5">
              {recurrente && (
                <span title="Gasto recurrente" className="rounded p-0.5 text-amber">
                  <Repeat className="h-3.5 w-3.5" />
                </span>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ background: tipo.color }}
              >
                {tipo.label}
              </span>
            </div>
          </div>

          {isCuota && item.padre_titulo && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-violet-700">
              <Link2 className="h-3 w-3" />
              Pago de <span className="font-medium">{item.padre_titulo}</span>
            </p>
          )}

          <p className="mt-2 font-display text-lg text-forest">
            {showProgress ? formatMoney(Math.max(0, total - pagado)) : formatMoney(total)}
          </p>
          {showProgress && (
            <p className="text-[10px] text-forest/40">restante · total {formatMoney(total)}</p>
          )}

          {showProgress && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-forest/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? "#1a6b55" : "#7c3aed",
                  }}
                />
              </div>
              <p className="text-[11px] text-forest/50">
                Pagado {formatMoney(pagado)} · {pct}%
                {hasPlan && ` · ${cuotasPagadas}/${nCuotas} cuotas`}
              </p>
              {hasPlan && (
                <p className="text-[10px] text-forest/40">
                  Cuota mensual {formatMoney(Number(item.cuota_mensual))}
                  {item.cuota_inicial ? ` · inicial ${formatMoney(Number(item.cuota_inicial))}` : ""}
                </p>
              )}
            </div>
          )}

          {item.fecha && (
            <p className="mt-1.5 text-[11px] text-forest/40">{String(item.fecha).slice(0, 10)}</p>
          )}

          {canLink && (
            <div className="mt-2" onPointerDown={(e) => e.stopPropagation()}>
              <label className="mb-0.5 block text-[10px] text-forest/40">Vincular a deuda</label>
              <select
                className="h-7 w-full rounded-md border border-violet-200 bg-violet-50/50 px-2 text-[11px] text-forest"
                value={item.id_item_padre || ""}
                onChange={(e) =>
                  onVincular(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Sin vincular</option>
                {deudas.map((d) => (
                  <option key={d.id_item} value={d.id_item}>
                    {d.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            className="mt-2.5 flex flex-wrap items-center gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onEstadoChange && (
              <select
                className="h-7 flex-1 rounded-md border border-forest/15 bg-cream/50 px-2 text-[11px] text-forest"
                value={item.estado}
                onChange={(e) => onEstadoChange(e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="programado">Programado</option>
                <option value="en_proceso">Deudas en proceso</option>
                <option value="ahorro">Ahorro</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            )}
            {onAbono && showProgress && pct < 100 && (
              <button
                type="button"
                onClick={onAbono}
                className="h-7 rounded-md bg-forest px-2.5 text-[11px] font-medium text-cream hover:bg-forest/90"
              >
                Abonar
              </button>
            )}
          </div>

          <div
            className="mt-2 flex flex-wrap gap-1 border-t border-forest/5 pt-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onToggleRecurrente &&
              !(item.tipo === "deuda" && !item.id_item_padre && item.estado === "en_proceso") && (
              <button
                type="button"
                onClick={onToggleRecurrente}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium",
                  recurrente
                    ? "bg-amber/20 text-forest"
                    : "border border-forest/15 text-forest/60 hover:bg-forest/5"
                )}
                title="Se copia a Pendiente al traer recurrentes el próximo mes"
              >
                <Repeat className="h-3 w-3" />
                {recurrente ? "Recurrente" : "Marcar recurrente"}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-forest/15 px-2 text-[10px] text-forest/70 hover:bg-forest/5"
              >
                <Pencil className="h-3 w-3" /> Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 px-2 text-[10px] text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
