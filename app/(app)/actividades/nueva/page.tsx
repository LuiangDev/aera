"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useData } from "@/lib/data/provider";

const MATERIAS = [
  "Matemática",
  "Comunicación",
  "Ciencia y Tecnología",
  "Personal Social",
  "Inglés",
  "Arte y Cultura",
  "Educación Física",
  "Otra",
];

export default function NuevaActividadPage() {
  const router = useRouter();
  const { createActivity } = useData();
  const [form, setForm] = useState({
    title: "",
    subject: MATERIAS[0],
    description: "",
    application_date: "",
    max_score: "20",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Ponle un nombre a la actividad.";
    const max = Number(form.max_score);
    if (!Number.isFinite(max) || max <= 0)
      next.max_score = "El puntaje máximo debe ser un número mayor que cero.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const activity = await createActivity({
        title: form.title.trim(),
        subject: form.subject,
        description: form.description.trim(),
        max_score: max,
        application_date: form.application_date || undefined,
      });
      toast.success("Actividad creada. Ahora sube o escanea la evaluación.");
      router.push(`/actividades/${activity.id}/documento`);
    } catch {
      toast.error("No pudimos crear la actividad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nueva actividad"
        description="Primero los datos básicos. En el siguiente paso subes o escaneas la evaluación que ya tienes."
        backHref="/dashboard"
        backLabel="Dashboard"
      />

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field label="Nombre" htmlFor="title" error={errors.title} required>
              <Input
                id="title"
                value={form.title}
                aria-invalid={Boolean(errors.title)}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Comprensión lectora - El Principito"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Materia" htmlFor="subject">
                <Select
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                >
                  {MATERIAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Fecha de aplicación" htmlFor="application_date">
                <Input
                  id="application_date"
                  type="date"
                  value={form.application_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, application_date: e.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Descripción" htmlFor="description">
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Evaluación de comprensión lectora"
              />
            </Field>

            <Field
              label="Puntaje máximo"
              htmlFor="max_score"
              hint="Si al definir las preguntas la suma de puntajes no coincide, te avisamos."
              error={errors.max_score}
              required
            >
              <Input
                id="max_score"
                type="number"
                min={1}
                step="0.5"
                className="max-w-[160px]"
                value={form.max_score}
                aria-invalid={Boolean(errors.max_score)}
                onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))}
              />
            </Field>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Icon name="progress_activity" size={20} className="animate-spin" />
                ) : (
                  <Icon name="add" size={20} />
                )}
                {loading ? "Creando…" : "Crear actividad"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/dashboard")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
