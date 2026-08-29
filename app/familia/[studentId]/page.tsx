"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { VoicePlayer, formatSeconds } from "@/components/ui/voice-player";
import { CardSkeletonList } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/ui/level-badge";
import { useData } from "@/lib/data/provider";

function formatDate(iso: string) { return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }); }

/** El portal familiar solo muestra niveles confirmados por el docente. */
export default function FamiliaEstudiantePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { ready, studentProgress } = useData();
  if (!ready) return <><div className="mb-6 h-8 w-64 animate-pulse rounded bg-surface-container" /><CardSkeletonList /></>;
  const progress = studentProgress(studentId);
  if (!progress) return <Card><EmptyState icon="search_off" title="No encontramos a este estudiante" description="Revisa el código que te compartió el colegio." action={<Button asChild><Link href="/familia">Volver a ingresar</Link></Button>} /></Card>;
  const { student, evaluations, bySubject, overallLevel, trend, pendingCount } = progress;
  const withFeedback = evaluations.filter((evaluation) => evaluation.feedbackSentAt);
  return <>
    <Link href="/familia" className="mb-3 inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"><Icon name="arrow_back" size={20} />Salir</Link>
    <div className="mb-6"><h1 className="font-sans text-headline-md-mobile text-on-background md:text-headline-md">{student.name}</h1><p className="mt-1 font-sans text-body-sm text-on-surface-variant">{student.identifier}{student.guardian_name ? ` · Apoderado: ${student.guardian_name}` : ""}</p></div>
    {evaluations.length === 0 ? <Card><EmptyState icon="hourglass_top" title="Todavía no hay resultados confirmados" description={pendingCount > 0 ? "Su docente está corrigiendo las evidencias. Cuando confirme los niveles, aparecerán aquí." : "Cuando su docente confirme una evaluación, la verás en esta pantalla."} /></Card> : <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-gutter lg:grid-cols-4"><Card className="p-4 sm:p-6"><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Nivel predominante</p><div className="mt-2">{overallLevel ? <LevelBadge level={overallLevel} /> : "—"}</div></Card><Card className="p-4 sm:p-6"><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Evaluaciones</p><p className="mt-1 font-sans text-headline-md text-on-background">{evaluations.length}</p></Card><Card className="p-4 sm:p-6"><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Tendencia</p><p className="mt-1 font-sans text-body-md text-on-background">{trend === "sube" ? "En avance" : trend === "baja" ? "Requiere acompañamiento" : trend === "estable" ? "Se mantiene" : "Aún no comparable"}</p></Card><Card className="p-4 sm:p-6"><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Mensajes del docente</p><p className="mt-1 font-sans text-headline-md text-on-background">{withFeedback.length}</p></Card></div>
      {pendingCount > 0 && <p className="mb-6 flex items-start gap-2 rounded-lg border border-surface-border bg-surface-container-low p-4 font-sans text-body-sm text-on-surface-variant"><Icon name="info" size={20} />{pendingCount} evaluación{pendingCount === 1 ? "" : "es"} está{pendingCount === 1 ? "" : "n"} en corrección. Solo mostramos niveles revisados y confirmados.</p>}
      <h2 className="mb-3 font-sans text-headline-sm text-on-background">Cómo va por área</h2><div className="mb-8 grid gap-gutter md:grid-cols-2">{bySubject.map((subject) => <Card key={subject.subject} className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sans text-headline-sm text-on-background">{subject.subject}</h3><p className="mt-1 font-sans text-body-sm text-on-surface-variant">{subject.evaluations} evaluación{subject.evaluations === 1 ? "" : "es"} · {subject.competencies.join(", ")}</p></div><LevelBadge level={subject.level} /></div></Card>)}</div>
      <h2 className="mb-3 font-sans text-headline-sm text-on-background">Sus evaluaciones</h2><div className="space-y-gutter">{[...evaluations].reverse().map((evaluation) => <Card key={evaluation.submissionId} className="p-6"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sans text-headline-sm text-on-background">{evaluation.title}</h3><p className="mt-1 font-sans text-body-sm text-on-surface-variant">{evaluation.subject} · {formatDate(evaluation.date)}<br />{evaluation.competency}</p></div>{evaluation.levelConfirmed && evaluation.level ? <LevelBadge level={evaluation.level} /> : <span className="rounded-full border border-status-pending/20 bg-status-pending/10 px-3 py-1 font-sans text-label-md text-status-pending-text">En revisión</span>}</div>{evaluation.teacherFeedback || evaluation.voiceNote ? <div className="rounded-lg border border-surface-border bg-surface-container-low p-4"><p className="mb-2 flex items-center gap-1.5 font-sans text-label-md text-on-surface-variant"><Icon name="forum" size={20} />Conclusión descriptiva y recomendaciones</p>{evaluation.teacherFeedback && <p className="font-sans text-body-md text-on-background">{evaluation.teacherFeedback}</p>}{evaluation.voiceNote && <div className="mt-3"><p className="mb-2 flex items-center gap-1.5 font-sans text-body-sm text-on-surface-variant"><Icon name="mic" size={20} />Mensaje de voz · {formatSeconds(evaluation.voiceNote.duration_seconds)}</p><VoicePlayer note={evaluation.voiceNote} /></div>}</div> : <p className="font-sans text-body-sm text-on-surface-variant">Esta evaluación todavía no tiene un mensaje del docente.</p>}</Card>)}</div>
    </>}
  </>;
}
