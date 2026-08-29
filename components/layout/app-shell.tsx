"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/provider";

/**
 * §4 / §8.2 — layout de la aplicación.
 * Desktop: sidebar oscuro fijo de 260px. Mobile: el sidebar colapsa en bottom navigation
 * (§4 reflow) y la acción principal de cada pantalla aparece como FAB.
 */

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/estudiantes", label: "Estudiantes", icon: "group" },
  { href: "/ajustes", label: "Ajustes", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/actividades");
  return pathname.startsWith(href);
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar-width flex-col bg-inverse-surface md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded bg-primary-container">
          <Icon name="school" size={20} className="text-on-primary-container" />
        </span>
        <span className="font-sans text-headline-sm text-inverse-on-surface">AERA</span>
      </div>

      <nav className="flex-1 py-2" aria-label="Navegación principal">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 border-l-4 px-4 py-3 font-sans text-body-md transition-colors duration-200",
                active
                  ? "border-primary-container bg-on-secondary-fixed-variant text-inverse-on-surface"
                  : "border-transparent text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant hover:text-surface-container-lowest",
              )}
            >
              <Icon name={item.icon} filled={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6">
        <p className="font-sans text-label-sm text-secondary-fixed-dim">
          Maqueta de front · datos de demostración
        </p>
      </div>
    </aside>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-inverse-surface md:hidden"
      aria-label="Navegación principal"
    >
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 font-sans text-label-sm transition-colors",
              active ? "text-inverse-on-surface" : "text-secondary-fixed-dim",
            )}
          >
            <Icon name={item.icon} filled={active} size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Topbar() {
  const { teacher, signOut } = useData();
  const router = useRouter();
  const initials = (teacher?.name ?? "AE")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-surface-border bg-background/95 px-margin-mobile py-3 backdrop-blur md:px-margin-desktop">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-primary-container">
          <Icon name="school" size={20} className="text-on-primary-container" />
        </span>
        <span className="font-sans text-headline-sm text-on-background">AERA</span>
      </Link>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="icon"
          size="icon"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Icon name="notifications" />
        </Button>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container font-sans text-label-md text-on-tertiary-container"
            aria-hidden="true"
          >
            {initials}
          </div>
          <span className="hidden font-sans text-body-sm text-on-surface-variant sm:block">
            {teacher?.name ?? "Docente"}
          </span>
        </div>
        <Button
          variant="icon"
          size="icon"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <Icon name="logout" />
        </Button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* WCAG 2.4.1 — saltar la navegación repetida */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-container focus:px-4 focus:py-2 focus:font-sans focus:text-label-md focus:text-on-primary-container"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="md:pl-sidebar-width">
        <Topbar />
        <main
          id="contenido"
          className="mx-auto w-full max-w-container-max px-margin-mobile pb-28 pt-6 md:px-margin-desktop md:pb-16"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

/** Encabezado de página reutilizable: título, descripción, migas y acciones. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Volver",
  actions,
  className,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 font-sans text-body-sm text-primary-container hover:underline"
        >
          <Icon name="arrow_back" size={20} />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-headline-md-mobile text-on-background md:text-headline-md">
            {title}
          </h1>
          {description && (
            <p className="mt-1 font-sans text-body-sm text-on-surface-variant">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** §4 — FAB de la acción principal en mobile. */
export function Fab({
  href,
  onClick,
  icon = "add",
  label,
}: {
  href?: string;
  onClick?: () => void;
  icon?: string;
  label: string;
}) {
  const className =
    "md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50";
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        <Icon name={icon} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}
