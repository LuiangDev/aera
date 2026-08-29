import { cn } from "@/lib/utils";

/**
 * §8.3 — tablas de gestión (desktop).
 * En mobile cada fila se convierte en una tarjeta apilada (§4 reflow): las pantallas que
 * usan tabla renderizan `<DataTable>` con `hidden md:block` y una lista de cards con
 * `md:hidden`, nunca scroll horizontal forzado.
 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-surface-border bg-surface-container-lowest shadow-sm">
      <table className={cn("w-full border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-container-lowest", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-surface-border px-4 py-3 font-sans text-label-sm uppercase tracking-wider text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-surface-border transition-colors last:border-0 hover:bg-surface-container-low",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 font-sans text-body-md text-on-background", className)}
      {...props}
    />
  );
}
