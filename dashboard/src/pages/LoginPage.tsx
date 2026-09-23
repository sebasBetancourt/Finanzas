import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  });

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          apellido: form.apellido || undefined,
        });
      }
      toast.success(mode === "login" ? "Bienvenido" : "Cuenta creada");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      <section className="relative hidden w-1/2 overflow-hidden bg-forest lg:flex lg:flex-col lg:justify-end lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(231,182,29,0.35),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(215,243,19,0.2),transparent_40%)]" />
        <div className="relative z-10">
          <h1 className="font-display text-5xl leading-tight text-cream">
            Tus sueños,
            <br />
            tu economía.
          </h1>
          <p className="mt-4 max-w-md text-cream/70">
            Metas con fechas, planes, rutinas, calendario, ahorros y KPIs — todo en un solo lugar.
          </p>
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <p className="font-display text-3xl text-forest">Finanzas</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <>
                <Input
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
                <Input
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "..." : mode === "login" ? "Entrar" : "Registrarme"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-6 text-sm text-forest/70 underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </section>
    </main>
  );
}
