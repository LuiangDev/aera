"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/lib/data/provider";

/**
 * Ajustes de la maqueta: cuenta, y control de los datos de demostración —
 * "Vaciar todo" existe para poder ver los estados vacíos de §8.11 en la app real.
 */
export default function AjustesPage() {
  const { teacher, resetDemoData, clearAllData } = useData();
  const [confirmClear, setConfirmClear] = useState(false);
  const [notify, setNotify] = useState(true);

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Tu cuenta y los datos de esta maqueta."
      />

      <div className="grid gap-gutter lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-sans text-headline-sm text-on-background">Cuenta</h2>
            <dl className="space-y-3">
              <div>
                <dt className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                  Nombre
                </dt>
                <dd className="font-sans text-body-md text-on-background">
                  {teacher?.name}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-label-sm uppercase tracking-wider text-secondary">
                  Correo
                </dt>
                <dd className="font-sans text-body-md text-on-background">
                  {teacher?.email}
                </dd>
              </div>
            </dl>
            <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-container-low p-4">
              <div className="pr-4">
                <p className="font-sans text-body-md text-on-background">
                  Avisarme cuando termine un procesamiento
                </p>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  Notificación en pantalla al terminar la extracción o la corrección.
                </p>
              </div>
              <Switch
                checked={notify}
                onCheckedChange={setNotify}
                aria-label="Avisarme cuando termine un procesamiento"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-sans text-headline-sm text-on-background">
              Datos de demostración
            </h2>
            <p className="font-sans text-body-sm text-on-surface-variant">
              Esta versión guarda todo en tu navegador. Puedes restaurar los datos de
              ejemplo o vaciarlos para ver la aplicación desde cero, con sus estados
              vacíos.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  resetDemoData();
                  toast.success("Datos de demostración restaurados.");
                }}
              >
                <Icon name="restart_alt" size={20} />
                Restaurar demo
              </Button>
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                <Icon name="delete_sweep" size={20} />
                Vaciar todo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <h2 className="font-sans text-headline-sm text-on-background">
              Estado de la conexión con el backend
            </h2>
            <ul className="space-y-3">
              {[
                { label: "Interfaz y navegación", done: true },
                { label: "Capa de acceso a datos (contrato listo)", done: true },
                { label: "Esquema SQL y policies de RLS escritos", done: true },
                { label: "Supabase conectado (Auth, Postgres, Storage)", done: false },
                { label: "Pipeline OCR + IA real, validado con documentos reales", done: false },
                { label: "Realtime sobre el estado de las entregas", done: false },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3">
                  <span className="font-sans text-body-md text-on-background">
                    {row.label}
                  </span>
                  <StatusBadge
                    kind={row.done ? "corregido" : "pendiente"}
                    label={row.done ? "Listo" : "Pendiente"}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Vaciar todos los datos?</DialogTitle>
            <DialogDescription>
              Se borran actividades, preguntas, estudiantes, entregas y correcciones de
              esta maqueta. Puedes restaurar la demo después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAllData();
                setConfirmClear(false);
                toast.success("Datos vaciados.");
              }}
            >
              <Icon name="delete_sweep" size={20} />
              Vaciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
