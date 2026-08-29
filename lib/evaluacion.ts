/**
 * ESCALA OFICIAL DE EVALUACIÓN — MINEDU (Perú)
 *
 * Fuente normativa:
 * · RVM N.° 00094-2020-MINEDU, "Norma que regula la Evaluación de las Competencias de
 *   los Estudiantes de la Educación Básica", numeral 5.1.1.3, punto 6: la escala de
 *   niveles de logro se usa "en toda la Educación Básica" tal como la establece el CNEB.
 *   Las descripciones de abajo son las del propio CNEB (p. 181) citadas en esa norma.
 * · RVM N.° 048-2024-MINEDU, Anexo I: precisa cuándo la conclusión descriptiva es
 *   obligatoria según el nivel educativo, y exige que "en todos los casos, las
 *   conclusiones descriptivas deben incluir recomendaciones personalizadas orientadas al
 *   desarrollo de cada competencia".
 *
 * Consecuencia para el producto: NO se califica con escala vigesimal (0-20). Se valora el
 * nivel de logro de la competencia a partir de evidencias, usando criterios de evaluación
 * — la rúbrica es el instrumento pertinente según la misma norma.
 */

export type AchievementLevel = "AD" | "A" | "B" | "C";

/** De menor a mayor logro. Útil para ordenar, comparar y calcular el nivel predominante. */
export const LEVEL_ORDER: AchievementLevel[] = ["C", "B", "A", "AD"];

export const ACHIEVEMENT_LEVELS: Record<
  AchievementLevel,
  { code: AchievementLevel; label: string; description: string; icon: string }
> = {
  AD: {
    code: "AD",
    label: "Logro destacado",
    description:
      "Evidencia un nivel superior a lo esperado respecto a la competencia: demuestra aprendizajes que van más allá del nivel esperado.",
    icon: "workspace_premium",
  },
  A: {
    code: "A",
    label: "Logro esperado",
    description:
      "Evidencia el nivel esperado respecto a la competencia, demostrando manejo satisfactorio en todas las tareas propuestas y en el tiempo programado.",
    icon: "check_circle",
  },
  B: {
    code: "B",
    label: "En proceso",
    description:
      "Está próximo o cerca al nivel esperado respecto a la competencia; requiere acompañamiento durante un tiempo razonable para lograrlo.",
    icon: "hourglass_top",
  },
  C: {
    code: "C",
    label: "En inicio",
    description:
      "Muestra un progreso mínimo en la competencia respecto al nivel esperado. Evidencia con frecuencia dificultades, por lo que necesita mayor tiempo de acompañamiento e intervención del docente.",
    icon: "priority_high",
  },
};

/** Nivel y modalidad de la IE: define cuándo la conclusión descriptiva es obligatoria. */
export type EducationLevel = "inicial" | "primaria" | "secundaria";

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  inicial: "Inicial (ciclo II)",
  primaria: "Primaria",
  secundaria: "Secundaria / EBA",
};

/**
 * RVM 048-2024, Anexo I (5.1.1.3 punto 7, 5.1.2.1 b, 5.1.2.2):
 * · Inicial ciclo II — obligatoria con A, B o C; opcional en AD.
 * · Primaria EBR/EBE — obligatoria con B o C; opcional en A o AD.
 * · Secundaria EBR y ciclos de EBA — obligatoria con C; opcional en B, A o AD.
 */
export function conclusionRequired(
  educationLevel: EducationLevel,
  level: AchievementLevel,
): boolean {
  switch (educationLevel) {
    case "inicial":
      return level !== "AD";
    case "primaria":
      return level === "B" || level === "C";
    case "secundaria":
      return level === "C";
  }
}

export function conclusionRequirementCopy(educationLevel: EducationLevel): string {
  switch (educationLevel) {
    case "inicial":
      return "En Inicial, la conclusión descriptiva es obligatoria cuando el nivel es A, B o C.";
    case "primaria":
      return "En Primaria, la conclusión descriptiva es obligatoria cuando el nivel es B o C.";
    case "secundaria":
      return "En Secundaria, la conclusión descriptiva es obligatoria cuando el nivel es C.";
  }
}

export const levelIndex = (level: AchievementLevel) => LEVEL_ORDER.indexOf(level);

export function compareLevels(a: AchievementLevel, b: AchievementLevel) {
  return levelIndex(a) - levelIndex(b);
}

/**
 * Nivel predominante de un conjunto de valoraciones.
 *
 * La norma no define una fórmula aritmética — el nivel de logro lo determina el docente a
 * partir del análisis de evidencias. Aquí se calcula la MODA como sugerencia, y ante
 * empate se toma el nivel MENOR (lectura conservadora, que el docente puede subir).
 * Nunca se promedia: promediar niveles de logro sería reintroducir la lógica vigesimal
 * que la norma reemplaza.
 */
export function predominantLevel(
  levels: AchievementLevel[],
): AchievementLevel | null {
  if (!levels.length) return null;
  const counts = new Map<AchievementLevel, number>();
  levels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));

  let best: AchievementLevel = levels[0];
  let bestCount = 0;
  LEVEL_ORDER.forEach((level) => {
    const count = counts.get(level) ?? 0;
    if (count > bestCount) {
      best = level;
      bestCount = count;
    }
  });
  return best;
}

/** Distribución de niveles, para los resúmenes del docente. */
export function levelDistribution(levels: AchievementLevel[]) {
  return LEVEL_ORDER.slice()
    .reverse()
    .map((level) => ({
      level,
      count: levels.filter((l) => l === level).length,
    }));
}
