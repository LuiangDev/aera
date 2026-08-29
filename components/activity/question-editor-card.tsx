"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ConfidenceBadge, isLowConfidence } from "@/components/ui/confidence";
import { AiSuggestedBadge } from "@/components/ui/ai-value";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QUESTION_TYPE_LABELS, type Question, type QuestionType } from "@/lib/types";
import { useData } from "@/lib/data/provider";

/**
 * §15 — editor de pregunta, y §16 — criterios estructurados.
 *
 * Dos patrones obligatorios conviven aquí:
 * · §15/§28: si la confianza está bajo el umbral, la tarjeta se resalta con borde
 *   `status-pending` para que el docente sepa dónde mirar primero.
 * · §8.9: mientras el docente no confirme, lo extraído se presenta como sugerencia de IA;
 *   una vez confirmado, deja de competir por atención.
 */
export function QuestionEditorCard({ question }: { question: Question }) {
  const {
    updateQuestion,
    deleteQuestion,
    confirmQuestion,
    addCriterion,
    updateCriterion,
    deleteCriterion,
  } = useData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const low = isLowConfidence(question.confidence);
  const isAiExtracted = question.confidence < 1;

  return (
    <Card
      id={`pregunta-${question.number}`}
      className={cn(
        "scroll-mt-24 p-6",
        low && !question.confirmed && "border-2 border-status-pending",
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-sans text-headline-sm text-on-background">
            Pregunta {question.number}
          </h3>
          {isAiExtracted && <ConfidenceBadge value={question.confidence} />}
          {question.confirmed ? (
            <span className="inline-flex items-center gap-1.5 font-sans text-body-sm text-on-surface-variant">
              <Icon
                name="check_circle"
                size={20}
                filled
                className="text-status-corrected-text"
              />
              Confirmada
            </span>
          ) : (
            <AiSuggestedBadge label="Extraída por IA" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {!question.confirmed && (
            <Button size="xs" onClick={() => confirmQuestion(question.id)}>
              <Icon name="check" size={20} className="text-[18px]" />
              Confirmar
            </Button>
          )}
          <Button
            variant="icon"
            size="icon"
            aria-label={`Eliminar pregunta ${question.number}`}
            onClick={() => setConfirmOpen(true)}
          >
            <Icon name="delete" size={20} />
          </Button>
        </div>
      </div>

      {low && !question.confirmed && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-status-pending/20 bg-status-pending/10 p-3 font-sans text-body-sm text-status-pending-text">
          <Icon name="priority_high" size={20} className="text-[18px]" />
          La IA no leyó esta parte con seguridad. Revísala antes que las demás y compárala
          con el documento original.
        </p>
      )}

      <div className="grid gap-5">
        <div className="grid gap-5">
          <Field label="Enunciado" htmlFor={`text-${question.id}`}>
            <Textarea
              id={`text-${question.id}`}
              value={question.text}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
              placeholder="Escribe el enunciado de la pregunta"
            />
          </Field>

          <Field label="Tipo" htmlFor={`type-${question.id}`}>
            <Select
              id={`type-${question.id}`}
              value={question.type}
              onChange={(e) =>
                updateQuestion(question.id, {
                  type: e.target.value as QuestionType,
                  options:
                    e.target.value === "multiple_choice" && question.options.length === 0
                      ? ["", "", "", ""]
                      : question.options,
                })
              }
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {question.type === "multiple_choice" && (
          <div>
            <p className="mb-2 font-sans text-label-md text-on-surface-variant">
              Opciones
            </p>
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-sans text-body-sm text-on-surface-variant">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <Input
                    value={opt}
                    aria-label={`Opción ${String.fromCharCode(65 + i)}`}
                    onChange={(e) => {
                      const options = [...question.options];
                      options[i] = e.target.value;
                      updateQuestion(question.id, { options });
                    }}
                  />
                  <Button
                    variant="icon"
                    size="icon"
                    aria-label={`Quitar opción ${String.fromCharCode(65 + i)}`}
                    onClick={() =>
                      updateQuestion(question.id, {
                        options: question.options.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Icon name="close" size={20} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                updateQuestion(question.id, { options: [...question.options, ""] })
              }
            >
              <Icon name="add" size={20} />
              Agregar opción
            </Button>
          </div>
        )}

        <Field
          label={
            question.type === "multiple_choice" ? "Respuesta correcta" : "Respuesta esperada"
          }
          htmlFor={`expected-${question.id}`}
          hint={
            question.type === "multiple_choice"
              ? undefined
              : "Para preguntas abiertas no siempre hay una única respuesta: los criterios de abajo son los que usa la IA para evaluar."
          }
        >
          {question.type === "multiple_choice" ? (
            <Select
              id={`expected-${question.id}`}
              value={question.expected_answer}
              onChange={(e) =>
                updateQuestion(question.id, { expected_answer: e.target.value })
              }
            >
              <option value="">Sin definir</option>
              {question.options.map((opt, i) => (
                <option key={i} value={opt}>
                  {String.fromCharCode(65 + i)}. {opt}
                </option>
              ))}
            </Select>
          ) : (
            <Textarea
              id={`expected-${question.id}`}
              value={question.expected_answer}
              onChange={(e) =>
                updateQuestion(question.id, { expected_answer: e.target.value })
              }
              placeholder="Una fracción representa una parte de un todo dividido en partes iguales."
            />
          )}
        </Field>

        {/* §16 — criterios que se valoran con niveles de logro */}
        <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-sans text-label-md text-on-surface-variant">
                Criterios de corrección
              </p>
              <p className="font-sans text-body-sm text-on-surface-variant">
                La IA valora cada criterio por separado con AD, A, B o C; el docente lo revisa.
              </p>
            </div>
          </div>

          {question.rubric.length === 0 ? (
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">
              Sin criterios definidos todavía.
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {question.rubric.map((criterion, i) => (
                <li key={criterion.id} className="flex items-start gap-2">
                  <span className="mt-3 w-4 shrink-0 font-sans text-body-sm text-on-surface-variant">
                    {i + 1}.
                  </span>
                  <Input
                    value={criterion.description}
                    aria-label={`Descripción del criterio ${i + 1}`}
                    placeholder="Explica qué representa una fracción"
                    onChange={(e) =>
                      updateCriterion(question.id, criterion.id, {
                        description: e.target.value,
                      })
                    }
                  />
                  <Button
                    variant="icon"
                    size="icon"
                    className="mt-1"
                    aria-label={`Eliminar criterio ${i + 1}`}
                    onClick={() => deleteCriterion(question.id, criterion.id)}
                  >
                    <Icon name="delete" size={20} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Button variant="secondary" size="sm" onClick={() => addCriterion(question.id)}>
            <Icon name="add" size={20} />
            Agregar criterio
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar la pregunta {question.number}?</DialogTitle>
            <DialogDescription>
              Se eliminarán también las respuestas extraídas asociadas a esta pregunta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteQuestion(question.id);
                setConfirmOpen(false);
              }}
            >
              <Icon name="delete" size={20} />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
