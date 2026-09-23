import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADOS, TIPOS, type ItemEstado, type ItemTipo } from "@/interfaces/item";
import { formatMoney, parseMoneyInput } from "@/lib/utils";

export interface ItemFormValues {
  titulo: string;
  tipo: ItemTipo;
  monto_total: number;
  monto_pagado?: number;
  estado: ItemEstado;
  fecha?: string | null;
  /** Desde qué mes inicia (acumulación / recurrencia). Por defecto = fecha. */
  fecha_inicio?: string | null;
  notas?: string;
  es_recurrente?: boolean;
  es_plan_deuda?: boolean;
  cuota_mensual?: number;
  n_cuotas?: number;
  cuota_inicial?: number;
  cuotas_pagadas?: number;
  dia_cobro?: number;
}

export function ItemModal({
  open,
  onClose,
  onSubmit,
  defaults,
  mode = "create",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  defaults?: Partial<ItemFormValues>;
  mode?: "create" | "edit";
}) {
  const isEdit = mode === "edit";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    titulo: defaults?.titulo || "",
    tipo: (defaults?.tipo || "gasto") as ItemTipo,
    monto_total: defaults?.monto_total != null ? String(defaults.monto_total) : "",
    monto_pagado: defaults?.monto_pagado != null ? String(defaults.monto_pagado) : "0",
    estado: (defaults?.estado || "pendiente") as ItemEstado,
    fecha: defaults?.fecha
      ? String(defaults.fecha).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    fecha_inicio: defaults?.fecha_inicio
      ? String(defaults.fecha_inicio).slice(0, 10)
      : defaults?.fecha
        ? String(defaults.fecha).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    notas: defaults?.notas || "",
    es_recurrente: defaults?.es_recurrente || false,
    es_plan_deuda:
      defaults?.es_plan_deuda ||
      Boolean(defaults?.cuota_mensual) ||
      (!isEdit && defaults?.tipo === "deuda") ||
      false,
    cuota_mensual: defaults?.cuota_mensual != null ? String(defaults.cuota_mensual) : "",
    n_cuotas: defaults?.n_cuotas != null ? String(defaults.n_cuotas) : "24",
    cuota_inicial: defaults?.cuota_inicial != null ? String(defaults.cuota_inicial) : "0",
    cuotas_pagadas: defaults?.cuotas_pagadas != null ? String(defaults.cuotas_pagadas) : "0",
    dia_cobro: defaults?.dia_cobro != null ? String(defaults.dia_cobro) : "1",
  });

  if (!open) return null;

  // Crear o editar deuda con plan de cuotas
  const isPlan = form.tipo === "deuda" && form.es_plan_deuda;

  const cuotaMensual = parseMoneyInput(form.cuota_mensual);
  const nCuotas = Math.max(0, Math.floor(parseMoneyInput(form.n_cuotas) || Number(form.n_cuotas) || 0));
  const cuotaInicial = parseMoneyInput(form.cuota_inicial);
  const cuotasPagadasRaw = Math.floor(Number(String(form.cuotas_pagadas).replace(/[^\d]/g, "")) || 0);
  const cuotasPagadas = Math.min(Math.max(0, cuotasPagadasRaw), nCuotas || 999);
  const montoPagadoManual = parseMoneyInput(form.monto_pagado);

  const previewTotal = isPlan && cuotaMensual && nCuotas ? cuotaInicial + cuotaMensual * nCuotas : null;
  const previewPagado =
    isPlan && previewTotal != null
      ? Math.min(
          previewTotal,
          montoPagadoManual > 0
            ? montoPagadoManual
            : cuotaInicial + cuotaMensual * cuotasPagadas
        )
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isPlan) {
        if (!cuotaMensual || !nCuotas) {
          setError("Cuota mensual y número de cuotas son obligatorios");
          return;
        }
        if (cuotasPagadasRaw > nCuotas) {
          setError(`Cuotas pagadas no puede ser mayor que ${nCuotas} (es cantidad, no pesos)`);
          return;
        }
        await onSubmit({
          titulo: form.titulo,
          tipo: "deuda",
          monto_total: previewTotal || 0,
          monto_pagado: previewPagado || 0,
          estado: form.estado === "completado" || form.estado === "cancelado" ? form.estado : "en_proceso",
          fecha: form.fecha || null,
          fecha_inicio: form.fecha_inicio || form.fecha || null,
          es_plan_deuda: true,
          cuota_mensual: cuotaMensual,
          n_cuotas: nCuotas,
          cuota_inicial: cuotaInicial,
          cuotas_pagadas: cuotasPagadas,
          dia_cobro: Math.min(28, Math.max(1, Number(form.dia_cobro) || 1)),
          notas: form.notas || undefined,
        });
      } else {
        const monto = parseMoneyInput(form.monto_total);
        if (!monto && form.tipo !== "ahorro") {
          setError("Escribe un monto válido (ej: 126.448 o 126448)");
          return;
        }
        await onSubmit({
          titulo: form.titulo,
          tipo: form.tipo,
          monto_total: monto,
          monto_pagado: parseMoneyInput(form.monto_pagado) || 0,
          estado: form.estado,
          fecha: form.fecha || null,
          fecha_inicio: form.fecha_inicio || form.fecha || null,
          notas: form.notas || undefined,
          es_recurrente: form.es_recurrente,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-forest/10 bg-cream p-6 shadow-xl">
        <h3 className="font-display text-xl text-forest">
          {isEdit ? "Editar ítem" : "Nuevo ítem"}
        </h3>
        <p className="mt-1 text-sm text-forest/50">
          {isEdit
            ? "Actualiza los datos de esta tarjeta"
            : isPlan
              ? isEdit
                ? "Edita cuota, número de cuotas y lo ya pagado"
                : "Deuda con cuotas: el total va a Deudas en proceso y la cuota del mes a Pendiente"
              : "Agrega un ingreso, gasto, deuda o ahorro"}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-forest/70">Título</label>
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej. Moto, Addi, Gimnasio"
              required
              className="h-11 border-forest/15 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-forest/70">Tipo</label>
              <select
                className="h-11 w-full rounded-md border border-forest/15 bg-white px-3 text-sm"
                value={form.tipo}
                onChange={(e) => {
                  const tipo = e.target.value as ItemTipo;
                  setForm({
                    ...form,
                    tipo,
                    es_plan_deuda: tipo === "deuda" ? true : form.es_plan_deuda,
                    estado: tipo === "deuda" ? "en_proceso" : form.estado,
                  });
                }}
              >
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {!isPlan && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-forest/70">Estado</label>
                <select
                  className="h-11 w-full rounded-md border border-forest/15 bg-white px-3 text-sm"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as ItemEstado })}
                >
                  {ESTADOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isPlan && isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-forest/70">Estado</label>
                <select
                  className="h-11 w-full rounded-md border border-forest/15 bg-white px-3 text-sm"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as ItemEstado })}
                >
                  <option value="en_proceso">Deudas en proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          {form.tipo === "deuda" && (
            <label className="flex items-center gap-2 rounded-lg border border-forest/10 bg-white/60 px-3 py-2 text-sm text-forest">
              <input
                type="checkbox"
                checked={form.es_plan_deuda}
                onChange={(e) => setForm({ ...form, es_plan_deuda: e.target.checked })}
              />
              Plan de cuotas mensuales (vinculadas)
            </label>
          )}

          {isPlan ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Cuota mensual (COP)</label>
                  <Input
                    inputMode="numeric"
                    placeholder="126.448"
                    value={form.cuota_mensual}
                    onChange={(e) => setForm({ ...form, cuota_mensual: e.target.value })}
                    required
                    className="h-11 border-forest/15 bg-white"
                  />
                  <p className="text-[10px] text-forest/40">Acepta 126.448 o 126448</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Nº de cuotas</label>
                  <Input
                    type="number"
                    min={1}
                    max={360}
                    value={form.n_cuotas}
                    onChange={(e) => setForm({ ...form, n_cuotas: e.target.value })}
                    required
                    className="h-11 border-forest/15 bg-white"
                  />
                  <p className="text-[10px] text-forest/40">Solo cantidad (ej: 3)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Cuota inicial (COP)</label>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    value={form.cuota_inicial}
                    onChange={(e) => setForm({ ...form, cuota_inicial: e.target.value })}
                    className="h-11 border-forest/15 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">
                    Cuotas ya pagadas (cantidad)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={nCuotas || 360}
                    value={form.cuotas_pagadas}
                    onChange={(e) => setForm({ ...form, cuotas_pagadas: e.target.value })}
                    className="h-11 border-forest/15 bg-white"
                  />
                  <p className="text-[10px] text-amber-800/80">
                    Ej: 2 — no pongas pesos aquí
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-forest/70">
                  Ya pagado en pesos (COP) — opcional
                </label>
                <Input
                  inputMode="numeric"
                  placeholder="355.794"
                  value={form.monto_pagado}
                  onChange={(e) => setForm({ ...form, monto_pagado: e.target.value })}
                  className="h-11 border-forest/15 bg-white"
                />
                <p className="text-[10px] text-forest/40">
                  Si lo llenas, este monto manda sobre “cuotas ya pagadas”
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-forest/70">Día de cobro (cada mes)</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dia_cobro}
                  onChange={(e) => setForm({ ...form, dia_cobro: e.target.value })}
                  className="h-11 border-forest/15 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Fecha de la tarjeta</label>
                  <Input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fecha: e.target.value,
                        fecha_inicio: form.fecha_inicio || e.target.value,
                      })
                    }
                    className="h-11 border-forest/15 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Inicia desde</label>
                  <Input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                    className="h-11 border-forest/15 bg-white"
                  />
                  <p className="text-[10px] text-forest/40">
                    Meses anteriores no se acumulan
                  </p>
                </div>
              </div>
              {previewTotal != null && (
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-forest">
                  <p>
                    Total deuda: <strong>{formatMoney(previewTotal)}</strong>
                  </p>
                  <p className="text-forest/60">
                    Ya pagado: {formatMoney(previewPagado || 0)} · Resta{" "}
                    {formatMoney(Math.max(0, previewTotal - (previewPagado || 0)))}
                  </p>
                  <p className="mt-1 text-[11px] text-violet-700">
                    Al guardar: deuda en “Deudas en proceso” + cuota del mes en “Pendiente”
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Monto (COP)</label>
                  <Input
                    inputMode="numeric"
                    placeholder="400.000"
                    value={form.monto_total}
                    onChange={(e) => setForm({ ...form, monto_total: e.target.value })}
                    required
                    className="h-11 border-forest/15 bg-white"
                  />
                  <p className="text-[10px] text-forest/40">Ej: 400.000 o 400000</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">Fecha</label>
                  <Input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fecha: e.target.value,
                        fecha_inicio: form.fecha_inicio || e.target.value,
                      })
                    }
                    className="h-11 border-forest/15 bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-forest/70">Inicia desde</label>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="h-11 border-forest/15 bg-white"
                />
                <p className="text-[10px] text-forest/40">
                  Para recurrentes/vinculados: no cuenta meses anteriores a esta fecha
                </p>
              </div>
              {(form.tipo === "deuda" || form.tipo === "ahorro") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-forest/70">
                    {form.tipo === "deuda" ? "Ya pagado (COP)" : "Ya ahorrado (COP)"}
                  </label>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    value={form.monto_pagado}
                    onChange={(e) => setForm({ ...form, monto_pagado: e.target.value })}
                    className="h-11 border-forest/15 bg-white"
                  />
                </div>
              )}
              {form.tipo !== "deuda" || form.estado !== "en_proceso" ? (
                <label className="flex items-center gap-2 rounded-lg border border-forest/10 bg-white/60 px-3 py-2 text-sm text-forest">
                  <input
                    type="checkbox"
                    checked={form.es_recurrente}
                    onChange={(e) => setForm({ ...form, es_recurrente: e.target.checked })}
                  />
                  Recurrente (aparece en Pendiente el próximo mes)
                </label>
              ) : null}
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "…" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
