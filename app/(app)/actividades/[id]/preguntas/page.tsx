"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionEditorCard } from "@/components/activity/question-editor-card";
import { useData } from "@/lib/data/provider";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";

/** §15 — editor de la actividad, con las preguntas de confianza baja resaltadas. */
export default function PreguntasPage() {
  const { id } = useParams<{ id: string }>();
  const { getActivity, questionsOf, addQuestion, confirmAllQuestions } = useData();

  const activity = getActivity(id);
  const questions = questionsOf(id);
  if (!activity) return null;

  const low = questions.filter((q) => q.confidence < CONFIDENCE_THRESHOLD);
  const unconfirmed = questions.filter((q) => !q.confirmed);

  if (questions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="quiz"
          title="Todavía no hay preguntas"
          description="Sube el documento de la actividad y procésalo: la IA propondrá la estructura y tú la revisas."
          action={
            <Button asChild>
              <Link href={`/actividades/${id}/documento`}>
                <Icon name="document_scanner" size={20} />
                Ir al documento
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-sans text-body-md text-on-background">
            {questions.length} preguntas · criterios valorados con niveles de logro
          </p>
          <p className="font-sans text-body-sm text-on-surface-variant">
            {low.length > 0 ? (
              <>
                <span className="text-status-pending-text">
                  {low.length} con confianza baja
                </span>{" "}
                · revísalas primero.
              </>
            ) : (
              "Ninguna pregunta quedó por debajo del umbral de confianza."
            )}
            {unconfirmed.length > 0 &&
              ` ${unconfirmed.length} sin confirmar todavía.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => addQuestion(id)}>
            <Icon name="add" size={20} />
            Agregar pregunta
          </Button>
          <Button
            size="sm"
            disabled={unconfirmed.length === 0}
            onClick={async () => {
              await confirmAllQuestions(id);
              toast.success("Preguntas confirmadas.");
            }}
          >
            <Icon name="check_circle" size={20} />
            Confirmar todas
          </Button>
        </div>
      </Card>

      {low.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-status-pending/20 bg-status-pending/10 p-4">
          <Icon
            name="priority_high"
            size={20}
            className="text-status-pending-text"
          />
          <span className="font-sans text-body-sm text-status-pending-text">
            Ir directamente a lo dudoso:
          </span>
          {low.map((q) => (
            <a
              key={q.id}
              href={`#pregunta-${q.number}`}
              className="rounded-full border border-status-pending/20 bg-surface-container-lowest px-3 py-1 font-sans text-label-sm text-status-pending-text hover:bg-status-pending/10"
            >
              Pregunta {q.number} · {Math.round(q.confidence * 100)}%
            </a>
          ))}
        </div>
      )}

      <div className="space-y-gutter">
        {questions.map((q) => (
          <QuestionEditorCard key={q.id} question={q} />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button asChild>
          <Link href={`/actividades/${id}/respuestas`}>
            Continuar a respuestas
            <Icon name="arrow_forward" size={20} />
          </Link>
        </Button>
      </div>
    </>
  );
}
