"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data/provider";
import { Icon } from "@/components/ui/icon";

export default function RootPage() {
  const router = useRouter();
  const { ready, teacher } = useData();

  useEffect(() => {
    if (!ready) return;
    router.replace(teacher ? "/dashboard" : "/login");
  }, [ready, teacher, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 font-sans text-body-md text-on-surface-variant">
        <Icon name="progress_activity" className="animate-spin" />
        Cargando AERA…
      </div>
    </div>
  );
}
