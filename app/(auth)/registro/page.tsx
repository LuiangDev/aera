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

export default function RegistroPage() {
  const router = useRouter();
  const { signUp } = useData();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ingresa tu nombre.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "El correo no parece válido.";
    if (form.password.length < 8)
      next.password = "Usa al menos 8 caracteres.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signUp(form.name, form.email, form.password);
      toast.success("Cuenta creada. ¡Bienvenida!");
      router.push("/dashboard");
    } catch {
      toast.error("No pudimos crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-sans text-display-lg text-on-background">Crear cuenta</h1>
      <p className="mb-6 font-sans text-body-lg text-on-surface-variant">
        Digitaliza la evaluación que ya tienes lista, en papel o en PDF.
      </p>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field label="Nombre completo" htmlFor="name" error={errors.name} required>
              <Input
                id="name"
                value={form.name}
                onChange={set("name")}
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                placeholder="Ana Ríos"
              />
            </Field>
            <Field label="Correo electrónico" htmlFor="email" error={errors.email} required>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                placeholder="docente@colegio.edu"
              />
            </Field>
            <Field
              label="Contraseña"
              htmlFor="password"
              hint="Mínimo 8 caracteres."
              error={errors.password}
              required
            >
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={set("password")}
                aria-invalid={Boolean(errors.password)}
                autoComplete="new-password"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Icon name="progress_activity" size={20} className="animate-spin" />
              ) : (
                <Icon name="person_add" size={20} />
              )}
              {loading ? "Creando…" : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center font-sans text-body-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary-container hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
