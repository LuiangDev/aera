import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-steps";
import {
  ACTIVITY_STATUS_LABELS,
  activityStatusToBadge,
} from "@/lib/data/derive";
import type { ActivityWithStats } from "@/lib/data/provider";

/**
 * Tarjeta de actividad del dashboard (§9).
 * El estado que se muestra es el DERIVADO (§22): borrador / en corrección / completada,
 * mapeado al badge visual correspondiente (§2.4).
 */
export function ActivityCard({ activity }: { activity: ActivityWithStats }) {
  const completed = activity.status === "completada";
  const href = completed
    ? `/actividades/${activity.id}/resultados`
    : `/actividades/${activity.id}`;

  return (
    <Card interactive className="flex flex-col p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-sans text-headline-sm text-on-background">
            {activity.title}
          </h3>
          <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
            {activity.subject}
          </p>
        </div>
        <StatusBadge
          kind={activityStatusToBadge(activity.status)}
          label={ACTIVITY_STATUS_LABELS[activity.status]}
        />
      </div>

      <p className="mb-4 font-sans text-body-sm text-on-surface-variant">
        {activity.studentCount} estudiante{activity.studentCount === 1 ? "" : "s"} ·{" "}
        {activity.correctedCount} corregido{activity.correctedCount === 1 ? "" : "s"} ·{" "}
        {activity.questionCount} pregunta{activity.questionCount === 1 ? "" : "s"}
      </p>

      <ProgressBar
        value={activity.correctedCount}
        max={Math.max(activity.studentCount, 1)}
        label={`Progreso de corrección de ${activity.title}`}
        className="mb-4"
      />

      {activity.lowConfidenceCount > 0 && (
        <p className="mb-4 inline-flex items-center gap-1.5 font-sans text-body-sm text-status-pending-text">
          <Icon name="priority_high" size={20} className="text-[18px]" />
          {activity.lowConfidenceCount} pregunta
          {activity.lowConfidenceCount === 1 ? "" : "s"} con confianza baja por revisar
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={href}>
            {completed ? "Ver resultados" : "Continuar"}
            <Icon name="arrow_forward" size={20} />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
