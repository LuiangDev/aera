"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useData } from "@/lib/data/provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useData();
  const [email, setEmail] = useState("docente@aera.app");
  const [password, setPassword] = useState("demo1234");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Ingresa tu correo.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "El correo no parece válido.";
    if (!password) next.password = "Ingresa tu contraseña.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-sans text-display-lg text-on-background">
        Hola de nuevo
      </h1>
      <p className="mb-6 font-sans text-body-lg text-on-surface-variant">
        Entra para revisar tus actividades y correcciones.
      </p>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field label="Correo electrónico" htmlFor="email" error={errors.email} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docente@colegio.edu"
              />
            </Field>

            <Field label="Contraseña" htmlFor="password" error={errors.password} required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-between">
              <Link
                href="/recuperar"
                className="font-sans text-body-sm text-primary-container hover:underline"
              >
                Olvidé mi contraseña
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Icon name="progress_activity" size={20} className="animate-spin" />
              ) : (
                <Icon name="login" size={20} />
              )}
              {loading ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center font-sans text-body-sm text-on-surface-variant">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="text-primary-container hover:underline">
          Crear una cuenta
        </Link>
      </p>

      <p className="mt-4 rounded-lg border border-surface-border bg-surface-container-low p-3 text-center font-sans text-label-sm text-on-surface-variant">
        Maqueta de front: cualquier correo y contraseña te dejan entrar con los datos de
        demostración.
      </p>
    </>
  );
}
