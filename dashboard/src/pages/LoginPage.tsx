import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel marca — compacto arriba en móvil, mitad izquierda en desktop */}
      <section className="relative flex shrink-0 flex-col justify-end overflow-hidden bg-forest px-6 py-10 sm:px-10 sm:py-12 lg:h-auto lg:w-1/2 lg:px-14 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 15% 10%, rgba(231, 182, 29, 0.22), transparent 55%),
              radial-gradient(ellipse 50% 40% at 90% 85%, rgba(245, 244, 240, 0.08), transparent 50%),
              linear-gradient(165deg, #0a352c 0%, #0c4136 45%, #0e4a3d 100%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5f4f0' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-lg">
          <p className="mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-cream/50 lg:mb-8">
            El tablero de Sebas
          </p>
          <h1 className="font-display text-[1.85rem] leading-[1.2] text-cream sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Finanzas
            <br />
            personales
          </h1>
          <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-cream/65 sm:text-[15px] lg:mt-6">
            Gestiona ingresos, gastos, metas de ahorro, rutinas y tareas desde un solo lugar.
          </p>
        </div>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-start justify-center bg-cream px-6 py-10 sm:px-10 sm:py-14 lg:items-center lg:w-1/2 lg:px-14">
        <div className="w-full max-w-[22rem]">
          <h2 className="font-display text-3xl tracking-tight text-forest sm:text-4xl">
            {mode === "login" ? "Bienvenido, Sebas" : "Empecemos, Sebas"}
          </h2>
          <p className="mt-2 font-sans text-sm leading-relaxed text-forest/55">
            {mode === "login" ? "Entra y sigue donde lo dejaste." : "Crea tu espacio. Un paso a la vez."}
          </p>

          <form onSubmit={onSubmit} className="mt-9 space-y-5">
            {mode === "register" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="nombre" className="font-sans text-xs font-medium text-forest/70">
                    Nombre
                  </label>
                  <Input
                    id="nombre"
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    className="h-11 border-forest/15 bg-white/80 shadow-none focus-visible:ring-forest/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="apellido" className="font-sans text-xs font-medium text-forest/70">
                    Apellido
                  </label>
                  <Input
                    id="apellido"
                    placeholder="Opcional"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="h-11 border-forest/15 bg-white/80 shadow-none focus-visible:ring-forest/30"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-sans text-xs font-medium text-forest/70">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-11 border-forest/15 bg-white/80 shadow-none focus-visible:ring-forest/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-sans text-xs font-medium text-forest/70">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="h-11 border-forest/15 bg-white/80 pr-11 shadow-none focus-visible:ring-forest/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/45 transition-colors hover:text-forest"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-1 h-11 w-full font-sans text-sm tracking-wide"
              disabled={submitting}
            >
              {submitting ? "…" : mode === "login" ? "Entrar" : "Crear mi cuenta"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-8 font-sans text-sm text-forest/60 transition-colors hover:text-forest"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "¿Primera vez? Crear mi cuenta" : "Ya tengo cuenta. Entrar"}
          </button>
        </div>
      </section>
    </main>
  );
}
