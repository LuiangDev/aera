"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CardSkeletonList } from "@/components/ui/skeleton";
import { useData } from "@/lib/data/provider";

/**
 * Guardia de sesión del área privada. Hoy consulta la sesión de la maqueta;
 * con Supabase Auth pasa a leer la sesión real (middleware + cookies) sin cambiar
 * las pantallas que envuelve.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, teacher } = useData();
  const router = useRouter();

  useEffect(() => {
    if (ready && !teacher) router.replace("/login");
  }, [ready, teacher, router]);

  if (!ready || !teacher) {
    return (
      <AppShell>
        <div className="mb-6 h-8 w-56 animate-pulse rounded bg-surface-container" />
        <CardSkeletonList />
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
