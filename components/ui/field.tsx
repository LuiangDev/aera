"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/** §8.6 — inputs, labels y textos de ayuda/error. */

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("block font-sans text-label-md text-on-surface-variant", className)}
    {...props}
  />
));
Label.displayName = "Label";

/**
 * Pasada de accesibilidad sobre el componente real (WCAG 1.4.11 y 1.4.3):
 * · el borde usa `outline` (#737686, 4.5:1 sobre blanco) en vez de `outline-variant`
 *   (#C3C6D7, 1.7:1) — el borde de un campo de formulario es el límite del control y
 *   necesita 3:1. Ambos son tokens documentados en §2.2 para bordes de input.
 * · el placeholder pasa de /60 (3.18:1, falla) a /75 (4.64:1, pasa) manteniéndose más
 *   suave que el texto ya escrito.
 */
const fieldBase =
  "w-full rounded border border-outline bg-surface-container-lowest text-on-surface font-sans text-body-md placeholder:text-on-surface-variant/75 transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-inner focus-visible:outline-none disabled:opacity-50 aria-[invalid=true]:border-error";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "px-4 py-3", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "px-4 py-3 resize-y min-h-[96px]", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Select nativo restyleado: menos peso que un combobox y suficiente para el MVP. */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(fieldBase, "appearance-none px-4 py-3 pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <span
      aria-hidden="true"
      className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
    >
      expand_more
    </span>
  </div>
));
Select.displayName = "Select";

export function FieldHint({
  children,
  tone = "neutral",
  className,
  id,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "error";
  className?: string;
  id?: string;
}) {
  return (
    <p
      id={id}
      className={cn(
        "mt-1 font-sans text-body-sm",
        tone === "error" ? "text-error" : "text-on-surface-variant",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  // WCAG 3.3.1 / 4.1.2: el texto de ayuda o de error se anuncia junto al campo,
  // no solo se ve. `aria-describedby` se inyecta en el control hijo.
  const describedBy = htmlFor
    ? error
      ? `${htmlFor}-error`
      : hint
        ? `${htmlFor}-hint`
        : undefined
    : undefined;

  const described =
    describedBy && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<{ "aria-describedby"?: string }>, {
          "aria-describedby": describedBy,
        })
      : children;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </Label>
      {described}
      {error ? (
        <FieldHint tone="error" id={describedBy}>
          {error}
        </FieldHint>
      ) : hint ? (
        <FieldHint id={describedBy}>{hint}</FieldHint>
      ) : null}
    </div>
  );
}
