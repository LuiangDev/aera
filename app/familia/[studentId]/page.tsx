"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-steps";
import { VoicePlayer, formatSeconds } from "@/components/ui/voice-player";
import { CardSkeletonList } from "@/components/ui/skeleton";
import { useData, type SubjectProgress } from "@/lib/data/provider";

/**
 * Avance del estudiante para su apoderado.
 *
 * REGLA DE CONFIANZA (§19, §31): aquí solo aparecen notas que el docente YA confirmó y
 * retroalimentación que YA envió. Nada sugerido por la IA sin confirmar sale de la
 * pantalla del docente — la familia nunca ve una nota provisional.
 *
 * No hay componente de gráfico en DESIGN_SYSTEM.md: el avance se muestra con las barras
 * de §8.8 y texto, sin introducir una librería de charts ni colores nuevos.
 */

const LEVEL_STYLES: Record<
  SubjectProgress["level"],
  { chip: string; bar: string; icon: string; hint: string }
> = {
  sólido: {
    chip: "bg-status-corrected/10 text-status-corrected-text border-status-corrected/20",
    bar: "bg-status-corrected-text",
    icon: "trending_up",
    hint: "Va bien: mantiene el nivel en este curso.",
  },
  "en proceso": {
    chip: "bg-surface-container text-on-surface-variant border-outline-variant/60",
    bar: "bg-primary-container",
    icon: "trending_flat",
    hint: "Avanza, pero todavía hay margen para afianzar.",
  },
  "a reforzar": {
    chip: "bg-status-pending/10 text-status-pending-text border-status-pending/20",
    bar: "bg-status-pending-text",
    icon: "trending_down",
    hint: "Conviene acompañarlo en este curso.",
  },
};

const TREND_COPY = {
  sube: { icon: "trending_up", text: "Sus resultados vienen mejorando." },
  baja: { icon: "trending_down", text: "Sus últimos resultados bajaron." },
  estable: { icon: "trending_flat", text: "Se mantiene estable." },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function FamiliaEstudiantePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { ready, studentProgress } = useData();

  if (!ready) {
    return (
      <>
        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-surface-container" />
        <CardSkeletonList />
      </>
    );
  }

  const progress = studentProgress(studentId);

  if (!progress) {
    return (
      <Card>
        <EmptyState
          icon="search_off"
          title="No encontramos a este estudiante"
          description="Revisa el código que te compartió el colegio."
          action={
            <Button asChild>
              <Link href="/familia">Volver a ingresar</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const { student, evaluations, bySubject, overallPercent, trend, pendingCount } =
    progress;
  const conRetroalimentacion = evaluations.filter((e) => e.feedbackSentAt);

  return (
    <>
      <Link
        href="/familia"
        className="mb-3 inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"
      >
        <Icon name="arrow_back" size={20} />
        Salir
      </Link>

      <div className="mb-6">
        <h1 className="font-sans text-headline-md-mobile text-on-background md:text-headline-md">
          {student.name}
        </h1>
        <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
          {student.identifier}
          {student.guardian_name ? ` · Apoderado: ${student.guardian_name}` : ""}
        </p>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <EmptyState
            icon="hourglass_top"
            title="Todavía no hay resultados confirmados"
            description={
              pendingCount > 0
                ? "Su docente está corrigiendo las evaluaciones. Cuando confirme las notas, aparecerán aquí."
                : "Cuando su docente registre y confirme una evaluación, la verás en esta pantalla."
            }
          />
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-gutter lg:grid-cols-4">
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Promedio general
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {overallPercent}%
              </p>
            </Card>
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Evaluaciones
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {evaluations.length}
              </p>
            </Card>
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Tendencia
              </p>
              {trend ? (
                <p className="mt-1 flex items-center gap-1.5 font-sans text-body-md text-on-background">
                  <Icon name={TREND_COPY[trend].icon} size={20} />
                  {TREND_COPY[trend].text}
                </p>
              ) : (
                <p className="mt-1 font-sans text-body-md text-on-surface-variant">
                  Necesita más evaluaciones para comparar.
                </p>
              )}
            </Card>
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Mensajes del docente
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {conRetroalimentacion.length}
              </p>
            </Card>
          </div>

          {pendingCount > 0 && (
            <p className="mb-6 flex items-start gap-2 rounded-lg border border-surface-border bg-surface-container-low p-4 font-sans text-body-sm text-on-surface-variant">
              <Icon name="info" size={20} />
              {pendingCount} evaluación{pendingCount === 1 ? "" : "es"} está
              {pendingCount === 1 ? "" : "n"} en corrección. Solo mostramos notas que el
              docente ya revisó y confirmó.
            </p>
          )}

          {/* Cómo va por curso */}
          <h2 className="mb-3 font-sans text-headline-sm text-on-background">
            Cómo va por curso
          </h2>
          <div className="mb-8 grid gap-gutter md:grid-cols-2">
            {bySubject.map((subject) => {
              const style = LEVEL_STYLES[subject.level];
              return (
                <Card key={subject.subject} className="p-6">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-sans text-headline-sm text-on-background">
                        {subject.subject}
                      </h3>
                      <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                        {subject.evaluations} evaluación
                        {subject.evaluations === 1 ? "" : "es"} · promedio{" "}
                        {subject.average} / {subject.maxScore}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 font-sans text-label-md",
                        style.chip,
                      )}
                    >
                      <Icon name={style.icon} size={20} />
                      {subject.level}
                    </span>
                  </div>

                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
                    role="progressbar"
                    aria-valuenow={subject.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Promedio en ${subject.subject}`}
                  >
                    <div
                      className={cn("h-1.5 rounded-full", style.bar)}
                      style={{ width: `${subject.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 font-sans text-body-sm text-on-surface-variant">
                    {subject.percent}% · {style.hint}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Evaluaciones y retroalimentación */}
          <h2 className="mb-3 font-sans text-headline-sm text-on-background">
            Sus evaluaciones
          </h2>
          <div className="space-y-gutter">
            {[...evaluations].reverse().map((evaluation) => (
              <Card key={evaluation.submissionId} className="p-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-sans text-headline-sm text-on-background">
                      {evaluation.title}
                    </h3>
                    <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                      {evaluation.subject} · {formatDate(evaluation.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    {evaluation.scoreConfirmed ? (
                      <>
                        <p className="font-sans text-headline-md text-on-background">
                          {evaluation.score}
                          <span className="font-sans text-body-md text-on-surface-variant">
                            {" "}
                            / {evaluation.maxScore}
                          </span>
                        </p>
                        <p className="font-sans text-label-sm text-on-surface-variant">
                          {evaluation.percent}%
                        </p>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-status-pending/20 bg-status-pending/10 px-3 py-1 font-sans text-label-md text-status-pending-text">
                        <Icon name="schedule" size={20} />
                        Nota en revisión
                      </span>
                    )}
                  </div>
                </div>

                {evaluation.scoreConfirmed && evaluation.percent !== null ? (
                  <ProgressBar
                    value={evaluation.percent}
                    max={100}
                    label={`Resultado en ${evaluation.title}`}
                    className="mb-4"
                  />
                ) : (
                  <p className="mb-4 font-sans text-body-sm text-on-surface-variant">
                    Su docente todavía está revisando esta evaluación. La nota aparecerá
                    cuando la confirme.
                  </p>
                )}

                {evaluation.teacherFeedback || evaluation.voiceNote ? (
                  <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
                    <p className="mb-2 flex items-center gap-1.5 font-sans text-label-md text-on-surface-variant">
                      <Icon name="forum" size={20} />
                      Mensaje del docente
                    </p>
                    {evaluation.teacherFeedback && (
                      <p className="font-sans text-body-md text-on-background">
                        {evaluation.teacherFeedback}
                      </p>
                    )}
                    {evaluation.voiceNote && (
                      <div className="mt-3">
                        <p className="mb-2 flex items-center gap-1.5 font-sans text-body-sm text-on-surface-variant">
                          <Icon name="mic" size={20} className="text-[18px]" />
                          Mensaje de voz ·{" "}
                          {formatSeconds(evaluation.voiceNote.duration_seconds)}
                        </p>
                        <VoicePlayer note={evaluation.voiceNote} />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-sans text-body-sm text-on-surface-variant">
                    Esta evaluación todavía no tiene un mensaje del docente.
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
