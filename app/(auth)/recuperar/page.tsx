"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useData } from "@/lib/data/provider";

export default function RecuperarPage() {
  const { requestPasswordReset } = useData();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("El correo no parece válido.");
      return;
    }
    setError(undefined);
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <h1 className="mb-2 font-sans text-display-lg text-on-background">
        Recuperar acceso
      </h1>
      <p className="mb-6 font-sans text-body-lg text-on-surface-variant">
        Te enviamos un enlace para crear una contraseña nueva.
      </p>

      <Card>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Icon
                name="mark_email_read"
                size={40}
                className="mb-3 text-status-corrected-text"
              />
              <p className="mb-1 font-sans text-headline-sm text-on-background">
                Revisa tu correo
              </p>
              <p className="max-w-xs font-sans text-body-sm text-on-surface-variant">
                Si <strong>{email}</strong> tiene una cuenta en AERA, ahí encontrarás el
                enlace para restablecer tu contraseña.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <Field label="Correo electrónico" htmlFor="email" error={error} required>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  aria-invalid={Boolean(error)}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="docente@colegio.edu"
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Icon name="progress_activity" size={20} className="animate-spin" />
                ) : (
                  <Icon name="send" size={20} />
                )}
                {loading ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center font-sans text-body-sm text-on-surface-variant">
        <Link href="/login" className="text-primary-container hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
