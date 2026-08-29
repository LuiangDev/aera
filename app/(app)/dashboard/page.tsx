"use client";

import Link from "next/link";
import { Fab, PageHeader } from "@/components/layout/app-shell";
import { ActivityCard } from "@/components/activity/activity-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeletonList } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useData } from "@/lib/data/provider";

export default function DashboardPage() {
  const { ready, teacher, activities } = useData();

  const totalCorregidos = activities.reduce((acc, a) => acc + a.correctedCount, 0);
  const totalPendientes = activities.reduce(
    (acc, a) => acc + Math.max(a.studentCount - a.correctedCount, 0),
    0,
  );

  return (
    <>
      <PageHeader
        title={`Hola, ${teacher?.name?.split(" ")[0] ?? "docente"} 👋`}
        description="Tus actividades y el estado de sus correcciones."
        actions={
          <Button asChild className="hidden md:inline-flex">
            <Link href="/actividades/nueva">
              <Icon name="add" size={20} />
              Nueva actividad
            </Link>
          </Button>
        }
      />

      {!ready ? (
        <CardSkeletonList />
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState
            icon="description"
            title="Todavía no tienes actividades"
            description="Crea tu primera actividad y sube la evaluación que ya tienes lista — en papel o en PDF."
            action={
              <Button asChild>
                <Link href="/actividades/nueva">
                  <Icon name="add" size={20} />
                  Crear mi primera actividad
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-gutter">
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Actividades
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {activities.length}
              </p>
            </Card>
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Entregas corregidas
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {totalCorregidos}
              </p>
            </Card>
            <Card className="p-4 sm:p-6">
              <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                Por revisar
              </p>
              <p className="mt-1 font-sans text-headline-md text-on-background">
                {totalPendientes}
              </p>
            </Card>
          </div>

          <h2 className="mb-3 font-sans text-headline-sm text-on-background">
            Mis actividades
          </h2>
          <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </>
      )}

      <Fab href="/actividades/nueva" label="Nueva actividad" />
    </>
  );
}
