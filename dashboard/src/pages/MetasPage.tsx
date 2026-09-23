import { useEffect, useState } from "react";
import { listMetas, createMeta } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function MetasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ titulo: "", tipo: "personal", fecha_fin: "", valor_objetivo: "" });

  const load = () => listMetas().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMeta({
        titulo: form.titulo,
        tipo: form.tipo,
        fecha_fin: form.fecha_fin || null,
        valor_objetivo: form.valor_objetivo ? Number(form.valor_objetivo) : null,
        estado: "en_progreso",
      });
      toast.success("Meta creada");
      setForm({ titulo: "", tipo: "personal", fecha_fin: "", valor_objetivo: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Metas</h1>
        <p className="text-muted-foreground">Objetivos con fechas y progreso</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Nueva meta</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            <select className="h-10 rounded-md border px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="personal">Personal</option>
              <option value="financiera">Financiera</option>
              <option value="salud">Salud</option>
              <option value="carrera">Carrera</option>
              <option value="otro">Otro</option>
            </select>
            <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
            <Input type="number" placeholder="Valor objetivo" value={form.valor_objetivo} onChange={(e) => setForm({ ...form, valor_objetivo: e.target.value })} />
            <Button type="submit">Agregar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items.map((m) => (
          <Card key={m.id_meta}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium text-forest">{m.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {m.tipo} · {m.estado}{m.fecha_fin ? ` · hasta ${String(m.fecha_fin).slice(0, 10)}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{Number(m.progreso_pct)}%</p>
                <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-forest/10">
                  <div className="h-full bg-amber" style={{ width: `${Math.min(Number(m.progreso_pct), 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
