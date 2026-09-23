import { useEffect, useState } from "react";
import { listAhorros, createAhorro, addAporte } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export default function AhorrosPage() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [fecha, setFecha] = useState("");

  const load = () => listAhorros().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAhorro({ nombre, monto_objetivo: Number(objetivo), fecha_objetivo: fecha || null });
      toast.success("Meta de ahorro creada");
      setNombre(""); setObjetivo(""); setFecha("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onAporte = async (id: number) => {
    const raw = prompt("Monto del aporte");
    if (!raw) return;
    try {
      await addAporte(id, { monto: Number(raw) });
      toast.success("Aporte registrado");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-forest">Ahorros</h1>
        <p className="text-muted-foreground">Metas de ahorro y aportes</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Nueva meta de ahorro</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <Input type="number" placeholder="Monto objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} required />
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Button type="submit">Crear</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => {
          const pct = Number(a.monto_objetivo) > 0 ? Math.round((Number(a.monto_actual) / Number(a.monto_objetivo)) * 100) : 0;
          return (
            <Card key={a.id_ahorro}>
              <CardHeader><CardTitle>{a.nombre}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{formatMoney(Number(a.monto_actual))} / {formatMoney(Number(a.monto_objetivo))}</p>
                <div className="h-2 overflow-hidden rounded-full bg-forest/10">
                  <div className="h-full bg-amber" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{pct}% · {a.estado}</span>
                  <Button size="sm" variant="secondary" onClick={() => onAporte(a.id_ahorro)}>Aportar</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
