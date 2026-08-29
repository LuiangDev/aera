"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ACHIEVEMENT_LEVELS, LEVEL_ORDER, type AchievementLevel } from "@/lib/evaluacion";

/**
 * Escala oficial de niveles de logro (AD / A / B / C) — RVM 094-2020 y RVM 048-2024.
 *
 * NOTA DE SISTEMA DE DISEÑO: DESIGN_SYSTEM.md §2.3 define tres estados de corrección, no
 * los cuatro niveles de la escala. Este chip NO introduce colores nuevos: reutiliza
 * tokens ya documentados —
 *   AD → primary-fixed / on-primary-fixed   (acento, §2.1)
 *   A  → status-corrected /10 + tono -text  (§2.3)
 *   B  → status-pending /10 + tono -text    (§2.3)
 *   C  → error-container / on-error-container (§2.1)
 * Cada nivel lleva además su letra y un ícono propio: el nivel nunca se comunica solo
 * con color. Queda pendiente documentarlo como componente en el sistema de diseño.
 */
const LEVEL_STYLES: Record<AchievementLevel, string> = {
  AD: "bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim",
  A: "bg-status-corrected/10 text-status-corrected-text border-status-corrected/20",
  B: "bg-status-pending/10 text-status-pending-text border-status-pending/20",
  C: "bg-error-container text-on-error-container border-error/20",
};

export function LevelBadge({
  level,
  showLabel = true,
  className,
}: {
  level: AchievementLevel;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = ACHIEVEMENT_LEVELS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 font-sans text-label-md",
        LEVEL_STYLES[level],
        className,
      )}
      title={meta.description}
    >
      <Icon name={meta.icon} size={20} />
      <span className="font-sans">{meta.code}</span>
      {showLabel && <span className="font-normal">· {meta.label}</span>}
    </span>
  );
}

/** Selector de nivel para el docente. Cuatro opciones, siempre visibles y con su letra. */
export function LevelSelector({
  value,
  onChange,
  disabled = false,
  size = "md",
  label,
  className,
}: {
  value: AchievementLevel | null;
  onChange: (level: AchievementLevel) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex flex-wrap gap-1", className)}
    >
      {LEVEL_ORDER.slice()
        .reverse()
        .map((level) => {
          const meta = ACHIEVEMENT_LEVELS[level];
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${meta.code} · ${meta.label}`}
              title={meta.description}
              disabled={disabled}
              onClick={() => onChange(level)}
              className={cn(
                "rounded border font-sans transition-colors disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                size === "sm" ? "px-2.5 py-1 text-label-sm" : "px-3 py-2 text-label-md",
                selected
                  ? LEVEL_STYLES[level]
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              {meta.code}
            </button>
          );
        })}
    </div>
  );
}

/** Leyenda de la escala, para pantallas donde el docente o la familia la necesita. */
export function LevelLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("space-y-2", className)}>
      {LEVEL_ORDER.slice()
        .reverse()
        .map((level) => (
          <li key={level} className="flex items-start gap-3">
            <LevelBadge level={level} showLabel={false} />
            <span className="font-sans text-body-sm text-on-surface-variant">
              <strong className="text-on-background">
                {ACHIEVEMENT_LEVELS[level].label}.
              </strong>{" "}
              {ACHIEVEMENT_LEVELS[level].description}
            </span>
          </li>
        ))}
    </ul>
  );
}
