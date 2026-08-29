"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Primitivo shadcn/ui restyleado con los tokens del sistema (§8.1).
 * Los valores de forma vienen literalmente de los snippets de §8.1:
 * primario = pill sólido, secundario = outline con `rounded-lg`, icono = circular.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-label-md whitespace-nowrap transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary-container rounded-full shadow-sm hover:bg-on-primary-fixed-variant",
        secondary:
          "bg-surface-container-lowest text-primary-container rounded-lg border border-surface-border hover:bg-surface",
        ghost:
          "bg-transparent text-on-surface-variant rounded-lg hover:bg-surface-container-low",
        danger:
          "bg-error-container text-on-error-container rounded-lg border border-error/20 hover:bg-error-container/70",
        icon: "text-on-surface-variant rounded-full hover:bg-surface-container-low hover:scale-95 transition-all",
      },
      size: {
        md: "px-6 py-3",
        sm: "px-4 py-2",
        xs: "px-3 py-1.5 text-label-sm",
        // min-h/min-w 44px: área táctil accesible sin cambiar el tamaño visual del icono.
        icon: "p-2 min-h-11 min-w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
