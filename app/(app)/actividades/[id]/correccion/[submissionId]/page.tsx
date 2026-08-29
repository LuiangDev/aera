"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { AiSuggestedValue, ConfirmedValue } from "@/components/ui/ai-value";
import { LevelSelector } from "@/components/ui/level-badge";
import { GradingCard } from "@/components/grading/grading-card";
import { FeedbackComposer } from "@/components/grading/feedback-composer";
import { SUBMISSION_PIPELINE_STEPS } from "@/lib/data/mock-ai";
import { useData } from "@/lib/data/provider";

/** Revisión de evidencias: el resultado de la competencia no es una suma numérica. */
export default function CorreccionPage() {
  const { id, submissionId } = useParams<{ id: string; submissionId: string }>();
  const { getActivity, submissionsOf, gradingItemsOf, approveAllGrading, startSubmissionProcessing, jobFor, setSubmissionLevel } = useData();
  const activity = getActivity(id);
  const submission = submissionsOf(id).find((entry) => entry.id === submissionId);
  const items = gradingItemsOf(submissionId);
  const job = jobFor(submissionId);
  if (!activity) return null;
  if (!submission) return <Card><EmptyState icon="search_off" title="No encontramos esta entrega" action={<Button asChild><Link href={`/actividades/${id}/respuestas`}>Volver a respuestas</Link></Button>} /></Card>;

  const allFinal = items.length > 0 && items.every((item) => item.grading?.status === "FINAL");
  const pending = items.filter((item) => item.grading && item.grading.status !== "FINAL").length;

  return <>
    <Link href={`/actividades/${id}/respuestas`} className="mb-4 inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"><Icon name="arrow_back" size={20} />Todas las entregas</Link>
    <Card className="mb-6"><CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-sans text-headline-sm text-on-background">{submission.student?.name ?? "Entrega sin asignar"}</h2><p className="mt-1 font-sans text-body-sm text-on-surface-variant">{submission.student?.identifier ? `${submission.student.identifier} · ` : ""}{submission.file_name}</p></div><div className="flex flex-col items-start gap-2 md:items-end">{submission.effectiveLevel && (allFinal ? <ConfirmedValue value={submission.effectiveLevel} note="nivel de la competencia" /> : <AiSuggestedValue value={submission.effectiveLevel} label="Nivel sugerido por IA" />)}{!allFinal && submission.suggestedLevel && <p className="font-sans text-body-sm text-on-surface-variant">La IA propuso el nivel {submission.suggestedLevel}. Revísalo con las evidencias antes de confirmarlo.</p>}<LevelSelector value={submission.teacher_level ?? submission.effectiveLevel} label="Nivel de la competencia" size="sm" onChange={(level) => setSubmissionLevel(submission.id, level)} /></div></CardContent></Card>
    {job?.status === "running" ? <Card><CardContent className="space-y-4"><h3 className="font-sans text-headline-sm text-on-background">Corrigiendo la entrega…</h3><ProgressSteps steps={SUBMISSION_PIPELINE_STEPS} current={job.current} /></CardContent></Card> : items.every((item) => !item.grading) ? <Card><EmptyState icon="auto_awesome" title="Esta entrega todavía no se ha corregido" description="Procesa la entrega para que la IA proponga una valoración por criterios." action={<Button onClick={() => startSubmissionProcessing(submissionId)}><Icon name="auto_awesome" size={20} />Procesar y corregir</Button>} /></Card> : <><div className="mb-6 flex flex-wrap items-center gap-3"><Button disabled={pending === 0} onClick={async () => { await approveAllGrading(submissionId); toast.success("Valoración confirmada."); }}><Icon name="check_circle" size={20} />Aprobar toda la evidencia</Button>{pending > 0 ? <span className="font-sans text-body-sm text-on-surface-variant">{pending} pregunta{pending === 1 ? "" : "s"} sin confirmar.</span> : <Button asChild variant="secondary"><Link href={`/actividades/${id}/resultados/${submission.student_id}`}><Icon name="print" size={20} />Ver resultado para entregar</Link></Button>}</div><div className="space-y-gutter">{items.map((item) => <GradingCard key={item.question.id} item={item} />)}</div><div className="mt-gutter"><FeedbackComposer submission={submission} /></div></>}
  </>;
}
