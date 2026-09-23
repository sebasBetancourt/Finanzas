import { useEffect, useState } from "react";
import { listRutinas, createRutina } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RutinasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [frecuencia, setFrecuencia] = useState("diaria");

  const load = () => listRutinas().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRutina({ titulo, frecuencia });
      toast.success("Rutina creada");
      setTitulo("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Rutinas</h1>
        <p className="text-muted-foreground">Hábitos recurrentes que sostienen tus metas</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Nueva rutina</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-wrap gap-3">
            <Input className="max-w-sm" placeholder="Ej. Revisar gastos" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            <select className="h-10 rounded-md border px-3 text-sm" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
            <Button type="submit">Agregar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <Card key={r.id_rutina}>
            <CardContent className="p-5">
              <p className="font-medium text-forest">{r.titulo}</p>
              <p className="text-xs text-muted-foreground capitalize">{r.frecuencia} · {r.activo ? "activa" : "pausada"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
