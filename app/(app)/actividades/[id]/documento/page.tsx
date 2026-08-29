"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { FileDropzone, FileList } from "@/components/upload/file-dropzone";
import { ACTIVITY_PIPELINE_STEPS } from "@/lib/data/mock-ai";
import { useData } from "@/lib/data/provider";

/**
 * §11 — carga o escaneo de la actividad, y §26 — procesamiento asíncrono.
 * El avance se muestra con el componente de progreso por pasos de §8.10 (regla §10.10:
 * nunca un spinner genérico). En el backend real, cada paso llega por Supabase Realtime
 * sobre el `status` de la actividad.
 */
export default function DocumentoPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getActivity,
    questionsOf,
    attachSourceFiles,
    startActivityProcessing,
    updateActivity,
    jobFor,
  } = useData();

  const activity = getActivity(id);
  const questions = questionsOf(id);
  const job = jobFor(id);
  if (!activity) return null;

  const processing = job?.status === "running";
  const hasFiles = activity.source_files.length > 0;

  return (
    <div className="grid gap-gutter lg:grid-cols-3">
      <div className="lg:col-span-2">
        {!hasFiles ? (
          <FileDropzone
            onFiles={async (files) => {
              await attachSourceFiles(id, files);
              toast.success("Archivo recibido.");
            }}
          />
        ) : (
          <Card>
            <CardContent className="space-y-5">
              <div>
                <h2 className="font-sans text-headline-sm text-on-background">
                  Documento de la actividad
                </h2>
                <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
                  El archivo original se conserva siempre: puedes volver a él para
                  comparar cualquier extracción con la hoja real.
                </p>
              </div>

              <FileList
                files={activity.source_files.map((f) => ({
                  id: f.id,
                  name: f.file_name,
                  size: f.size_bytes,
                  pages: f.page_count,
                }))}
                onRemove={
                  processing
                    ? undefined
                    : async (fileId) => {
                        await updateActivity(id, {
                          source_files: activity.source_files.filter(
                            (f) => f.id !== fileId,
                          ),
                        });
                        toast.success("Archivo quitado.");
                      }
                }
              />

              <FileDropzone
                multiple
                title="Agregar más páginas"
                description="Un PDF de varias páginas se procesa como un solo documento, no como documentos separados."
                onFiles={async (files) => {
                  await attachSourceFiles(id, files);
                  toast.success("Páginas agregadas.");
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <Card>
          <CardContent className="space-y-5">
            <h2 className="font-sans text-headline-sm text-on-background">
              Procesamiento
            </h2>

            {processing ? (
              <>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  Procesando actividad… puedes seguir navegando, te avisamos al terminar.
                </p>
                <ProgressSteps
                  steps={ACTIVITY_PIPELINE_STEPS}
                  current={job?.current ?? 0}
                />
              </>
            ) : questions.length > 0 ? (
              <>
                <ProgressSteps
                  steps={ACTIVITY_PIPELINE_STEPS}
                  current={ACTIVITY_PIPELINE_STEPS.length}
                />
                <p className="font-sans text-body-sm text-on-surface-variant">
                  La IA identificó {questions.length} preguntas. Revísalas antes de
                  definir criterios: lo que detectó es una sugerencia, no un resultado
                  final.
                </p>
                <Button asChild className="w-full">
                  <Link href={`/actividades/${id}/preguntas`}>
                    Revisar actividad
                    <Icon name="arrow_forward" size={20} />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  Cuando el documento esté completo, iniciamos la extracción de preguntas.
                </p>
                <Button
                  className="w-full"
                  disabled={!hasFiles}
                  onClick={() => startActivityProcessing(id)}
                >
                  <Icon name="auto_awesome" size={20} />
                  Procesar actividad
                </Button>
                {!hasFiles && (
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    Primero sube o escanea al menos un archivo.
                  </p>
                )}
              </>
            )}

            <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
              <p className="font-sans text-label-sm text-on-surface-variant">
                Maqueta de front: la extracción está simulada. El pipeline real
                (documento → modelo multimodal → JSON validado) se conecta en la capa de
                datos, sin cambiar esta pantalla.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
