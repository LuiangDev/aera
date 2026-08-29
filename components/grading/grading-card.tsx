"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ConfidenceBadge, isLowConfidence } from "@/components/ui/confidence";
import { AiSuggestedBadge, AiSuggestedValue, ConfirmedValue } from "@/components/ui/ai-value";
import { useData, type GradingItem } from "@/lib/data/provider";

/**
 * §18 / §19 — revisión de la corrección de una respuesta.
 * Caso de uso central del patrón de §8.9: el puntaje de la IA se presenta SIEMPRE como
 * sugerencia mientras el docente no lo confirme, y el copy usa lenguaje de sugerencia
 * (§31): "sugerido por IA", "revisa antes de aprobar" — nunca "respuesta incorrecta".
 */
export function GradingCard({ item }: { item: GradingItem }) {
  const { setTeacherScore, setTeacherFeedback, approveGrading, setCriterionTeacherPoints } =
    useData();
  const { question, answer, grading } = item;
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(
    String(grading?.teacher_score ?? grading?.ai_score ?? 0),
  );
  const [feedback, setFeedback] = useState(
    grading?.teacher_feedback ?? grading?.ai_feedback ?? "",
  );

  const isFinal = grading?.status === "FINAL";

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Pregunta {question.number} · {question.points} pts
          </p>
          <h3 className="mt-1 font-sans text-headline-sm text-on-background">
            {question.text || "Pregunta sin enunciado"}
          </h3>
        </div>
        {grading &&
          (isFinal ? (
            <ConfirmedValue
              value={`${grading.teacher_score ?? grading.ai_score} / ${question.points}`}
            />
          ) : (
            <AiSuggestedValue
              value={`${grading.teacher_score ?? grading.ai_score} / ${question.points}`}
              label="Sugerido por IA"
            />
          ))}
      </div>

      {/* Respuesta extraída del estudiante */}
      <div className="mb-4 rounded-lg border border-surface-border bg-surface-container-low p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="font-sans text-label-md text-on-surface-variant">
            Respuesta del estudiante
          </p>
          {answer && <ConfidenceBadge value={answer.confidence} />}
          {answer?.source_region && (
            <span className="inline-flex items-center gap-1 font-sans text-label-sm text-on-surface-variant">
              <Icon name="crop_free" size={20} className="text-[16px]" />
              {answer.source_region}
            </span>
          )}
        </div>
        <p className="font-sans text-body-md text-on-background">
          {answer?.extracted_text || "No se extrajo texto para esta pregunta."}
        </p>
        {answer && isLowConfidence(answer.confidence) && (
          <p className="mt-2 flex items-start gap-1.5 font-sans text-body-sm text-status-pending-text">
            <Icon name="priority_high" size={20} className="text-[18px]" />
            La lectura de esta respuesta no es segura. Compárala con la hoja original antes
            de aprobar el puntaje.
          </p>
        )}
      </div>

      {!grading ? (
        <p className="font-sans text-body-sm text-on-surface-variant">
          Esta entrega todavía no tiene corrección sugerida.
        </p>
      ) : (
        <>
          {/* Evaluación de la IA */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <AiSuggestedBadge label="Evaluación de la IA" />
              {!isFinal && (
                <span className="font-sans text-body-sm text-on-surface-variant">
                  Revisa antes de aprobar
                </span>
              )}
            </div>
            <p className="font-sans text-body-md text-on-background">
              {grading.ai_feedback}
            </p>
            {grading.teacher_feedback && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-surface-border bg-surface-container-lowest p-3 font-sans text-body-md text-on-background">
                <Icon
                  name="edit_note"
                  size={20}
                  className="mt-0.5 text-on-surface-variant"
                />
                <span>
                  <span className="mr-1 font-sans text-label-sm uppercase tracking-wider text-secondary">
                    Tu comentario:
                  </span>
                  {grading.teacher_feedback}
                </span>
              </p>
            )}
          </div>

          {/* §16 — desglose por criterio */}
          {question.rubric.length > 0 && (
            <ul className="mb-4 divide-y divide-surface-border rounded-lg border border-surface-border">
              {question.rubric.map((criterion) => {
                const cs = grading.criterion_scores.find(
                  (c) => c.criterion_id === criterion.id,
                );
                const value = cs?.teacher_points ?? cs?.ai_points ?? 0;
                const overridden = cs?.teacher_points != null;
                return (
                  <li
                    key={criterion.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-body-md text-on-background">
                        {criterion.description || "Criterio sin descripción"}
                      </p>
                      {cs?.comment && (
                        <p className="font-sans text-body-sm text-on-surface-variant">
                          {cs.comment}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!overridden && !isFinal && <AiSuggestedBadge label="IA" />}
                      <Input
                        type="number"
                        min={0}
                        max={criterion.points}
                        step="0.5"
                        aria-label={`Puntaje del criterio: ${criterion.description}`}
                        className={cn("w-20 px-2 py-1 text-center", isFinal && "opacity-70")}
                        value={value}
                        disabled={isFinal}
                        onChange={(e) =>
                          setCriterionTeacherPoints(
                            grading.id,
                            criterion.id,
                            Number(e.target.value),
                          )
                        }
                      />
                      <span className="font-sans text-body-sm text-on-surface-variant">
                        / {criterion.points}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {editing ? (
            <div className="space-y-4 rounded-lg border border-surface-border bg-surface-container-low p-4">
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <Field label="Puntaje final" htmlFor={`score-${grading.id}`}>
                  <Input
                    id={`score-${grading.id}`}
                    type="number"
                    min={0}
                    max={question.points}
                    step="0.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </Field>
                <Field
                  label="Tu comentario para el estudiante"
                  htmlFor={`feedback-${grading.id}`}
                >
                  <Textarea
                    id={`feedback-${grading.id}`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await setTeacherScore(grading.id, Number(score));
                    await setTeacherFeedback(grading.id, feedback);
                    await approveGrading(grading.id);
                    setEditing(false);
                  }}
                >
                  <Icon name="check_circle" size={20} />
                  Guardar y confirmar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await setTeacherScore(grading.id, Number(score));
                    await setTeacherFeedback(grading.id, feedback);
                    setEditing(false);
                  }}
                >
                  Guardar sin confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {!isFinal && (
                <Button size="sm" onClick={() => approveGrading(grading.id)}>
                  <Icon name="check" size={20} />
                  Aprobar {grading.teacher_score ?? grading.ai_score} / {question.points}
                </Button>
              )}
              <Button
                size="sm"
                variant={isFinal ? "ghost" : "secondary"}
                onClick={() => {
                  setScore(String(grading.teacher_score ?? grading.ai_score));
                  setFeedback(grading.teacher_feedback ?? grading.ai_feedback);
                  setEditing(true);
                }}
              >
                <Icon name="edit" size={20} />
                {isFinal ? "Cambiar calificación" : "Editar"}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
