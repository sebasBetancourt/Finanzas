import { useEffect, useState } from "react";
import { listSuenos, createSueno } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SuenosPage() {
  const [items, setItems] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");

  const load = () => listSuenos().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSueno({ titulo, descripcion, fecha_objetivo: fecha || null });
      toast.success("Sueño creado");
      setTitulo(""); setDescripcion(""); setFecha("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Sueños</h1>
        <p className="text-muted-foreground">Tu visión a largo plazo</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Nuevo sueño</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            <Input placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Button type="submit">Agregar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((s) => (
          <Card key={s.id_sueno}>
            <CardHeader><CardTitle>{s.titulo}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{s.descripcion || "Sin descripción"}</p>
              <div className="flex gap-3 text-xs">
                <span className="rounded bg-forest/10 px-2 py-1">{s.estado}</span>
                {s.fecha_objetivo && <span>Meta: {String(s.fecha_objetivo).slice(0, 10)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">Aún no tienes sueños definidos.</p>}
      </div>
    </div>
  );
}
