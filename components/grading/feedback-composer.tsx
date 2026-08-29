"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea, FieldHint, Label } from "@/components/ui/field";
import { VoicePlayer, formatSeconds } from "@/components/ui/voice-player";
import { useData } from "@/lib/data/provider";
import type { SubmissionWithMeta } from "@/lib/data/provider";
import type { VoiceNote } from "@/lib/types";

/**
 * Retroalimentación de cierre para el estudiante: texto y/o mensaje de voz (§8.7).
 *
 * Es del docente, no de la IA: por eso NO lleva el badge de §8.9 — ese patrón se reserva
 * para lo que propuso la IA y todavía no se confirmó. Lo que escribe el docente se
 * muestra ya resuelto, con su marca de guardado.
 *
 * PROTOTIPO: la grabación es real (MediaRecorder), pero el audio queda en memoria del
 * navegador. No hay subida a Supabase Storage todavía; ver README y
 * supabase/migrations/0003_submission_feedback.sql.
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

export function FeedbackComposer({ submission }: { submission: SubmissionWithMeta }) {
  const { saveSubmissionFeedback, saveVoiceNote, deleteVoiceNote } = useData();

  const [text, setText] = React.useState(submission.teacher_feedback ?? "");
  const [saving, setSaving] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [micError, setMicError] = React.useState<string>();

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const samplesRef = React.useRef<number[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  // El callback onstop del recorder captura el estado al iniciar: el contador vive en un
  // ref para que la duración guardada sea la real, no 0.
  const secondsRef = React.useRef(0);

  const dirty = (submission.teacher_feedback ?? "") !== text;

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
              Retroalimentación para {submission.student?.name?.split(" ")[0] ?? "el estudiante"}
            </h2>
            <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
              Este es tu mensaje de cierre sobre todo el trabajo. Escríbelo, grábalo, o las
              dos cosas: sale en el resultado que le entregas.
            </p>
          </div>
          {submission.teacher_feedback && !dirty && (
            <span className="inline-flex items-center gap-1.5 font-sans text-body-sm text-on-surface-variant">
              <Icon
                name="check_circle"
                size={20}
                filled
                className="text-status-corrected-text"
              />
              Guardada
            </span>
          )}
        </div>

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
            <VoicePlayer
              note={submission.voice_note}
              onDelete={() => {
                void deleteVoiceNote(submission.id);
                toast.success("Mensaje de voz eliminado.");
              }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={saving || !dirty}
            onClick={async () => {
              setSaving(true);
              await saveSubmissionFeedback(submission.id, text);
              setSaving(false);
              toast.success("Retroalimentación guardada.");
            }}
          >
            {saving ? (
              <Icon name="progress_activity" size={20} className="animate-spin" />
            ) : (
              <Icon name="save" size={20} />
            )}
            {saving ? "Guardando…" : "Guardar retroalimentación"}
          </Button>
          {dirty && (
            <span className="font-sans text-body-sm text-on-surface-variant">
              Tienes cambios sin guardar.
            </span>
          )}
        </div>

        <p
          className={cn(
            "rounded-lg border border-surface-border bg-surface-container-low p-3",
            "font-sans text-label-sm text-on-surface-variant",
          )}
        >
          Prototipo: el audio se graba en tu navegador y se pierde al recargar. La subida a
          Supabase Storage y el enlace en el PDF quedan pendientes de conectar.
        </p>
      </CardContent>
    </Card>
  );
}
