"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { SUBMISSION_PIPELINE_STEPS } from "@/lib/data/mock-ai";
import { answerStatusToBadge } from "@/lib/data/derive";
import { useData, type SubmissionWithMeta } from "@/lib/data/provider";

/**
 * §17 — carga de respuestas de estudiantes, individual y en lote (§11).
 * La asignación archivo → estudiante es MANUAL ASISTIDA: el MVP no intenta reconocer
 * automáticamente de quién es cada hoja.
 */
export default function RespuestasPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getActivity,
    questionsOf,
    submissionsOf,
    students,
    createSubmissions,
    assignSubmissionStudent,
    deleteSubmission,
    startSubmissionProcessing,
    jobFor,
  } = useData();

  const activity = getActivity(id);
  const questions = questionsOf(id);
  const submissions = submissionsOf(id);
  if (!activity) return null;

  const unassigned = submissions.filter((s) => !s.student);
  const readyToProcess = submissions.filter((s) => s.student && s.status === "PENDING");

  const badgeFor = (s: SubmissionWithMeta) => {
    if (s.isFinal) return <StatusBadge kind="corregido" />;
    if (s.isGraded)
      return <StatusBadge kind={answerStatusToBadge(s.answerStatuses[0] ?? "PENDING")} />;
    if (s.status === "PROCESSING")
      return <StatusBadge kind="revision" label="Procesando" />;
    return <StatusBadge kind="pendiente" label="Sin procesar" />;
  };

  const actionFor = (s: SubmissionWithMeta) => {
    const job = jobFor(s.id);
    if (job?.status === "running") {
      return (
        <span className="inline-flex items-center gap-2 font-sans text-body-sm text-primary-container">
          <Icon name="progress_activity" size={20} className="animate-spin" />
          Paso {job.current} de {job.steps.length}
        </span>
      );
    }
    if (s.isGraded) {
      return (
        <Button asChild size="xs" variant="secondary">
          <Link href={`/actividades/${id}/correccion/${s.id}`}>
            {s.isFinal ? "Ver corrección" : "Revisar corrección"}
            <Icon name="arrow_forward" size={20} className="text-[18px]" />
          </Link>
        </Button>
      );
    }
    return (
      <Button
        size="xs"
        disabled={!s.student || questions.length === 0}
        onClick={() => startSubmissionProcessing(s.id)}
      >
        <Icon name="auto_awesome" size={20} className="text-[18px]" />
        Procesar y corregir
      </Button>
    );
  };

  return (
    <>
      {questions.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-status-pending/20 bg-status-pending/10 p-4">
          <Icon name="priority_high" size={20} className="text-status-pending-text" />
          <span className="font-sans text-body-sm text-status-pending-text">
            Define las preguntas antes de corregir: la IA necesita saber contra qué evaluar.
          </span>
          <Button asChild size="xs" variant="secondary">
            <Link href={`/actividades/${id}/preguntas`}>Ir a preguntas</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-gutter xl:grid-cols-3">
        <div className="space-y-gutter xl:col-span-2">
          <FileDropzone
            multiple
            title="Sube las respuestas de tus estudiantes"
            description="Selecciona varios archivos a la vez, o un PDF con varias entregas. Después asignas cada archivo a su estudiante."
            onFiles={async (files) => {
              const created = await createSubmissions(id, files);
              toast.success(
                `${created.length} archivo${created.length === 1 ? "" : "s"} recibido${
                  created.length === 1 ? "" : "s"
                }. Asigna cada uno a su estudiante.`,
              );
            }}
          />

          {submissions.length === 0 ? (
            <Card>
              <EmptyState
                icon="assignment"
                title="Sin entregas todavía"
                description="Cuando subas las hojas de respuestas aparecerán aquí para que las asignes y las corrijas."
              />
            </Card>
          ) : (
            <>
              {/* Desktop: tabla de gestión (§8.3) */}
              <div className="hidden md:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Archivo</TH>
                      <TH>Estudiante</TH>
                      <TH>Estado</TH>
                      <TH className="text-right">Acción</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {submissions.map((s) => (
                      <TR key={s.id}>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Icon
                              name={
                                /\.pdf$/i.test(s.file_name) ? "picture_as_pdf" : "image"
                              }
                              size={20}
                              className="text-on-surface-variant"
                            />
                            <span className="font-sans text-body-sm">{s.file_name}</span>
                          </div>
                        </TD>
                        <TD>
                          <Select
                            aria-label={`Estudiante de ${s.file_name}`}
                            className="min-w-[200px] py-2"
                            value={s.student_id}
                            onChange={(e) =>
                              assignSubmissionStudent(s.id, e.target.value)
                            }
                          >
                            <option value="">Sin asignar</option>
                            {students.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} · {st.identifier}
                              </option>
                            ))}
                          </Select>
                        </TD>
                        <TD>{badgeFor(s)}</TD>
                        <TD>
                          <div className="flex items-center justify-end gap-2">
                            {actionFor(s)}
                            <Button
                              variant="icon"
                              size="icon"
                              aria-label={`Eliminar ${s.file_name}`}
                              onClick={() => deleteSubmission(s.id)}
                            >
                              <Icon name="delete" size={20} />
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>

              {/* Mobile: la fila se convierte en tarjeta apilada (§4) */}
              <div className="space-y-3 md:hidden">
                {submissions.map((s) => (
                  <Card key={s.id} className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate font-sans text-body-md text-on-background">
                        {s.file_name}
                      </p>
                      {badgeFor(s)}
                    </div>
                    <Select
                      aria-label={`Estudiante de ${s.file_name}`}
                      className="mb-3 py-2"
                      value={s.student_id}
                      onChange={(e) => assignSubmissionStudent(s.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} · {st.identifier}
                        </option>
                      ))}
                    </Select>
                    <div className="flex items-center justify-between gap-2">
                      {actionFor(s)}
                      <Button
                        variant="icon"
                        size="icon"
                        aria-label={`Eliminar ${s.file_name}`}
                        onClick={() => deleteSubmission(s.id)}
                      >
                        <Icon name="delete" size={20} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-gutter">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-sans text-headline-sm text-on-background">
                Asignación y proceso
              </h2>
              <ul className="space-y-2 font-sans text-body-sm text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <Icon name="folder" size={20} />
                  {submissions.length} archivo{submissions.length === 1 ? "" : "s"} cargado
                  {submissions.length === 1 ? "" : "s"}
                </li>
                <li className="flex items-center gap-2">
                  <Icon
                    name={unassigned.length ? "priority_high" : "check_circle"}
                    size={20}
                    className={
                      unassigned.length
                        ? "text-status-pending-text"
                        : "text-status-corrected-text"
                    }
                  />
                  {unassigned.length
                    ? `${unassigned.length} sin asignar`
                    : "Todos asignados"}
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="group" size={20} />
                  {students.length} estudiante{students.length === 1 ? "" : "s"} en tu lista
                </li>
              </ul>

              <Button
                className="w-full"
                disabled={readyToProcess.length === 0 || questions.length === 0}
                onClick={() => {
                  readyToProcess.forEach((s) => startSubmissionProcessing(s.id));
                  toast.success(
                    `Procesando ${readyToProcess.length} entrega${
                      readyToProcess.length === 1 ? "" : "s"
                    }.`,
                  );
                }}
              >
                <Icon name="auto_awesome" size={20} />
                Procesar {readyToProcess.length || ""} asignadas
              </Button>

              {students.length === 0 && (
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/estudiantes">
                    <Icon name="group_add" size={20} />
                    Registrar estudiantes
                  </Link>
                </Button>
              )}

              <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
                <p className="font-sans text-label-sm text-on-surface-variant">
                  Reconocer automáticamente de quién es cada hoja es un problema aparte y
                  queda fuera del MVP: aquí la asignación la haces tú.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="font-sans text-headline-sm text-on-background">
                Qué hace el sistema
              </h2>
              <ProgressSteps steps={SUBMISSION_PIPELINE_STEPS} current={-1} />
              <p className="font-sans text-label-sm text-on-surface-variant">
                Cada entrega recorre estos pasos. La corrección que produce es una
                sugerencia: tú decides el nivel de logro final.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
