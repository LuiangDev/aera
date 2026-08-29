import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/**
 * Portal de seguimiento para la familia.
 *
 * NOTA DE ALCANCE: PROJECT_CONTEXT.md §33 deja el portal de estudiante con login propio
 * fuera del MVP (fase 3, §34). Esto es una variante pedida por el brief: quien entra es
 * el APODERADO, no el estudiante, y está construido a nivel de prototipo — sin
 * autenticación real, con acceso por código de estudiante.
 *
 * Layout propio: el shell del docente (sidebar oscuro, FAB, navegación de actividades) no
 * aplica aquí. Esta persona solo mira el avance de su hijo o hija.
 */
export default function FamiliaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-container focus:px-4 focus:py-2 focus:font-sans focus:text-label-md focus:text-on-primary-container"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-surface-border bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
          <Link href="/familia" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-primary-container">
              <Icon name="school" size={20} className="text-on-primary-container" />
            </span>
            <span className="font-sans text-headline-sm text-on-background">AERA</span>
            <span className="font-sans text-body-sm text-on-surface-variant">
              · Seguimiento familiar
            </span>
          </Link>
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-container-max px-margin-mobile py-6 md:px-margin-desktop"
      >
        {children}
      </main>
    </div>
  );
}
