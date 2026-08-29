import { cn } from "@/lib/utils";

/**
 * §7 — Material Symbols Outlined es la ÚNICA librería de iconos del sistema.
 * No introducir lucide, FontAwesome ni SVGs sueltos.
 *
 * `filled` (FILL: 1) se reserva para el item activo del sidebar y para iconos de estado
 * dentro de un badge ya confirmado. Nunca decorativo.
 */
export function Icon({
  name,
  className,
  filled = false,
  size = 24,
  ...props
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: 20 | 24 | 32 | 40;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "children">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined shrink-0 leading-none",
        filled && "is-active",
        size === 20 && "text-[20px]",
        size === 24 && "text-[24px]",
        size === 32 && "text-[32px]",
        size === 40 && "text-[40px]",
        className,
      )}
      {...props}
    >
      {name}
    </span>
  );
}
