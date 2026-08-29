"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Notificaciones (toast). No existe un componente de toast en DESIGN_SYSTEM.md:
 * se compone con los tokens del sistema — superficie Nivel 2, borde `surface-border`,
 * tipografía `body-sm`, sin introducir colores nuevos.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-container-lowest !border !border-surface-border !rounded-lg !shadow-lg !font-sans !text-body-sm !text-on-background",
          description: "!text-on-surface-variant",
          actionButton:
            "!bg-primary-container !text-on-primary-container !rounded-full !font-sans",
          cancelButton:
            "!bg-surface-container !text-on-surface-variant !rounded-full !font-sans",
          success: "!text-on-background",
          error: "!text-on-background",
        },
      }}
    />
  );
}
