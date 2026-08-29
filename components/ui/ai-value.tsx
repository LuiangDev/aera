import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * §8.9 — ORIGEN DEL VALOR: sugerido por IA vs. confirmado por el docente.
 * Es el patrón más importante del sistema: sostiene la hipótesis central del producto
 * (PROJECT_CONTEXT.md §19, §31, §36). Todo valor generado por IA que el docente todavía
 * no confirmó usa `AiSuggestedBadge`; lo confirmado se muestra "resuelto", sin badge.
 *
 * Regla de copy asociada: junto a un valor de IA se usa lenguaje de sugerencia
 * ("Sugerido por IA", "La IA detectó…", "Revisa antes de aprobar"), nunca lenguaje de
 * hecho consumado.
 */

export function AiSuggestedBadge({
  label = "Sugerido por IA",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-status-review/20 bg-status-review/10 px-2.5 py-1 font-sans text-label-sm text-status-review-text",
        className,
      )}
    >
      <Icon name="auto_awesome" size={20} className="text-[16px]" />
      {label}
    </span>
  );
}

/** Valor sugerido por IA, esperando confirmación del docente. */
export function AiSuggestedValue({
  value,
  label,
  className,
}: {
  value: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AiSuggestedBadge label={label} />
      <span className="font-sans text-headline-sm text-on-background">{value}</span>
    </div>
  );
}

/** Valor ya confirmado por el docente: sin badge, se siente resuelto. */
export function ConfirmedValue({
  value,
  note = "confirmado",
  className,
}: {
  value: React.ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Icon
        name="check_circle"
        size={20}
        filled
        className="text-status-corrected-text"
      />
      <span className="font-sans text-headline-sm text-on-background">{value}</span>
      {note && (
        <span className="font-sans text-body-sm text-on-surface-variant">{note}</span>
      )}
    </div>
  );
}

/** Elige automáticamente el tratamiento según si el docente ya confirmó el valor. */
export function OriginValue({
  confirmed,
  value,
  suggestedLabel,
  confirmedNote,
  className,
}: {
  confirmed: boolean;
  value: React.ReactNode;
  suggestedLabel?: string;
  confirmedNote?: string;
  className?: string;
}) {
  return confirmed ? (
    <ConfirmedValue value={value} note={confirmedNote} className={className} />
  ) : (
    <AiSuggestedValue value={value} label={suggestedLabel} className={className} />
  );
}
