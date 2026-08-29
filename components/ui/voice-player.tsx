"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { VoiceNote } from "@/lib/types";

/**
 * §8.7 — Reproductor de feedback por voz.
 *
 * Estaba especificado en el sistema de diseño pero marcado como fuera del MVP hasta que
 * el brief lo pidiera explícitamente. Ya se pidió, así que se construye tal como está
 * descrito: barra horizontal con onda simplificada, control play/pause en `primary`,
 * pista en `secondary` con relleno activo en `primary`, dentro de una tarjeta Nivel 1.
 */

export function formatSeconds(total: number) {
  const s = Math.max(0, Math.round(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function VoicePlayer({
  note,
  onDelete,
  className,
}: {
  note: VoiceNote;
  onDelete?: () => void;
  className?: string;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  const available = Boolean(note.object_url);
  const progress = note.duration_seconds
    ? Math.min(1, elapsed / note.duration_seconds)
    : 0;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-surface-border bg-surface-container-lowest p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="icon"
          size="icon"
          className="text-primary disabled:opacity-40"
          disabled={!available}
          aria-label={playing ? "Pausar mensaje de voz" : "Reproducir mensaje de voz"}
          onClick={toggle}
        >
          <Icon name={playing ? "pause" : "play_arrow"} filled />
        </Button>

        {/* Onda simplificada: lo reproducido en `primary`, lo pendiente en `secondary` */}
        <div className="flex h-8 flex-1 items-center gap-[2px]" aria-hidden="true">
          {note.waveform.map((amp, i) => {
            const played = i / Math.max(note.waveform.length - 1, 1) <= progress;
            return (
              <span
                key={i}
                className={cn(
                  "w-[3px] shrink-0 rounded-full transition-colors",
                  played && available ? "bg-primary" : "bg-secondary/40",
                )}
                style={{ height: `${Math.max(12, Math.round(amp * 100))}%` }}
              />
            );
          })}
        </div>

        <span className="shrink-0 font-sans text-label-sm tabular-nums text-on-surface-variant">
          {formatSeconds(available && elapsed ? elapsed : note.duration_seconds)}
        </span>

        {onDelete && (
          <Button
            type="button"
            variant="icon"
            size="icon"
            aria-label="Eliminar mensaje de voz"
            onClick={() => {
              audioRef.current?.pause();
              onDelete();
            }}
          >
            <Icon name="delete" size={20} />
          </Button>
        )}
      </div>

      {!available && (
        <p className="mt-3 flex items-start gap-1.5 font-sans text-label-sm text-on-surface-variant">
          <Icon name="info" size={20} className="text-[16px]" />
          El audio no se conserva al recargar: en el prototipo vive solo en la sesión.
          Cuando exista el bucket de Storage, se reproducirá desde ahí.
        </p>
      )}

      {available && (
        <audio
          ref={audioRef}
          src={note.object_url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setElapsed(0);
          }}
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          className="hidden"
        />
      )}
    </div>
  );
}
