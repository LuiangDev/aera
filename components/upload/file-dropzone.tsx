"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/types";

/**
 * Zona de carga / escaneo (§11).
 *
 * NOTA DE SISTEMA DE DISEÑO: DESIGN_SYSTEM.md no define un componente de dropzone.
 * Está compuesto solo con patrones existentes — superficie Nivel 1, borde `outline-variant`
 * punteado, botones de §8.1, iconos Material Symbols — sin introducir tokens nuevos.
 *
 * Reglas de §11 aplicadas aquí: JPG, PNG, HEIC y PDF; máximo 20 MB por archivo;
 * un PDF de varias páginas es UN documento con N páginas, no N documentos.
 */

export interface PickedFile {
  name: string;
  size: number;
  type: string;
  pages: number;
}

const EXT_HINT = "JPG, PNG, HEIC o PDF · hasta 20 MB por archivo";

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAccepted(file: File) {
  if ((ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Algunos navegadores no reportan MIME para HEIC.
  return /\.(jpe?g|png|heic|heif|pdf)$/i.test(file.name);
}

export function FileDropzone({
  multiple = false,
  onFiles,
  title,
  description,
  className,
}: {
  multiple?: boolean;
  onFiles: (files: PickedFile[]) => void;
  title?: string;
  description?: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const handle = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked: PickedFile[] = [];
    const nextErrors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!isAccepted(file)) {
        nextErrors.push(`${file.name}: formato no admitido.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.push(`${file.name}: supera los 20 MB.`);
        return;
      }
      picked.push({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        // El conteo real de páginas de un PDF lo resuelve el servidor al recibirlo (§11).
        pages: /\.pdf$/i.test(file.name) || file.type === "application/pdf" ? 2 : 1,
      });
    });

    setErrors(nextErrors);
    if (picked.length) onFiles(multiple ? picked : picked.slice(0, 1));
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-primary-container bg-primary-fixed/40"
            : "border-outline-variant bg-surface-container-lowest",
        )}
      >
        <Icon name="upload_file" size={40} className="mb-3 text-on-surface-variant" />
        <p className="mb-1 font-sans text-headline-sm text-on-background">
          {title ?? (multiple ? "Sube las respuestas" : "Sube o escanea la actividad")}
        </p>
        <p className="mb-5 max-w-sm font-sans text-body-sm text-on-surface-variant">
          {description ??
            (multiple
              ? "Puedes seleccionar varios archivos o un PDF con varias entregas de una sola vez."
              : "Arrastra el archivo aquí, tómale una foto o selecciónalo desde tu dispositivo.")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => cameraRef.current?.click()}>
            <Icon name="photo_camera" size={20} />
            Escanear
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="folder_open" size={20} />
            {multiple ? "Subir archivos" : "Subir archivo"}
          </Button>
        </div>

        <p className="mt-4 font-sans text-label-sm text-on-surface-variant">{EXT_HINT}</p>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept=".jpg,.jpeg,.png,.heic,.heif,.pdf,image/jpeg,image/png,image/heic,image/heif,application/pdf"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          className="sr-only"
          accept="image/*"
          capture="environment"
          multiple={multiple}
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-error/20 bg-error-container/40 p-3">
          {errors.map((err) => (
            <li
              key={err}
              className="flex items-center gap-2 font-sans text-body-sm text-on-error-container"
            >
              <Icon name="error" size={20} className="text-[18px]" />
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Lista de archivos ya cargados, reutilizada por la actividad y por las entregas. */
export function FileList({
  files,
  onRemove,
}: {
  files: { id: string; name: string; size: number; pages: number }[];
  onRemove?: (id: string) => void;
}) {
  if (!files.length) return null;
  return (
    <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-container-lowest">
      {files.map((f) => (
        <li key={f.id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded bg-surface-container">
            <Icon
              name={/\.pdf$/i.test(f.name) ? "picture_as_pdf" : "image"}
              size={20}
              className="text-on-surface-variant"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-body-md text-on-background">{f.name}</p>
            <p className="font-sans text-label-sm text-on-surface-variant">
              {humanSize(f.size)} · {f.pages} página{f.pages === 1 ? "" : "s"}
            </p>
          </div>
          {onRemove && (
            <Button
              variant="icon"
              size="icon"
              aria-label={`Quitar ${f.name}`}
              onClick={() => onRemove(f.id)}
            >
              <Icon name="delete" size={20} />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
