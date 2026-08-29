"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea, FieldHint, Label } from "@/components/ui/field";
import { AiSuggestedBadge } from "@/components/ui/ai-value";
import { VoicePlayer, formatSeconds } from "@/components/ui/voice-player";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/lib/data/provider";
import type { SubmissionWithMeta } from "@/lib/data/provider";
import type { VoiceNote } from "@/lib/types";

/**
 * Retroalimentación de cierre para el estudiante y su familia (§8.7).
 *
 * Tres piezas, en el orden en que el docente las usa:
 *  1. La IA propone una retroalimentación a partir de toda la corrección — SUGERIDA,
 *     con el patrón de §8.9, hasta que el docente la toma y la hace suya.
 *  2. El docente escribe o graba: al grabar, la IA ofrece una reinterpretación escrita.
 *  3. El docente ENVÍA. Hasta ese momento nada de esto es visible para la familia.
 *
 * PROTOTIPO: la grabación es real (MediaRecorder) pero el audio vive en memoria del
 * navegador; la reinterpretación del audio es simulada — no hay transcripción real.
 */

const WAVEFORM_BARS = 48;

function downsample(samples: number[], bars = WAVEFORM_BARS): number[] {
  if (samples.length === 0) return Array.from({ length: bars }, () => 0.2);
  const size = Math.ceil(samples.length / bars);
  return Array.from({ length: bars }, (_, i) => {
    const slice = samples.slice(i * size, (i + 1) * size);
    if (!slice.length) return 0.15;
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return Math.min(1, Math.max(0.12, avg));
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeedbackComposer({ submission }: { submission: SubmissionWithMeta }) {
  const {
    saveSubmissionFeedback,
    saveVoiceNote,
    deleteVoiceNote,
    generateAiFeedbackDraft,
    generateVoiceTranscript,
    sendFeedback,
  } = useData();

  const [text, setText] = React.useState(submission.teacher_feedback ?? "");
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [micError, setMicError] = React.useState<string>();
  const [confirmSend, setConfirmSend] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const samplesRef = React.useRef<number[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  // El callback onstop captura el estado al iniciar: el contador vive en un ref para que
  // la duración guardada sea la real, no 0.
  const secondsRef = React.useRef(0);

  const dirty = (submission.teacher_feedback ?? "") !== text;
  const sent = Boolean(submission.feedback_sent_at);
  const hasContent = Boolean(text.trim() || submission.voice_note);
  // Editó después de enviar: hay cambios que la familia todavía no ve.
  const changedAfterSend = sent && dirty;
  const draftUnused =
    submission.ai_feedback_draft && submission.ai_feedback_draft !== text;

  const cleanup = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  async function startRecording() {
    setMicError(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Amplitud real para dibujar la onda de §8.7 en vez de una decorativa.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);
      samplesRef.current = [];

      const sample = () => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (const v of buffer) sum += ((v - 128) / 128) ** 2;
        samplesRef.current.push(Math.sqrt(sum / buffer.length) * 3);
        rafRef.current = requestAnimationFrame(sample);
      };
      sample();

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const note: VoiceNote = {
          id: `vn_${Math.random().toString(36).slice(2, 10)}`,
          duration_seconds: Math.max(1, secondsRef.current),
          created_at: new Date().toISOString(),
          object_url: URL.createObjectURL(blob),
          waveform: downsample(samplesRef.current),
        };
        void saveVoiceNote(submission.id, note);
        toast.success("Mensaje de voz grabado.");
        cleanup();
      };

      recorderRef.current = recorder;
      recorder.start();
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } catch {
      cleanup();
      setMicError(
        "No pudimos acceder al micrófono. Revisa el permiso del navegador o escribe tu retroalimentación.",
      );
    }
  }

  function stopRecording() {
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-headline-sm text-on-background">
              Retroalimentación para{" "}
              {submission.student?.name?.split(" ")[0] ?? "el estudiante"}
            </h2>
            <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
              Tu mensaje de cierre sobre todo el trabajo. Cuando lo envíes, lo verá su
              apoderado en el portal de seguimiento.
            </p>
          </div>

          {sent && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-corrected/20 bg-status-corrected/10 px-3 py-1 font-sans text-label-md text-status-corrected-text">
              <Icon name="send" size={20} filled />
              Enviada
            </span>
          )}
        </div>

        {/* 1 — Sugerencia de la IA a partir de toda la corrección (§8.9) */}
        {!sent && (
          <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
            {submission.ai_feedback_draft ? (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <AiSuggestedBadge label="Retroalimentación sugerida por IA" />
                  <span className="font-sans text-body-sm text-on-surface-variant">
                    Revísala antes de usarla
                  </span>
                </div>
                <p className="mb-3 font-sans text-body-md text-on-background">
                  {submission.ai_feedback_draft}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!draftUnused}
                    onClick={() => {
                      setText(submission.ai_feedback_draft ?? "");
                      toast.success("Texto copiado a tu mensaje: edítalo si quieres.");
                    }}
                  >
                    <Icon name="edit_note" size={20} />
                    {draftUnused ? "Usar y editar" : "Ya está en tu mensaje"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={generating}
                    onClick={async () => {
                      setGenerating(true);
                      await generateAiFeedbackDraft(submission.id);
                      setGenerating(false);
                    }}
                  >
                    <Icon
                      name={generating ? "progress_activity" : "refresh"}
                      size={20}
                      className={generating ? "animate-spin" : undefined}
                    />
                    Generar otra
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-sans text-body-md text-on-background">
                    ¿Quieres un punto de partida?
                  </p>
                  <p className="font-sans text-body-sm text-on-surface-variant">
                    La IA puede redactar una propuesta con lo que ya corregiste: puntajes,
                    criterios cumplidos y los que no.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={generating}
                  onClick={async () => {
                    setGenerating(true);
                    await generateAiFeedbackDraft(submission.id);
                    setGenerating(false);
                    toast.success("Propuesta generada. Revísala antes de usarla.");
                  }}
                >
                  <Icon
                    name={generating ? "progress_activity" : "auto_awesome"}
                    size={20}
                    className={generating ? "animate-spin" : undefined}
                  />
                  {generating ? "Redactando…" : "Proponer con IA"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 2 — El mensaje del docente */}
        <div className="space-y-2">
          <Label htmlFor={`feedback-${submission.id}`}>Tu mensaje</Label>
          <Textarea
            id={`feedback-${submission.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px]"
            placeholder="Qué hizo bien, qué conviene reforzar y con qué puede seguir practicando."
          />
        </div>

        {/* Grabación de voz */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {recording ? (
              <>
                <Button type="button" variant="danger" onClick={stopRecording}>
                  <Icon name="stop_circle" size={20} />
                  Detener grabación
                </Button>
                <span
                  className="inline-flex items-center gap-2 font-sans text-body-sm text-status-pending-text"
                  role="status"
                  aria-live="polite"
                >
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-status-pending" />
                  Grabando · {formatSeconds(seconds)}
                </span>
              </>
            ) : (
              <Button
                type="button"
                variant={submission.voice_note ? "secondary" : "primary"}
                onClick={startRecording}
              >
                <Icon name="mic" size={20} />
                {submission.voice_note ? "Grabar de nuevo" : "Grabar mensaje de voz"}
              </Button>
            )}

            {!recording && !submission.voice_note && (
              <span className="font-sans text-body-sm text-on-surface-variant">
                Opcional. A veces explicar en voz alta toma menos que escribirlo.
              </span>
            )}
          </div>

          {micError && <FieldHint tone="error">{micError}</FieldHint>}

          {submission.voice_note && !recording && (
            <>
              <VoicePlayer
                note={submission.voice_note}
                onDelete={() => {
                  void deleteVoiceNote(submission.id);
                  toast.success("Mensaje de voz eliminado.");
                }}
              />

              {/* Reinterpretación del audio, sugerida por IA (§8.9) */}
              {submission.voice_note.ai_transcript ? (
                <div className="rounded-lg border border-surface-border bg-surface-container-low p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <AiSuggestedBadge label="Reinterpretación del audio" />
                    <span className="font-sans text-body-sm text-on-surface-variant">
                      Simulada en el prototipo: no es una transcripción real
                    </span>
                  </div>
                  <p className="mb-3 font-sans text-body-md text-on-background">
                    {submission.voice_note.ai_transcript}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setText(submission.voice_note?.ai_transcript ?? "");
                        toast.success("Texto copiado a tu mensaje.");
                      }}
                    >
                      <Icon name="edit_note" size={20} />
                      Usar como mensaje
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setText((t) =>
                          [t, submission.voice_note?.ai_transcript]
                            .filter(Boolean)
                            .join("\n\n"),
                        )
                      }
                    >
                      <Icon name="add" size={20} />
                      Agregar al final
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={transcribing}
                  onClick={async () => {
                    setTranscribing(true);
                    await generateVoiceTranscript(submission.id);
                    setTranscribing(false);
                  }}
                >
                  <Icon
                    name={transcribing ? "progress_activity" : "auto_awesome"}
                    size={20}
                    className={transcribing ? "animate-spin" : undefined}
                  />
                  {transcribing ? "Interpretando…" : "Reinterpretar el audio con IA"}
                </Button>
              )}
            </>
          )}
        </div>

        {/* 3 — Guardar y enviar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-5">
          <Button
            type="button"
            variant="secondary"
            disabled={saving || !dirty}
            onClick={async () => {
              setSaving(true);
              await saveSubmissionFeedback(submission.id, text);
              setSaving(false);
              toast.success("Borrador guardado.");
            }}
          >
            {saving ? (
              <Icon name="progress_activity" size={20} className="animate-spin" />
            ) : (
              <Icon name="save" size={20} />
            )}
            {saving ? "Guardando…" : "Guardar borrador"}
          </Button>

          <Button
            type="button"
            disabled={!hasContent || (sent && !changedAfterSend)}
            onClick={() => setConfirmSend(true)}
          >
            <Icon name="send" size={20} />
            {sent ? "Enviar cambios" : "Enviar retroalimentación"}
          </Button>

          {sent && !changedAfterSend && submission.feedback_sent_at && (
            <span className="font-sans text-body-sm text-on-surface-variant">
              Enviada el {formatDate(submission.feedback_sent_at)}
              {submission.student?.guardian_name
                ? ` a ${submission.student.guardian_name}`
                : ""}
              .
            </span>
          )}
          {changedAfterSend && (
            <span className="inline-flex items-center gap-1.5 font-sans text-body-sm text-status-pending-text">
              <Icon name="priority_high" size={20} className="text-[18px]" />
              Editaste después de enviar: la familia todavía ve la versión anterior.
            </span>
          )}
          {!sent && dirty && (
            <span className="font-sans text-body-sm text-on-surface-variant">
              Tienes cambios sin guardar.
            </span>
          )}
        </div>

        <p className="rounded-lg border border-surface-border bg-surface-container-low p-3 font-sans text-label-sm text-on-surface-variant">
          Prototipo: el audio se graba en tu navegador y se pierde al recargar; la
          reinterpretación del audio es simulada. Enviar marca la retroalimentación como
          visible en el portal del apoderado, sin correo ni notificación real.
        </p>
      </CardContent>

      <Dialog open={confirmSend} onOpenChange={setConfirmSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Enviar la retroalimentación a la familia de{" "}
              {submission.student?.name ?? "este estudiante"}?
            </DialogTitle>
            <DialogDescription>
              {submission.student?.guardian_name
                ? `${submission.student.guardian_name} podrá verla en el portal de seguimiento, junto con la nota confirmada.`
                : "El apoderado podrá verla en el portal de seguimiento, junto con la nota confirmada."}{" "}
              Puedes editarla y volver a enviarla después.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {text.trim() && (
              <p className="rounded-lg border border-surface-border bg-surface-container-low p-3 font-sans text-body-sm text-on-background">
                {text}
              </p>
            )}
            {submission.voice_note && (
              <p className="flex items-center gap-2 font-sans text-body-sm text-on-surface-variant">
                <Icon name="mic" size={20} className="text-[18px]" />
                Incluye un mensaje de voz de{" "}
                {formatSeconds(submission.voice_note.duration_seconds)}.
              </p>
            )}
            {!submission.isFinal && (
              <p className="flex items-start gap-1.5 font-sans text-body-sm text-status-pending-text">
                <Icon name="priority_high" size={20} className="text-[18px]" />
                Esta entrega todavía tiene puntajes sin confirmar. La familia verá tu
                mensaje, pero no la nota hasta que la apruebes.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmSend(false)}>
              Cancelar
            </Button>
            <Button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                if (dirty) await saveSubmissionFeedback(submission.id, text);
                await sendFeedback(submission.id);
                setSending(false);
                setConfirmSend(false);
                toast.success("Retroalimentación enviada a la familia.");
              }}
            >
              <Icon
                name={sending ? "progress_activity" : "send"}
                size={20}
                className={sending ? "animate-spin" : undefined}
              />
              {sending ? "Enviando…" : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
