import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/** §8.1 — pantallas de autenticación: superficie clara, tarjeta Nivel 1, tipografía display. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-margin-mobile py-6 md:px-margin-desktop">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-primary-container">
            <Icon name="school" size={20} className="text-on-primary-container" />
          </span>
          <span className="font-sans text-headline-sm text-on-background">AERA</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-margin-mobile pb-16 md:px-margin-desktop">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
