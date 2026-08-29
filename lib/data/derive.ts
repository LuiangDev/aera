import type { ActivityStatus, AnswerStatus } from "@/lib/types";

/**
 * §2.4 del sistema de diseño — mapeo de los 5 estados de backend a los 3 badges visuales.
 */
export type StatusBadgeKind = "pendiente" | "revision" | "corregido";

export function answerStatusToBadge(status: AnswerStatus): StatusBadgeKind {
  switch (status) {
    case "PENDING":
    case "PROCESSING":
      return "pendiente";
    case "AI_REVIEWED":
    case "TEACHER_REVIEW":
      return "revision";
    case "FINAL":
      return "corregido";
  }
}

/**
 * §22 — `Activity.status` es un valor DERIVADO, no un campo editable.
 * En el backend real esto vive en una vista/función SQL; aquí se calcula con la
 * misma regla para que la UI no dependa de dónde se computa.
 */
export function deriveActivityStatus(input: {
  questionCount: number;
  answerStatuses: AnswerStatus[];
}): ActivityStatus {
  if (input.questionCount === 0) return "borrador";
  if (input.answerStatuses.length === 0) return "en_correccion";
  const allFinal = input.answerStatuses.every((s) => s === "FINAL");
  return allFinal ? "completada" : "en_correccion";
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  borrador: "Borrador",
  en_correccion: "En corrección",
  completada: "Completada",
};

/** El badge visual que le corresponde al estado derivado de la actividad. */
export function activityStatusToBadge(status: ActivityStatus): StatusBadgeKind {
  switch (status) {
    case "borrador":
      return "pendiente";
    case "en_correccion":
      return "revision";
    case "completada":
      return "corregido";
  }
}
