"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Input } from "@/components/ui/field";
import { useData } from "@/lib/data/provider";

/**
 * Ingreso del apoderado con el código del estudiante.
 * PROTOTIPO: no hay autenticación — cualquier código válido de la demo entra. El acceso
 * real (invitación por correo, código de un solo uso o cuenta de apoderado) queda por
 * definir junto con el alcance de este portal.
 */
export default function FamiliaIngresoPage() {
  const router = useRouter();
  const { ready, findStudentByCode } = useData();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Ingresa el código que te dio el colegio.");
      return;
    }
    const student = findStudentByCode(code);
    if (!student) {
      setError("No encontramos a ningún estudiante con ese código.");
      return;
    }
    router.push(`/familia/${student.id}`);
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 font-sans text-display-lg text-on-background">
        Seguimiento de tu hijo o hija
      </h1>
      <p className="mb-6 font-sans text-body-lg text-on-surface-variant">
        Mira cómo va en cada curso y lee la retroalimentación que le dejó su docente.
      </p>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field
              label="Código del estudiante"
              htmlFor="codigo"
              hint="Es el código que aparece en la libreta o el que te compartió el colegio."
              error={error}
              required
            >
              <Input
                id="codigo"
                value={code}
                aria-invalid={Boolean(error)}
                onChange={(e) => setCode(e.target.value)}
                placeholder="A-001"
                autoComplete="off"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={!ready}>
              <Icon name="login" size={20} />
              Ver el avance
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 rounded-lg border border-surface-border bg-surface-container-low p-3 text-center font-sans text-label-sm text-on-surface-variant">
        Prototipo: prueba con <strong>A-001</strong> o el nombre de un estudiante de la
        demo. Todavía no hay autenticación real de apoderados.
      </p>
    </div>
  );
}
