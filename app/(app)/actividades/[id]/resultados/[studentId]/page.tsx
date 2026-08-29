"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { AiSuggestedBadge } from "@/components/ui/ai-value";
import { useData } from "@/lib/data/provider";

/**
 * §8.2 — exportar resultado individual.
 * Vista imprimible: es la pieza que cierra el ciclo "la IA generó feedback → el feedback
 * llega al estudiante" sin portal de estudiante. `window.print()` produce el PDF con las
 * reglas @media print de globals.css; los controles llevan `no-print`.
 */
export default function ResultadoEstudiantePage() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const { getActivity, submissionsOf, gradingItemsOf, students, teacher } = useData();

  const activity = getActivity(id);
  const student = students.find((s) => s.id === studentId);
  const submission = submissionsOf(id).find((s) => s.student_id === studentId);
  const items = submission ? gradingItemsOf(submission.id) : [];
  if (!activity) return null;

  if (!student || !submission) {
    return (
      <Card>
        <EmptyState
          icon="search_off"
          title="No encontramos el resultado de este estudiante"
          action={
            <Button asChild>
              <Link href={`/actividades/${id}/resultados`}>Volver a resultados</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const maxTotal = items.reduce((acc, i) => acc + i.question.points, 0);
  const total = items.reduce(
    (acc, i) => acc + (i.grading?.teacher_score ?? i.grading?.ai_score ?? 0),
    0,
  );
  const allFinal = items.length > 0 && items.every((i) => i.grading?.status === "FINAL");

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/actividades/${id}/resultados`}
          className="inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"
        >
          <Icon name="arrow_back" size={20} />
          Resultados
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!allFinal && (
            <span className="inline-flex items-center gap-2 font-sans text-body-sm text-status-pending-text">
              <Icon name="priority_high" size={20} className="text-[18px]" />
              Hay puntajes sin confirmar: revísalos antes de entregar esto.
            </span>
          )}
          <Button onClick={() => window.print()}>
            <Icon name="print" size={20} />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card className="print-sheet mx-auto max-w-3xl">
        <CardContent className="space-y-6">
          <header className="border-b border-surface-border pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-sans text-headline-md text-on-background">
                  {activity.title}
                </h1>
                <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                  {activity.subject}
                  {teacher ? ` · Docente: ${teacher.name}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                  Calificación
                </p>
                <p className="font-sans text-display-lg text-on-background">
                  {total}
                  <span className="font-sans text-headline-sm text-on-surface-variant">
                    {" "}
                    / {maxTotal}
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-3 font-sans text-body-md text-on-background">
              <strong>{student.name}</strong>
              <span className="ml-2 font-sans text-body-sm text-on-surface-variant">
                {student.identifier}
              </span>
            </p>
          </header>

          <div className="space-y-5">
            {items.map((item) => {
              const score = item.grading?.teacher_score ?? item.grading?.ai_score ?? 0;
              const isFinal = item.grading?.status === "FINAL";
              return (
                <section
                  key={item.question.id}
                  className="border-b border-surface-border pb-5 last:border-0"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-sans text-headline-sm text-on-background">
                      Pregunta {item.question.number}
                    </h2>
                    <span className="flex items-center gap-2 font-sans text-body-md text-on-background">
                      {!isFinal && <AiSuggestedBadge label="Sin confirmar" />}
                      {score} / {item.question.points}
                    </span>
                  </div>
                  <p className="mb-2 font-sans text-body-md text-on-background">
                    {item.question.text}
                  </p>
                  <p className="mb-2 rounded-lg bg-surface-container-low p-3 font-sans text-body-md text-on-background">
                    <span className="mr-1 font-sans text-label-sm uppercase tracking-wider text-secondary">
                      Tu respuesta:
                    </span>
                    {item.answer?.extracted_text || "Sin respuesta registrada."}
                  </p>
                  <p className="font-sans text-body-sm text-on-surface-variant">
                    <span className="mr-1 font-sans text-label-sm uppercase tracking-wider text-secondary">
                      Comentario:
                    </span>
                    {item.grading?.teacher_feedback || item.grading?.ai_feedback || "—"}
                  </p>
                </section>
              );
            })}
          </div>

          <footer className="border-t border-surface-border pt-4 font-sans text-label-sm text-on-surface-variant">
            Calificación revisada y confirmada por el docente. Generado con AERA.
          </footer>
        </CardContent>
      </Card>
    </>
  );
}
