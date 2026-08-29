"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AiSuggestedBadge } from "@/components/ui/ai-value";
import { answerStatusToBadge } from "@/lib/data/derive";
import { useData, type ResultRow } from "@/lib/data/provider";

/** §21 — resultados de la actividad. */
export default function ResultadosPage() {
  const { id } = useParams<{ id: string }>();
  const { getActivity, resultsOf, submissionsOf } = useData();

  const activity = getActivity(id);
  const rows = resultsOf(id);
  const submissions = submissionsOf(id);
  if (!activity) return null;

  const finales = rows.filter((r) => r.status === "FINAL" && r.finalTotal != null);
  const promedio =
    finales.length > 0
      ? finales.reduce((acc, r) => acc + (r.finalTotal ?? 0), 0) / finales.length
      : null;
  const maxTotal = rows[0]?.maxTotal ?? activity.max_score;

  const scoreCell = (row: ResultRow) => {
    if (row.finalTotal == null)
      return <span className="text-on-surface-variant">—</span>;
    if (row.status === "FINAL")
      return (
        <span className="inline-flex items-center gap-1.5">
          <Icon
            name="check_circle"
            size={20}
            filled
            className="text-status-corrected-text"
          />
          <span className="font-sans text-body-md text-on-background">
            {row.finalTotal} / {row.maxTotal}
          </span>
        </span>
      );
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <AiSuggestedBadge label="Sugerido" />
        <span className="font-sans text-body-md text-on-background">
          {row.aiTotal} / {row.maxTotal}
        </span>
      </span>
    );
  };

  const statusCell = (row: ResultRow) =>
    row.status === "SIN_ENTREGA" ? (
      <StatusBadge kind="pendiente" label="Sin entrega" />
    ) : (
      <StatusBadge kind={answerStatusToBadge(row.status)} />
    );

  const actionCell = (row: ResultRow) => {
    const submission = submissions.find((s) => s.student_id === row.student.id);
    if (!submission)
      return (
        <Button asChild size="xs" variant="ghost">
          <Link href={`/actividades/${id}/respuestas`}>Subir entrega</Link>
        </Button>
      );
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild size="xs" variant="secondary">
          <Link href={`/actividades/${id}/correccion/${submission.id}`}>
            {row.status === "FINAL" ? "Ver" : "Revisar"}
          </Link>
        </Button>
        {row.status === "FINAL" && (
          <Button asChild size="xs" variant="ghost">
            <Link href={`/actividades/${id}/resultados/${row.student.id}`}>
              <Icon name="download" size={20} className="text-[18px]" />
              Exportar
            </Link>
          </Button>
        )}
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="grade"
          title="Todavía no hay resultados"
          description="Cuando subas y corrijas las respuestas de tus estudiantes, sus notas aparecerán aquí."
          action={
            <Button asChild>
              <Link href={`/actividades/${id}/respuestas`}>
                <Icon name="upload_file" size={20} />
                Subir respuestas
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-gutter">
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Estudiantes
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {rows.length}
          </p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Promedio (solo notas finales)
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {promedio == null ? "—" : `${promedio.toFixed(1)} / ${maxTotal}`}
          </p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="font-sans text-label-sm uppercase tracking-wider text-secondary">
            Confirmadas
          </p>
          <p className="mt-1 font-sans text-headline-md text-on-background">
            {finales.length} / {rows.length}
          </p>
        </Card>
      </div>

      {/* Desktop: tabla (§8.3) */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR>
              <TH>Estudiante</TH>
              <TH>Calificación</TH>
              <TH>Estado</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.student.id}>
                <TD>
                  <span className="font-sans text-body-md font-semibold text-on-background">
                    {row.student.name}
                  </span>
                  <span className="ml-2 font-sans text-label-sm text-on-surface-variant">
                    {row.student.identifier}
                  </span>
                </TD>
                <TD>{scoreCell(row)}</TD>
                <TD>{statusCell(row)}</TD>
                <TD>{actionCell(row)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Mobile: tarjetas apiladas (§4) */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.student.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-sans text-body-md font-semibold text-on-background">
                    {row.student.name}
                  </p>
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    {row.student.identifier}
                  </p>
                </div>
                {statusCell(row)}
              </div>
              {scoreCell(row)}
              <div>{actionCell(row)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
