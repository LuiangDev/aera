"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Textarea } from "@/components/ui/field";
import { ConfidenceBadge, isLowConfidence } from "@/components/ui/confidence";
import { AiSuggestedBadge, AiSuggestedValue, ConfirmedValue } from "@/components/ui/ai-value";
import { LevelBadge, LevelSelector } from "@/components/ui/level-badge";
import { useData, type GradingItem } from "@/lib/data/provider";

/** La IA propone el nivel; el docente revisa y confirma la valoración. */
export function GradingCard({ item }: { item: GradingItem }) {
  const { setTeacherLevel, setTeacherFeedback, approveGrading, setCriterionTeacherLevel } = useData();
  const { question, answer, grading } = item;
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState(grading?.teacher_level ?? grading?.ai_level ?? "A");
  const [feedback, setFeedback] = useState(grading?.teacher_feedback ?? grading?.ai_feedback ?? "");
  const isFinal = grading?.status === "FINAL";
  const effectiveLevel = grading?.teacher_level ?? grading?.ai_level;

  return <Card className="p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Pregunta {question.number}</p><h3 className="mt-1 font-sans text-headline-sm text-on-background">{question.text || "Pregunta sin enunciado"}</h3></div>
      {effectiveLevel && (isFinal ? <ConfirmedValue value={effectiveLevel} note="nivel confirmado" /> : <AiSuggestedValue value={effectiveLevel} label="Nivel sugerido por IA" />)}
    </div>

    <div className="mb-4 rounded-lg border border-surface-border bg-surface-container-low p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2"><p className="font-sans text-label-md text-on-surface-variant">Respuesta del estudiante</p>{answer && <ConfidenceBadge value={answer.confidence} />}</div>
      <p className="font-sans text-body-md text-on-background">{answer?.extracted_text || "No se extrajo texto para esta pregunta."}</p>
      {answer && isLowConfidence(answer.confidence) && <p className="mt-2 flex items-start gap-1.5 font-sans text-body-sm text-status-pending-text"><Icon name="priority_high" size={20} className="text-[18px]" />La lectura no es segura. Compárala con la hoja original antes de confirmar.</p>}
    </div>

    {!grading ? <p className="font-sans text-body-sm text-on-surface-variant">Esta entrega todavía no tiene corrección sugerida.</p> : <>
      <div className="mb-4"><div className="mb-2 flex items-center gap-2"><AiSuggestedBadge label="Evaluación de la IA" />{!isFinal && <span className="font-sans text-body-sm text-on-surface-variant">Revisa antes de aprobar</span>}</div><p className="font-sans text-body-md text-on-background">{grading.ai_feedback}</p>{grading.teacher_feedback && <p className="mt-3 rounded-lg border border-surface-border bg-surface-container-lowest p-3 font-sans text-body-md text-on-background"><span className="mr-1 font-sans text-label-sm uppercase tracking-wider text-secondary">Tu comentario:</span>{grading.teacher_feedback}</p>}</div>

      {question.rubric.length > 0 && <ul className="mb-4 divide-y divide-surface-border rounded-lg border border-surface-border">{question.rubric.map((criterion) => {
        const evaluation = grading.criterion_levels.find((entry) => entry.criterion_id === criterion.id);
        const value = evaluation?.teacher_level ?? evaluation?.ai_level ?? "A";
        return <li key={criterion.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="min-w-0 flex-1"><p className="font-sans text-body-md text-on-background">{criterion.description || "Criterio sin descripción"}</p>{evaluation?.comment && <p className="font-sans text-body-sm text-on-surface-variant">{evaluation.comment}</p>}</div><div className="flex items-center gap-2">{evaluation?.teacher_level == null && !isFinal && <AiSuggestedBadge label="IA" />}{isFinal ? <LevelBadge level={value} /> : <LevelSelector value={value} label={`Nivel del criterio: ${criterion.description}`} size="sm" onChange={(next) => setCriterionTeacherLevel(grading.id, criterion.id, next)} />}</div></li>;
      })}</ul>}

      {editing ? <div className="space-y-4 rounded-lg border border-surface-border bg-surface-container-low p-4"><Field label="Nivel de logro final" htmlFor={`level-${grading.id}`}><LevelSelector value={level} label="Nivel de logro final" onChange={setLevel} /></Field><Field label="Tu comentario para el estudiante" htmlFor={`feedback-${grading.id}`}><Textarea id={`feedback-${grading.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} /></Field><div className="flex flex-wrap gap-2"><Button size="sm" onClick={async () => { await setTeacherLevel(grading.id, level); await setTeacherFeedback(grading.id, feedback); await approveGrading(grading.id); setEditing(false); }}><Icon name="check_circle" size={20} />Guardar y confirmar</Button><Button size="sm" variant="secondary" onClick={async () => { await setTeacherLevel(grading.id, level); await setTeacherFeedback(grading.id, feedback); setEditing(false); }}>Guardar sin confirmar</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button></div></div> : <div className="flex flex-wrap items-center gap-2">{!isFinal && <Button size="sm" onClick={() => approveGrading(grading.id)}><Icon name="check" size={20} />Aprobar nivel {effectiveLevel}</Button>}<Button size="sm" variant={isFinal ? "ghost" : "secondary"} onClick={() => { setLevel(grading.teacher_level ?? grading.ai_level); setFeedback(grading.teacher_feedback ?? grading.ai_feedback); setEditing(true); }}><Icon name="edit" size={20} />{isFinal ? "Cambiar valoración" : "Editar"}</Button></div>}
    </>}
  </Card>;
}
