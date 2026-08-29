import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";

/**
 * §15 / §28 — "Confianza de extracción" por campo.
 * Bajo el umbral (0.75) la extracción se marca para revisión prioritaria: la fila se
 * resalta con borde `status-pending` para que el docente sepa dónde mirar primero.
 *
 * No se introduce un cuarto color: alto reutiliza `status-corrected`, bajo reutiliza
 * `status-pending`, y medio usa superficie neutra (§10.1).
 */
export type ConfidenceLevel = "alta" | "media" | "baja";

export function confidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.9) return "alta";
  if (value >= CONFIDENCE_THRESHOLD) return "media";
  return "baja";
}

export function isLowConfidence(value: number) {
  return value < CONFIDENCE_THRESHOLD;
}

const STYLES: Record<ConfidenceLevel, { className: string; icon: string; label: string }> =
  {
    alta: {
      className:
        "bg-status-corrected/10 text-status-corrected-text border-status-corrected/20",
      icon: "verified",
      label: "Confianza alta",
    },
    media: {
      className:
        "bg-surface-container text-on-surface-variant border-outline-variant/60",
      icon: "help",
      label: "Confianza media",
    },
    baja: {
      className: "bg-status-pending/10 text-status-pending-text border-status-pending/20",
      icon: "priority_high",
      label: "Confianza baja",
    },
  };

export function ConfidenceBadge({
  value,
  showPercent = true,
  className,
}: {
  value: number;
  showPercent?: boolean;
  className?: string;
}) {
  const level = confidenceLevel(value);
  const style = STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-label-sm",
        style.className,
        className,
      )}
      title={`Confianza de extracción: ${Math.round(value * 100)}%`}
    >
      <Icon name={style.icon} size={20} className="text-[16px]" />
      {style.label}
      {showPercent && (
        <span className="opacity-80">· {Math.round(value * 100)}%</span>
      )}
    </span>
  );
}
