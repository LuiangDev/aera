import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Tokens de docs/DESIGN_SYSTEM.md §9 — fuente de verdad.
 * Nunca introducir un color fuera de esta paleta sin agregarlo primero como token nombrado (§10.1).
 *
 * Tokens marcados "reservado" o "alias" (surface-dim, surface-tint, inverse-primary,
 * surface-bright, surface-variant) vienen del export de Material 3 y NO se usan en ningún
 * componente. Si al cerrar el MVP siguen sin uso, se eliminan de este config (§2.2).
 */
const config: Config = {
  darkMode: "class", // reservado — no implementado en el MVP (§10.6)
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        secondary: "#565e74",
        "on-secondary": "#ffffff",
        "secondary-container": "#dae2fd",
        "on-secondary-container": "#5c647a",
        "secondary-fixed": "#dae2fd",
        "secondary-fixed-dim": "#bec6e0",
        "on-secondary-fixed": "#131b2e",
        "on-secondary-fixed-variant": "#3f465c",
        tertiary: "#525657",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#6b6e70",
        "on-tertiary-container": "#eff1f3",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        background: "#f8f9ff",
        "on-background": "#0b1c30",
        surface: "#f8f9ff",
        "surface-dim": "#cbdbf5", // reservado
        "surface-bright": "#f8f9ff", // alias de background
        "surface-variant": "#d3e4fe", // alias de surface-container-highest
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-border": "#E2E8F0",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        "inverse-primary": "#b4c5ff", // reservado
        outline: "#737686",
        "outline-variant": "#c3c6d7",
        "surface-tint": "#0053db", // reservado
        "status-pending": "#F59E0B",
        "status-pending-text": "#A4490A", // §11 + pasada de accesibilidad sobre el componente real:
        // #B45309 daba 4.45:1 sobre el badge apoyado en el fondo de la app (falla AA).
        // #A4490A pasa en ambos contextos (5.49:1 sobre tarjeta, 5.26:1 sobre el fondo).
        "status-review": "#8B5CF6",
        "status-review-text": "#6D28D9",
        "status-corrected": "#10B981",
        "status-corrected-text": "#047857",
      },
      borderRadius: {
        sm: "0.25rem", // 4px
        DEFAULT: "0.5rem", // 8px
        md: "0.75rem", // 12px
        lg: "1rem", // 16px
        xl: "1.5rem", // 24px
        full: "9999px",
      },
      spacing: {
        base: "4px",
        "sidebar-width": "260px",
        "container-max": "1440px",
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "32px",
      },
      maxWidth: {
        "container-max": "1440px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md-mobile": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      boxShadow: {
        // Nivel 1 — tarjetas y tablas (§6)
        sm: "0 2px 8px rgba(15, 23, 42, 0.02)",
        DEFAULT: "0 2px 8px rgba(15, 23, 42, 0.02)",
        md: "0 4px 16px rgba(15, 23, 42, 0.04)",
        // Nivel 2 — dropdowns y modales (§6)
        lg: "0 8px 30px rgba(15, 23, 42, 0.05)",
        xl: "0 8px 30px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
