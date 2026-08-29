"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { RowSkeletonList } from "@/components/ui/skeleton";
import {
  ACTIVITY_STATUS_LABELS,
  activityStatusToBadge,
} from "@/lib/data/derive";
import { useData } from "@/lib/data/provider";

/**
 * Contenedor de una actividad: cabecera con el estado derivado (§22) y navegación por
 * pasos del flujo principal (§8). El docente siempre debe saber en qué paso está (§30).
 */
const STEPS = [
  { slug: "", label: "Resumen", icon: "overview" },
  { slug: "documento", label: "Documento", icon: "document_scanner" },
  { slug: "preguntas", label: "Preguntas", icon: "quiz" },
  { slug: "respuestas", label: "Respuestas", icon: "assignment" },
  { slug: "resultados", label: "Resultados", icon: "grade" },
];

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { ready, getActivity } = useData();
  const activity = getActivity(params.id);

  if (!ready) {
    return (
      <>
        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-surface-container" />
        <RowSkeletonList />
      </>
    );
  }

  if (!activity) {
    return (
      <Card>
        <EmptyState
          icon="search_off"
          title="No encontramos esta actividad"
          description="Puede que se haya eliminado o que el enlace ya no sea válido."
          action={
            <Button asChild>
              <Link href="/dashboard">Volver al dashboard</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const base = `/actividades/${activity.id}`;

  return (
    <>
      <Link
        href="/dashboard"
        className="mb-2 inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"
      >
        <Icon name="arrow_back" size={20} />
        Dashboard
      </Link>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-headline-md-mobile text-on-background md:text-headline-md">
            {activity.title}
          </h1>
          <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
            {activity.subject}
            {activity.description ? ` · ${activity.description}` : ""}
          </p>
        </div>
        <StatusBadge
          kind={activityStatusToBadge(activity.status)}
          label={ACTIVITY_STATUS_LABELS[activity.status]}
        />
      </div>

      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b border-surface-border pb-px"
        aria-label="Pasos de la actividad"
      >
        {STEPS.map((step) => {
          const href = step.slug ? `${base}/${step.slug}` : base;
          const active =
            step.slug === ""
              ? pathname === base
              : pathname.startsWith(`${base}/${step.slug}`);
          return (
            <Link
              key={step.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-sans text-body-sm transition-colors",
                active
                  ? "border-primary-container text-primary-container"
                  : "border-transparent text-on-surface-variant hover:text-on-background",
              )}
            >
              <Icon name={step.icon} size={20} filled={active} />
              {step.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </>
  );
}
