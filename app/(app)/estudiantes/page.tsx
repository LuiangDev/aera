"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Fab, PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RowSkeletonList } from "@/components/ui/skeleton";
import { useData } from "@/lib/data/provider";

/** §7.2 / §32 — estudiantes: crear y asociar. No hay portal de estudiante en el MVP. */
export default function EstudiantesPage() {
  const { ready, students, createStudent, createStudentsBulk, deleteStudent } = useData();
  const [query, setQuery] = useState("");
  const [openSingle, setOpenSingle] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [form, setForm] = useState({ name: "", identifier: "" });
  const [bulk, setBulk] = useState("");
  const [error, setError] = useState<string>();

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.identifier.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );

  return (
    <>
      <PageHeader
        title="Estudiantes"
        description="Tu lista de estudiantes. Se usa para asignar cada hoja de respuestas a su autor."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setOpenBulk(true)}
            >
              <Icon name="list_alt_add" size={20} />
              Cargar lista
            </Button>
            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setOpenSingle(true)}
            >
              <Icon name="person_add" size={20} />
              Agregar estudiante
            </Button>
          </>
        }
      />

      {!ready ? (
        <RowSkeletonList />
      ) : students.length === 0 ? (
        <Card>
          <EmptyState
            icon="group"
            title="Todavía no tienes estudiantes"
            description="Agrégalos uno por uno o pega tu lista de clase completa: un estudiante por línea."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => setOpenBulk(true)}>
                  <Icon name="list_alt_add" size={20} />
                  Pegar mi lista
                </Button>
                <Button variant="secondary" onClick={() => setOpenSingle(true)}>
                  <Icon name="person_add" size={20} />
                  Agregar uno
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código"
              aria-label="Buscar estudiante"
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon="search_off"
                title="Sin coincidencias"
                description="Prueba con otro nombre o código."
              />
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Nombre</TH>
                      <TH>Código</TH>
                      <TH className="text-right">Acciones</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {filtered.map((s) => (
                      <TR key={s.id}>
                        <TD>
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container font-sans text-label-md text-on-tertiary-container"
                              aria-hidden="true"
                            >
                              {s.name
                                .split(" ")
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                            <span className="font-sans text-body-md font-semibold text-on-background">
                              {s.name}
                            </span>
                          </div>
                        </TD>
                        <TD className="text-on-surface-variant">{s.identifier}</TD>
                        <TD>
                          <div className="flex justify-end">
                            <Button
                              variant="icon"
                              size="icon"
                              aria-label={`Eliminar a ${s.name}`}
                              onClick={async () => {
                                await deleteStudent(s.id);
                                toast.success("Estudiante eliminado.");
                              }}
                            >
                              <Icon name="delete" size={20} />
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {filtered.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container font-sans text-label-md text-on-tertiary-container"
                        aria-hidden="true"
                      >
                        {s.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-body-md text-on-background">
                          {s.name}
                        </p>
                        <p className="font-sans text-label-sm text-on-surface-variant">
                          {s.identifier}
                        </p>
                      </div>
                      <Button
                        variant="icon"
                        size="icon"
                        aria-label={`Eliminar a ${s.name}`}
                        onClick={() => deleteStudent(s.id)}
                      >
                        <Icon name="delete" size={20} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Fab onClick={() => setOpenSingle(true)} icon="person_add" label="Agregar estudiante" />

      {/* Alta individual */}
      <Dialog open={openSingle} onOpenChange={setOpenSingle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar estudiante</DialogTitle>
            <DialogDescription>
              El código te sirve para identificar la hoja cuando subas las respuestas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nombre" htmlFor="student-name" error={error} required>
              <Input
                id="student-name"
                value={form.name}
                aria-invalid={Boolean(error)}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="María Fernández"
              />
            </Field>
            <Field label="Código o identificador" htmlFor="student-id">
              <Input
                id="student-id"
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                placeholder="A-026"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenSingle(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!form.name.trim()) {
                  setError("Ingresa el nombre del estudiante.");
                  return;
                }
                setError(undefined);
                await createStudent(
                  form.name.trim(),
                  form.identifier.trim() || `A-${students.length + 1}`,
                );
                setForm({ name: "", identifier: "" });
                setOpenSingle(false);
                toast.success("Estudiante agregado.");
              }}
            >
              <Icon name="person_add" size={20} />
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carga en lote */}
      <Dialog open={openBulk} onOpenChange={setOpenBulk}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar lista de clase</DialogTitle>
            <DialogDescription>
              Un estudiante por línea. Si tienes el código, sepáralo con una coma:
              «María Fernández, A-026».
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            className="min-h-[180px]"
            aria-label="Lista de estudiantes"
            placeholder={"Ana Quispe, A-001\nCarlos Mendoza, A-002"}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenBulk(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const count = await createStudentsBulk(bulk);
                setBulk("");
                setOpenBulk(false);
                toast.success(
                  `${count} estudiante${count === 1 ? "" : "s"} agregado${
                    count === 1 ? "" : "s"
                  }.`,
                );
              }}
            >
              <Icon name="group_add" size={20} />
              Cargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
