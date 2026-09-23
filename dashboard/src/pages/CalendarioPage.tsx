import { useEffect, useState } from "react";
import { listTareas, createTarea, updateTarea } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function CalendarioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = () => {
    const desde = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const hasta = format(endOfMonth(new Date()), "yyyy-MM-dd");
    listTareas(desde, hasta).then(setItems).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTarea({ titulo, fecha_programada: fecha });
      toast.success("Tarea agendada");
      setTitulo("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggle = async (t: any) => {
    await updateTarea(t.id_tarea, { completada: !t.completada });
    load();
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Calendario</h1>
        <p className="text-muted-foreground">Tareas del mes por cumplir</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Nueva tarea</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-wrap gap-3">
            <Input className="max-w-sm" placeholder="Qué hay que hacer" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            <Button type="submit">Agendar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((t) => (
          <button
            key={t.id_tarea}
            onClick={() => toggle(t)}
            className="flex w-full items-center justify-between rounded-xl border border-forest/10 bg-white/80 px-4 py-3 text-left hover:bg-cream"
          >
            <div>
              <p className={t.completada ? "line-through text-muted-foreground" : "font-medium text-forest"}>{t.titulo}</p>
              <p className="text-xs text-muted-foreground">{String(t.fecha_programada).slice(0, 10)}</p>
            </div>
            <span className="text-xs">{t.completada ? "Hecha" : "Pendiente"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
