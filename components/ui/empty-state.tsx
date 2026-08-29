import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * §8.11 — estado vacío. Regla §10.11: toda lista que puede estar vacía tiene su estado
 * vacío diseñado antes de darse por construida.
 */
export function EmptyState({
  icon = "description",
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <Icon name={icon} size={40} className="mb-3 text-on-surface-variant" />
      <p className="mb-1 font-sans text-headline-sm text-on-background">{title}</p>
      {description && (
        <p className="mb-5 max-w-xs font-sans text-body-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
