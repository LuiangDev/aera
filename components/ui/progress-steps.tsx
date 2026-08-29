import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * §8.10 — progreso por pasos del pipeline OCR + IA.
 * Regla §10.10: toda pantalla de carga usa este componente, nunca un spinner genérico
 * sin contexto. El `animate-spin` se neutraliza con prefers-reduced-motion (globals.css).
 */
export function ProgressSteps({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** Cantidad de pasos completados. El paso `current` es el que está en curso. */
  current: number;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)} aria-live="polite">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-3 font-sans text-body-md",
              done && "text-on-background",
              active && "text-primary-container",
              !done && !active && "text-on-surface-variant",
            )}
          >
            {done ? (
              <Icon name="check_circle" filled className="text-status-corrected-text" />
            ) : active ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <Icon name="radio_button_unchecked" />
            )}
            {step}
          </li>
        );
      })}
    </ul>
  );
}

/** §8.8 — barra de progreso para dashboards. */
export function ProgressBar({
  value,
  max = 100,
  className,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-container", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {/* WCAG 1.4.11: el relleno usa el tono `-text` (#047857, 4.7:1 contra la pista
          `surface-container`). El hex base #10B981 daba 2.17:1 y no distinguía la barra
          llena de la vacía para baja visión. */}
      <div
        className="h-1.5 rounded-full bg-status-corrected-text transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
