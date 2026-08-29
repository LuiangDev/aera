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
import { LevelBadge } from "@/components/ui/level-badge";
import { answerStatusToBadge } from "@/lib/data/derive";
import { useData, type ResultRow } from "@/lib/data/provider";

export default function ResultadosPage() {
  const { id } = useParams<{ id: string }>();
  const { getActivity, resultsOf } = useData();
  const activity = getActivity(id);
  const rows = resultsOf(id);
  if (!activity) return null;
  const levelCell = (row: ResultRow) => {
    if (row.status === "SIN_ENTREGA") return <span className="text-on-surface-variant">Sin entrega</span>;
    if (row.finalLevel) return <LevelBadge level={row.finalLevel} />;
    if (row.suggestedLevel) return <span className="inline-flex items-center gap-2"><LevelBadge level={row.suggestedLevel} /><AiSuggestedBadge label="Sin confirmar" /></span>;
    return <span className="text-on-surface-variant">En proceso</span>;
  };
  if (!rows.length) return <Card><EmptyState icon="assignment" title="Todavía no hay entregas" description="Cuando subas respuestas de estudiantes, sus niveles de logro aparecerán aquí." action={<Button asChild><Link href={`/actividades/${id}/respuestas`}><Icon name="upload_file" size={20} />Subir respuestas</Link></Button>} /></Card>;
  return <>
    <Card className="mb-6"><CardContent><p className="font-sans text-label-sm uppercase tracking-wider text-secondary">Competencia evaluada</p><h2 className="mt-1 font-sans text-headline-sm text-on-background">{activity.competency}</h2><p className="mt-2 font-sans text-body-sm text-on-surface-variant">Los niveles de logro se basan en evidencias y criterios; no se promedian ni se convierten a notas numéricas.</p></CardContent></Card>
    <Card className="hidden overflow-hidden md:block"><Table><THead><TR><TH>Estudiante</TH><TH>Nivel de logro</TH><TH>Estado</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead><TBody>{rows.map((row) => <TR key={row.student.id}><TD><div className="font-sans text-body-md text-on-background">{row.student.name}</div><div className="font-sans text-body-sm text-on-surface-variant">{row.student.identifier}</div></TD><TD>{levelCell(row)}</TD><TD>{row.status === "SIN_ENTREGA" ? <StatusBadge kind="pendiente" label="Sin entrega" /> : <StatusBadge kind={answerStatusToBadge(row.status)} />}</TD><TD>{row.submission && <Button asChild variant="ghost" size="sm"><Link href={`/actividades/${id}/correccion/${row.submission.id}`}>Revisar<Icon name="arrow_forward" size={20} /></Link></Button>}</TD></TR>)}</TBody></Table></Card>
    <div className="space-y-3 md:hidden">{rows.map((row) => <Card key={row.student.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-sans text-body-md text-on-background">{row.student.name}</p><p className="font-sans text-body-sm text-on-surface-variant">{row.student.identifier}</p></div>{levelCell(row)}</div><div className="mt-3 flex items-center justify-between">{row.status === "SIN_ENTREGA" ? <StatusBadge kind="pendiente" label="Sin entrega" /> : <StatusBadge kind={answerStatusToBadge(row.status)} />}{row.submission && <Button asChild variant="ghost" size="sm"><Link href={`/actividades/${id}/correccion/${row.submission.id}`}>Revisar</Link></Button>}</div></Card>)}</div>
  </>;
}
