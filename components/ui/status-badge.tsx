import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { StatusBadgeKind } from "@/lib/data/derive";

/**
 * §2.3 / §2.4 / §8.4 — badge de estado.
 * Regla: fondo /10, borde /20, texto SIEMPRE en el tono "-text" corregido para AA.
 * El hex base nunca se usa como color de texto.
 */
const STYLES: Record<
  StatusBadgeKind,
  { className: string; icon: string; defaultLabel: string; filled: boolean }
> = {
  pendiente: {
    className:
      "bg-status-pending/10 text-status-pending-text border-status-pending/20",
    icon: "schedule",
    defaultLabel: "Pendiente",
    filled: false,
  },
  revision: {
    className: "bg-status-review/10 text-status-review-text border-status-review/20",
    icon: "hourglass_top",
    defaultLabel: "En revisión",
    filled: false,
  },
  corregido: {
    className:
      "bg-status-corrected/10 text-status-corrected-text border-status-corrected/20",
    icon: "check_circle",
    defaultLabel: "Corregido",
    // §7 — FILL 1 permitido en el icono de un badge ya confirmado.
    filled: true,
  },
};

export function StatusBadge({
  kind,
  label,
  showIcon = true,
  className,
}: {
  kind: StatusBadgeKind;
  label?: string;
  showIcon?: boolean;
  className?: string;
}) {
  const style = STYLES[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 font-sans text-label-md",
        style.className,
        className,
      )}
    >
      {showIcon && <Icon name={style.icon} size={20} filled={style.filled} />}
      {label ?? style.defaultLabel}
    </span>
  );
}
