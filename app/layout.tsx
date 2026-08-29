import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/data/provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "AERA — Evaluación educativa asistida por IA",
  description:
    "Digitaliza la actividad que ya tienes, revisa lo que la IA detectó y corrige manteniendo siempre la decisión final.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/* §9 — Inter (única familia de texto) y Material Symbols Outlined (iconos) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@100..700,0..1,-50..200,20..48&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-sans text-body-md text-on-background antialiased">
        <DataProvider>
          {children}
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
