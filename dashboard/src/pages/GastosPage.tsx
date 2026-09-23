import { useEffect, useState } from "react";
import { listMovimientos, createMovimiento, listCategorias } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export default function GastosPage() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    tipo: "egreso",
    concepto: "",
    monto: "",
    id_categoria: "",
    fecha: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    listMovimientos().then(setItems).catch(console.error);
    listCategorias().then(setCats).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMovimiento({
        tipo: form.tipo,
        concepto: form.concepto,
        monto: Number(form.monto),
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        fecha: form.fecha,
      });
      toast.success("Movimiento registrado");
      setForm({ ...form, concepto: "", monto: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Ingresos y gastos</h1>
        <p className="text-muted-foreground">Movimientos por categoría</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Registrar movimiento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-6">
            <select className="h-10 rounded-md border px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value, id_categoria: "" })}>
              <option value="egreso">Egreso</option>
              <option value="ingreso">Ingreso</option>
            </select>
            <Input placeholder="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} required />
            <Input type="number" placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
            <select className="h-10 rounded-md border px-3 text-sm" value={form.id_categoria} onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}>
              <option value="">Categoría</option>
              {cats.filter((c) => c.tipo === form.tipo).map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </select>
            <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="overflow-hidden rounded-xl border border-forest/10 bg-white/80">
        <table className="w-full text-sm">
          <thead className="bg-forest/5 text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id_movimiento} className="border-t border-forest/5">
                <td className="px-4 py-3">{String(m.fecha).slice(0, 10)}</td>
                <td className="px-4 py-3">{m.concepto}</td>
                <td className="px-4 py-3">{m.categoria_nombre || "—"}</td>
                <td className="px-4 py-3 capitalize">{m.tipo}</td>
                <td className={`px-4 py-3 text-right font-medium ${m.tipo === "ingreso" ? "text-forest" : "text-rust"}`}>
                  {m.tipo === "ingreso" ? "+" : "−"}{formatMoney(Number(m.monto))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="p-6 text-sm text-muted-foreground">Sin movimientos registrados.</p>}
      </div>
    </div>
  );
}
