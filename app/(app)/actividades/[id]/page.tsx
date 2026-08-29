"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-steps";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/lib/data/provider";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";

/** Resumen de la actividad: en qué paso del flujo está y qué falta para cerrarla. */
export default function ActividadResumenPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    getActivity,
    questionsOf,
    submissionsOf,
    deleteActivity,
  } = useData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activity = getActivity(id);
  const questions = questionsOf(id);
  const submissions = submissionsOf(id);
  if (!activity) return null;

  const base = `/actividades/${id}`;
  const graded = submissions.filter((s) => s.isFinal).length;
  const lowConfidence = questions.filter((q) => q.confidence < CONFIDENCE_THRESHOLD);
  const unconfirmed = questions.filter((q) => !q.confirmed);
  const rubricPoints = questions.reduce((acc, q) => acc + q.points, 0);
  const unassigned = submissions.filter((s) => !s.student).length;

  const steps = [
    {
      href: `${base}/documento`,
      icon: "document_scanner",
      title: "Documento de la actividad",
      state: activity.source_files.length
        ? `${activity.source_files.length} archivo(s) cargado(s)`
        : "Sin archivo todavía",
      done: activity.source_files.length > 0,
      cta: activity.source_files.length ? "Ver documento" : "Subir o escanear",
    },
    {
      href: `${base}/preguntas`,
      icon: "quiz",
      title: "Preguntas y criterios",
      state: questions.length
        ? `${questions.length} preguntas · ${unconfirmed.length} sin confirmar`
        : "Todavía no hay preguntas extraídas",
      done: questions.length > 0 && unconfirmed.length === 0,
      cta: questions.length ? "Revisar preguntas" : "Extraer preguntas",
    },
    {
      href: `${base}/respuestas`,
      icon: "assignment",
      title: "Respuestas de estudiantes",
      state: submissions.length
        ? `${submissions.length} entregas · ${unassigned} sin asignar`
        : "Sin entregas cargadas",
      done: submissions.length > 0 && unassigned === 0,
      cta: submissions.length ? "Ver entregas" : "Subir respuestas",
    },
    {
      href: `${base}/resultados`,
      icon: "grade",
      title: "Resultados",
      state: `${graded} de ${submissions.length} entregas con calificación final`,
      done: submissions.length > 0 && graded === submissions.length,
      cta: "Ver resultados",
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-gutter">
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Puntaje máximo
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {activity.max_score}
          </p>
          {questions.length > 0 && rubricPoints !== activity.max_score && (
            <p className="mt-2 inline-flex items-start gap-1.5 font-sans text-body-sm text-status-pending-text">
              <Icon name="priority_high" size={20} className="text-[18px]" />
              La suma de las preguntas es {rubricPoints}. Revisa los puntajes.
            </p>
          )}
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Progreso de corrección
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {graded} / {submissions.length || 0}
          </p>
          <ProgressBar
            className="mt-3"
            value={graded}
            max={Math.max(submissions.length, 1)}
            label="Progreso de corrección"
          />
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Confianza de extracción
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {lowConfidence.length}
          </p>
          <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
            preguntas por debajo del umbral de {Math.round(CONFIDENCE_THRESHOLD * 100)}%
          </p>
        </Card>
      </div>

      <div className="grid gap-gutter md:grid-cols-2">
        {steps.map((step) => (
          <Card key={step.href} interactive className="flex items-start gap-4 p-6">
            <span
              className={
                step.done
                  ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-corrected/10"
                  : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container"
              }
            >
              <Icon
                name={step.done ? "check_circle" : step.icon}
                filled={step.done}
                size={20}
                className={
                  step.done ? "text-status-corrected-text" : "text-on-surface-variant"
                }
              />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-headline-sm text-on-background">
                {step.title}
              </h3>
              <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                {step.state}
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-3">
                <Link href={step.href}>
                  {step.cta}
                  <Icon name="arrow_forward" size={20} />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Icon name="delete" size={20} />
          Eliminar actividad
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar «{activity.title}»?</DialogTitle>
            <DialogDescription>
              Se eliminarán también sus preguntas, entregas y correcciones. Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await deleteActivity(id);
                toast.success("Actividad eliminada.");
                router.push("/dashboard");
              }}
            >
              <Icon name="delete" size={20} />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
