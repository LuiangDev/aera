# PROJECT_CONTEXT.md

# AERA — Plataforma de Evaluación y Corrección Educativa con IA

**Nombre del producto: AERA.** (El documento original nunca declaraba un nombre — queda corregido aquí.)

## 1. Descripción del proyecto

AERA es una plataforma web educativa enfocada en **digitalizar, estructurar y corregir actividades académicas mediante OCR e Inteligencia Artificial**.

La idea principal es permitir que un docente pueda utilizar una actividad que ya tiene en formato físico o digital, sin tener que reconstruirla manualmente dentro de una plataforma.

El docente puede:

1. Crear una actividad.
2. Escanear o subir una imagen/PDF de la actividad.
3. La plataforma procesa el documento mediante OCR/IA.
4. El sistema identifica las preguntas y su estructura.
5. El docente revisa y corrige la información detectada.
6. El docente define respuestas esperadas, criterios y puntajes.
7. El docente sube las respuestas de los estudiantes.
8. La plataforma extrae las respuestas.
9. La IA analiza y propone una corrección.
10. El docente revisa, acepta o modifica la calificación.
11. Se almacena el resultado final.

El objetivo principal es **reducir el tiempo que los docentes dedican a digitalizar y corregir evaluaciones**, manteniendo siempre al docente como responsable de la decisión final.

---

# 2. Problema que queremos resolver

Muchas plataformas educativas obligan al docente a crear sus evaluaciones utilizando formatos predeterminados. Esto funciona bien para multiple choice, verdadero/falso, preguntas cerradas y formularios — pero no para actividades que requieren respuestas abiertas, escritas, procedimientos, explicaciones o ensayos cortos con estructuras distintas dentro de una misma actividad.

El problema no es únicamente corregir. Existe una cadena completa de trabajo:

```text
Crear actividad → Digitalizar actividad → Crear preguntas en la plataforma →
Definir respuestas → Recibir respuestas → Leer respuestas → Corregir →
Asignar puntaje → Dar feedback
```

AERA busca reducir especialmente el trabajo manual de este proceso.

---

# 3. Propuesta de valor

> "No tienes que adaptar tu evaluación a la plataforma. La plataforma se adapta a tu evaluación."

El docente debería poder tomar una actividad existente, escanearla y utilizarla como punto de partida. La plataforma debe priorizar flexibilidad, libertad en el formato de las actividades, automatización, revisión humana, facilidad de uso y ahorro de tiempo.

---

# 4. Diferenciador

El producto **no debe imponer un único formato de evaluación**: opción múltiple, respuesta corta, respuesta abierta, respuesta desarrollada, problemas matemáticos, preguntas conceptuales, ejercicios con procedimientos, o combinaciones de los anteriores. El docente no debería tener que convertir manualmente una actividad física en un formulario digital antes de poder utilizarla.

---

# 5. Riesgo técnico principal — validar antes de construir (nuevo, hallazgo de la auditoría)

Todo el producto depende de que el OCR + IA lean razonablemente bien exámenes con layouts arbitrarios y, en muchos casos, **manuscritos**. Esto es un problema de comprensión de documentos genuinamente difícil, y no debe tratarse como un supuesto resuelto solo porque el flujo conceptual (§7) se ve limpio en un diagrama.

**Antes de construir el flujo completo**, correr una prueba técnica corta: tomar 5-10 hojas reales de docentes (foto de celular, no escaneo limpio — así es como realmente van a llegar los archivos) y validar que la extracción de preguntas y respuestas es viable con el enfoque elegido.

**Recomendación de enfoque** (a validar con esa prueba, no una decisión cerrada):

- **Opción A — recomendada:** usar un modelo multimodal (LLM con visión, ej. Claude o GPT-4o con capacidad de visión) directamente para leer la imagen y devolver la estructura, en un solo paso. Los modelos multimodales actuales manejan mejor manuscrito y layouts irregulares que un OCR clásico separado de un paso de estructuración por texto, y reduce la complejidad del pipeline (un solo proveedor, una sola llamada por documento en vez de dos sistemas encadenados).
- **Opción B:** OCR clásico (ej. Google Document AI, AWS Textract) + LLM de texto para estructurar lo ya extraído. Más económico por token en documentos simples, pero más frágil frente a manuscrito y layouts no estandarizados — el punto exacto donde este producto necesita ser fuerte.

Ambas opciones deben llamarse **siempre desde el servidor** (ver §27) — nunca exponer la API key del proveedor de IA/OCR al frontend.

---

# 6. Objetivo del MVP

El MVP no busca convertirse inicialmente en un LMS completo. El objetivo es validar una hipótesis:

> Los docentes están dispuestos a subir o escanear sus actividades y respuestas para que la plataforma las convierta en información estructurada y utilice IA para proponer correcciones, siempre manteniendo el docente el control de la calificación final.

```text
Escanear → Extraer → Estructurar → Definir criterios →
Escanear respuestas → Corregir con IA → Revisar por docente → Calificación final
```

---

# 7. Usuarios del MVP

## 7.1 Docente

El usuario principal. Puede: registrarse, iniciar sesión, crear actividades, subir o escanear actividades (individualmente o **en lote**, ver §12), revisar el contenido extraído, editar preguntas, definir respuestas esperadas/criterios/puntajes, registrar estudiantes, subir respuestas, revisar correcciones de IA, modificar calificaciones, agregar comentarios, consultar resultados, y **exportar el resultado de un estudiante** (ver §8.2 — nuevo, resuelve cómo llega el feedback a alguien si no hay portal de estudiante).

## 7.2 Estudiante

No es el foco principal del primer MVP. Existe como entidad para asociar actividad → estudiante → entrega → respuestas → calificación. No se construye un portal ni una experiencia de login para estudiantes en esta fase.

**Cómo recibe feedback un estudiante sin portal (nuevo — vacío que tenía el documento original):** el docente exporta o imprime el resultado individual (ver §8.2) y lo entrega por su propio medio (impreso, correo, o cualquier canal que ya use). Un portal de estudiante con acceso propio queda para Fase 3 (§30).

---

# 8. Flujo principal del MVP

```text
LOGIN → DASHBOARD → CREAR ACTIVIDAD → SUBIR/ESCANEAR ACTIVIDAD (individual o lote) →
PROCESAMIENTO OCR + IA → EXTRACCIÓN DE PREGUNTAS → REVISIÓN DEL DOCENTE →
DEFINIR RESPUESTAS/CRITERIOS → GUARDAR ACTIVIDAD → SUBIR RESPUESTAS DE ESTUDIANTES →
OCR + IA → ANÁLISIS DE RESPUESTAS → CALIFICACIÓN SUGERIDA → REVISIÓN DEL DOCENTE →
APROBAR/MODIFICAR → CALIFICACIÓN FINAL → RESULTADOS → EXPORTAR/ENTREGAR FEEDBACK
```

## 8.1 Autenticación

Registro, login, logout, recuperación de contraseña (vía Supabase Auth — requiere dominio de email configurado). El usuario principal es el docente. No es necesario inicialmente: SSO, Google Login, roles administrativos complejos.

## 8.2 Exportar resultado individual (nuevo — MVP)

Vista imprimible / exportable a PDF por estudiante: pregunta, respuesta, puntaje final, feedback. Es la pieza mínima que cierra el ciclo "la IA generó feedback → el feedback llega a alguien" sin necesitar un portal de estudiante completo. Botón "Exportar" disponible desde la vista de resultados de cada estudiante (ver §17).

---

# 9. Dashboard

Después de iniciar sesión, el docente ve sus actividades: nombre, materia, cantidad de estudiantes, estado (derivado, ver §22), cantidad de respuestas corregidas, acciones disponibles. Si no tiene actividades todavía, ver el estado vacío diseñado en DESIGN_SYSTEM.md §8.11 — no es una pantalla secundaria, suele ser la primera que ve un docente nuevo.

```text
Dashboard

Hola 👋

[ + Nueva actividad ]

Mis actividades
--------------------------------
Matemática - Fracciones
25 estudiantes · 18 corregidos
Estado: En corrección
[Continuar]
--------------------------------
Comunicación - Comprensión lectora
30 estudiantes · 30 corregidos
Estado: Completada
[Ver resultados]
```

---

# 10. Crear actividad

Campos: nombre, materia, descripción, fecha, puntaje máximo.

```text
Nombre: Comprensión lectora - El Principito
Materia: Comunicación
Descripción: Evaluación de comprensión lectora
[Crear actividad]
```

---

# 11. Carga o escaneo de actividad

La funcionalidad principal del MVP. El docente puede subir una imagen, tomar una fotografía, o subir un PDF.

```text
┌───────────────────────────────┐
│          📷 Escanear          │
│             o                │
│        Subir archivo          │
└───────────────────────────────┘
```

**Formatos y límites (nuevo — no estaban definidos):**
- Formatos aceptados: JPG, PNG, **HEIC** (convertir a JPG en el servidor al recibirlo — es el formato nativo de fotos de iPhone y el caso más común de subida desde celular) y PDF.
- Tamaño máximo por archivo: 20 MB.
- Un PDF de varias páginas se trata como **una sola actividad/entrega con N páginas**, no como N documentos separados — el pipeline de OCR/IA procesa todas las páginas de un mismo documento como una unidad antes de extraer preguntas.

**Carga en lote (nuevo — vacío real del documento original):** un docente con 25-30 estudiantes no va a subir una foto a la vez. La pantalla de "Subir respuestas de estudiantes" debe soportar seleccionar varios archivos o un PDF con varias entregas de una vez, con un paso posterior donde el docente asigna cada archivo/página al estudiante correspondiente (asignación manual asistida, no automática en el MVP — reconocer automáticamente de quién es cada hoja es un problema aparte, más difícil, que no hace falta resolver todavía).

Después de cargar:

```text
Procesando actividad...
✓ Archivo recibido
✓ Texto detectado
✓ Preguntas identificadas
✓ Estructura detectada
[Revisar actividad]
```
Ver el componente de progreso por pasos en DESIGN_SYSTEM.md §8.10 — esta pantalla se ve con mucha frecuencia y necesita ese componente, no un spinner genérico.

---

# 12. OCR

Responsabilidad: `Imagen → Texto`. Debe intentar extraer texto, preguntas, opciones, respuestas, números de pregunta, estructura básica, y texto manuscrito cuando la tecnología elegida lo permita (ver §5 sobre la validación de esto).

La información extraída **nunca** debe considerarse automáticamente perfecta. El docente debe poder revisarla — y para que esa revisión sea eficiente y no un re-trabajo completo, cada campo extraído lleva un **score de confianza** (ver §14, §28) que la interfaz usa para resaltar visualmente lo dudoso en vez de pedirle al docente que revise todo con el mismo nivel de atención.

---

# 13. Inteligencia Artificial

## 13.1 Estructuración

A partir del contenido extraído, identifica preguntas, tipo de pregunta, opciones, respuestas, y relaciones entre preguntas y respuestas.

## 13.2 Corrección

Analiza `Pregunta + Respuesta esperada + Criterios + Respuesta del estudiante` y produce evaluación, puntaje sugerido, justificación y feedback.

---

# 14. Tipos de preguntas

El sistema debe ser flexible: `multiple_choice`, `short_answer`, `open_ended`, `long_answer`. La arquitectura debe permitir agregar posteriormente `true_false`, `matching`, `numeric`, `essay`, `drawing`, `formula`, `code` — no es necesario implementarlos todos en el MVP.

---

# 15. Editor de actividad

Después del procesamiento, el docente revisa el resultado:

```text
Pregunta 1
Tipo: [ Multiple Choice ]
Confianza de extracción: Alta ✓
Pregunta: ¿Cuánto es 5 + 3?
Opciones: A. 6  B. 7  C. 8  D. 9
Respuesta correcta: C
Puntaje: 2
```

El docente puede editar texto, tipo, opciones, respuesta correcta, puntaje, criterios. **El campo "Confianza de extracción" es nuevo** — ver §14/§28: cuando es Media o Baja, la fila se resalta (borde en `status-pending`) para que el docente sepa dónde mirar primero, en vez de revisar las 20 preguntas con el mismo esfuerzo.

---

# 16. Respuestas esperadas y rúbricas

Para preguntas abiertas no siempre existe una respuesta única. Estructura de criterios (nuevo — antes era solo texto libre con checkmarks, ahora es una lista real con puntaje por criterio para que la IA pueda evaluar cada uno por separado):

```text
Respuesta esperada:
"Una fracción representa una parte de un todo dividido en partes iguales."

Criterios (cada uno con su propio puntaje, suman el puntaje total de la pregunta):
1. Explica qué representa una fracción — 2 pts
2. Menciona que el todo está dividido — 1.5 pts
3. Hace referencia a partes iguales — 1.5 pts

Puntaje total: 5 puntos
```

La IA utiliza estos criterios, ya desglosados, para generar una evaluación sugerida por criterio individual, no solo un puntaje global sin justificación granular.

---

# 17. Carga de respuestas de estudiantes

El docente sube las respuestas de los estudiantes, individualmente o en lote (§11). Formatos: imagen, PDF (mismos límites de §11).

```text
Seleccionar estudiante(s) → Subir respuesta(s) → OCR → Identificar respuestas → Relacionar con preguntas
```

Desde la vista de resultado de cada estudiante, el docente puede usar **Exportar** (§8.2) para generar el PDF que le entrega.

---

# 18. Corrección con IA

La IA devuelve una **calificación sugerida**:

```text
Pregunta 2
Respuesta del estudiante: "Una fracción sirve para representar una parte de algo."
--------------------------------
Evaluación IA: La respuesta demuestra comprensión parcial del concepto.
Puntaje sugerido: 4 / 5
Feedback: La respuesta identifica correctamente que una fracción representa
una parte, pero no menciona que el todo se divide en partes iguales.
--------------------------------
[ Aprobar 4/5 ]  [ Editar ]
```

Esta pantalla usa el patrón visual de DESIGN_SYSTEM.md §8.9 (sugerido por IA vs. confirmado) — es el caso de uso central de ese componente.

---

# 19. El docente mantiene el control

La IA nunca debe tener la autoridad final sobre una calificación. El sistema diferencia `AI Score` de `Teacher Score` (ver DESIGN_SYSTEM.md §8.9 para el patrón visual). La nota final siempre pertenece al docente.

---

# 20. Estados de una respuesta

```text
PENDING → PROCESSING → AI_REVIEWED → TEACHER_REVIEW → FINAL
```

Este es el único estado "de bajo nivel", por respuesta. Ver §22 para cómo se deriva de aquí el estado visible de la actividad completa, y DESIGN_SYSTEM.md §2.4 para el mapeo a los 3 badges visuales — la versión anterior de este documento tenía tres vocabularios de estado sin relación declarada entre sí; queda resuelto ahí.

---

# 21. Resultados

El docente visualiza estudiantes, puntajes, promedio, estado de corrección, preguntas, feedback:

```text
Comprensión lectora
Estudiantes: 25
Promedio: 15.8 / 20
--------------------------------
Ana       18/20    ✓ Revisado
Carlos    15/20    ✓ Revisado
María     17/20    ✓ Revisado
Pedro     12/20    ⚠ Revisar
```

---

# 22. Modelo de datos

Entidades principales: `User`, `Teacher`, `Activity`, `Question`, `Student`, `Submission`, `Answer`, `GradingResult`, `Rubric`.

## User
```text
id, email, name, created_at
```

## Activity
```text
id, teacher_id, title, subject, description, max_score, created_at, updated_at
```
**`status` deja de ser un campo libre seteado a mano — es un valor derivado (nuevo, resuelve la inconsistencia de §20):**
```text
status = "borrador"       si la actividad no tiene preguntas definidas
status = "en_correccion"  si tiene preguntas y al menos una Answer con status != FINAL
status = "completada"     si todas las Answer de todos los estudiantes están en FINAL
```
Se calcula (vista/función SQL o campo derivado en el backend), no se guarda como texto libre editable desde la UI.

## Question
```text
id, activity_id, number, type, text, expected_answer, points, created_at, updated_at
rubric: Criterion[]   // antes era texto libre; ahora una lista estructurada
```
```text
type Criterion = { id: string, description: string, points: number }
```

## Student
```text
id, teacher_id, name, identifier, created_at
```

## Submission
```text
id, activity_id, student_id, file_url, status, created_at, processed_at
```

## Answer
```text
id, submission_id, question_id, extracted_text, created_at
confidence: number         // 0–1, nuevo — de dónde viene, ver §28
source_region?: string     // referencia a la zona del documento original (bounding box), nuevo —
                            // permite al docente ver de qué parte de la imagen salió esta extracción
```

## GradingResult
```text
id, answer_id, ai_score, teacher_score, ai_feedback, teacher_feedback, status, created_at, updated_at
```

---

# 23. Relaciones

```text
Teacher
   ├── Activities
   │       └── Questions
   └── Students
           └── Submissions
                   └── Answers
                           └── GradingResult
```

---

# 24. Stack tecnológico

**Frontend / Full-stack:** Next.js, TypeScript, App Router.
**UI:** Tailwind CSS + **shadcn/ui** (primitivos restyleados con los tokens de DESIGN_SYSTEM.md, nunca sus colores por defecto — ver ese documento §9-10), diseño responsive, accesibilidad verificada (DESIGN_SYSTEM.md §11).
**Backend/BaaS:** Supabase — Authentication, PostgreSQL, Storage, Row Level Security, Edge Functions cuando sean necesarias.
**Database:** PostgreSQL, con relaciones claras entre Teachers, Activities, Questions, Students, Submissions, Answers, GradingResults.
**Storage:** Supabase Storage para imágenes, PDFs, documentos originales y archivos procesados — los archivos originales se conservan siempre.

---

# 25. Arquitectura

```text
                     DOCENTE
                        │
                        ▼
                ┌─────────────────┐
                │     Next.js     │
                │   App Router    │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │    Supabase     │
                │ Auth · Postgres │
                │ Storage · Edge  │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │  OCR + IA (§5)  │
                └────────┬────────┘
                         ▼
                 STRUCTURED DATA
                         ▼
                  TEACHER REVIEW
```

---

# 26. Procesamiento de documentos

Preferiblemente asíncrono:

```text
UPLOAD → STORAGE → PROCESSING → OCR → AI EXTRACTION → STRUCTURED JSON → DATABASE → READY
```

**Notificación de progreso al frontend (nuevo — no estaba definido):** usar **Supabase Realtime**, suscrito a la columna `status` de `Submission`/`Activity` — el frontend refleja el avance sin tener que hacer polling manual. Es la opción más simple dado que ya se usa Supabase como backend completo.

**Control de costo y cola (nuevo — riesgo operativo no mencionado):** corregir una actividad de 25-30 estudiantes con varias preguntas cada una implica decenas de llamadas al proveedor de IA por actividad. Las Edge Functions de Supabase tienen límite de tiempo de ejecución — un pipeline OCR+IA encadenado por documento puede necesitar dividirse en pasos (una función que dispara el procesamiento y encola, no una sola función que hace todo el pipeline de punta a punta de forma síncrona). Diseñar esto como una cola desde el inicio evita tener que rehacerlo cuando haya más de un par de docentes usando la plataforma a la vez.

---

# 27. Comunicación con IA

Las llamadas al proveedor de IA/OCR se realizan **siempre desde backend/server-side**. Nunca colocar API keys privadas en el frontend.

```text
Next.js → Server Action / Route Handler → AI Provider → Structured Response → Database
```

El proveedor de IA debe estar desacoplado de la interfaz, para poder cambiarlo sin modificar toda la aplicación (ver §5 sobre la decisión de proveedor).

---

# 28. Respuesta estructurada de IA

```json
{
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice",
      "text": "¿Cuánto es 5 + 3?",
      "options": ["6", "7", "8", "9"],
      "correct_answer": "8",
      "points": 2,
      "confidence": 0.94
    },
    {
      "number": 2,
      "type": "open_ended",
      "text": "Explica qué es una fracción.",
      "points": 5,
      "confidence": 0.71
    }
  ]
}
```

**`confidence` es nuevo** (0–1) — sin él, la interfaz no puede distinguir una extracción confiable de una dudosa, y el docente termina revisando todo con el mismo esfuerzo, que es justo lo que el producto busca evitar. La estructura se valida antes de guardarse en la base de datos; cualquier pregunta con `confidence` bajo un umbral (sugerido: 0.75) se marca para revisión prioritaria en el editor (§15).

---

# 29. Seguridad

Cada docente accede únicamente a sus propios datos, vía Row Level Security:

```text
Teacher A → Activities A, Students A, Submissions A, Results A
Teacher B → Activities B, Students B, Submissions B, Results B
```

**Nuevo — precisión sobre RLS:** cada tabla debe tener una policy explícita, no asumida por herencia. `Activity` y `Student` tienen `teacher_id` directo. `Question` hereda de `Activity` (policy vía join a `activity_id → teacher_id`). `Submission` hereda de `Activity`. `Answer` hereda de `Submission → Activity`. `GradingResult` hereda de `Answer → Submission → Activity`. Escribir cada policy explícitamente en la migración, no depender de que el join "funcione solo" — con RLS, un join mal escrito falla en silencio (devuelve cero filas) en vez de dar error, así que hay que probarlas una por una.

Los archivos de estudiantes y actividades no son públicamente accesibles por defecto. Las API keys privadas permanecen en server-side.

---

# 30. UX / Principios de diseño

La plataforma debe sentirse simple, moderna, clara, profesional, orientada a docentes no técnicos. El flujo principal debe ser evidente: `Crear actividad → Escanear → Revisar → Corregir`. El usuario siempre debe saber en qué paso está, qué está procesando el sistema, qué necesita revisar, qué resultado produjo la IA, y qué acción debe realizar.

---

# 31. Principio de confianza en IA

Nunca presentar las decisiones de IA como hechos absolutos. Usar lenguaje como "Calificación sugerida por IA", "Revisa antes de aprobar", "La IA detectó...", "El sistema considera que...". Evitar "Respuesta incorrecta" o "Calificación definitiva" cuando todavía no ha intervenido el docente. Ver el componente dedicado a esto en DESIGN_SYSTEM.md §8.9.

---

# 32. MVP: funcionalidades incluidas

**Autenticación:** registro, login, logout.
**Actividades:** crear, editar, ver, eliminar.
**Documentos:** subir imagen/PDF (individual y en lote, §11), procesar, OCR, extracción por IA con score de confianza.
**Preguntas:** visualizar, editar, definir tipo/respuestas/puntaje/criterios estructurados (§16).
**Estudiantes:** crear, asociar a actividad.
**Respuestas:** subir (individual y en lote), procesar OCR, asociar a pregunta.
**Corrección:** generar corrección IA, mostrar puntaje sugerido con su origen visualmente distinguido (§8.9), aprobar, modificar.
**Resultados:** ver notas, estado, promedio, **exportar resultado individual en PDF** (§8.2 — nuevo).

---

# 33. Funcionalidades fuera del MVP

No implementar inicialmente: app móvil nativa, gestión completa de colegios, padres de familia, chat, videollamadas, LMS completo, asistencia, calendario académico, pagos, gamificación, integración con Google Classroom o Moodle, analítica educativa avanzada, dashboards institucionales, sistema complejo de roles, SSO, reconocimiento perfecto de escritura manuscrita, soporte para todos los tipos posibles de preguntas, **portal de estudiante con login propio** (se cubre parcialmente vía exportación, §8.2), **reproductor de feedback por voz** (estaba en el sistema de diseño sin estar en el alcance — ver DESIGN_SYSTEM.md §8.7, queda fuera hasta que se confirme), **historial de versiones de una calificación** (si un docente cambia una nota después de FINAL, por ahora solo queda el `updated_at`, sin log completo de cambios — suficiente para el MVP, insuficiente si algún día hay que responder a un reclamo de nota).

---

# 34. Roadmap conceptual

## Fase 1 — MVP
`Teacher → Create Activity → Upload/Scan → OCR → AI Extraction → Edit Questions → Define Answers → Upload Student Responses → AI Grading → Teacher Review → Final Grade → Export`

## Fase 2
Mejor reconocimiento de escritura manuscrita, más tipos de preguntas, rúbricas avanzadas ya con desglose por criterio (base puesta en §16), reportes, mejor gestión de estudiantes, **historial de cambios de calificación**.

## Fase 3
Portal del estudiante, integraciones LMS, instituciones, roles administrativos, analítica, automatización avanzada.

---

# 35. Métrica principal del MVP

No debe ser únicamente "cantidad de actividades creadas". Medir principalmente **tiempo ahorrado al docente**, comparando corrección manual vs. asistida por IA.

**Nota sobre cómo medir esto (nuevo — el documento original no decía cómo capturar el baseline):** no hay forma automática de saber cuánto tardaría un docente sin la plataforma. Para tener un número real, pedir un self-report simple al terminar la primera actividad ("¿cuánto tiempo te habría tomado corregir esto a mano?") — es una estimación, no un dato exacto, pero es mejor que no tener baseline en absoluto. También medir: porcentaje de correcciones aceptadas sin cambios, porcentaje modificadas, tiempo promedio de revisión, cantidad de actividades/respuestas procesadas, errores detectados por el docente, uso recurrente.

---

# 36. Hipótesis de producto

**Principal:** los docentes valorarán una herramienta que les permita digitalizar actividades existentes y recibir una corrección asistida por IA sin adaptar previamente sus evaluaciones a formatos rígidos.

**Secundaria:** los docentes usarán IA para corregir respuestas siempre que puedan revisar la evaluación, modificar calificación y feedback, la plataforma muestre claramente qué fue generado por IA (§8.9), y el docente conserve el control final.

---

# 37. Regla fundamental del proyecto

La plataforma no se diseña alrededor de "¿cómo hacemos que el docente cree evaluaciones dentro de nuestra plataforma?" sino de "¿cómo hacemos que la plataforma entienda las evaluaciones que el docente ya utiliza?". Esta diferencia guía las decisiones de producto, UX, arquitectura y funcionalidades.

---

# 38. Prioridad de desarrollo

```text
1. Upload / Scan (individual y lote)
2. OCR + IA (validado técnicamente primero, §5)
3. Extracción de preguntas con confidence
4. Editor de preguntas
5. Definición de respuestas/criterios estructurados
6. Upload de respuestas (individual y lote)
7. OCR de respuestas
8. Corrección IA
9. Revisión docente (patrón sugerido-vs-confirmado)
10. Calificación final
11. Exportar resultado individual
```

Todo lo que no contribuya directamente a este flujo se considera secundario para el MVP.

---

# 39. Resultado esperado del MVP

```text
Un docente inicia sesión → crea "Matemática - Fracciones" → sube una fotografía de la actividad →
la plataforma la analiza e identifica 5 preguntas, cada una con su score de confianza →
el docente revisa y corrige, prestando más atención a las de confianza baja →
define respuestas esperadas, criterios desglosados y puntajes → guarda la actividad →
selecciona un estudiante → sube la fotografía de sus respuestas →
la plataforma extrae las respuestas → la IA las analiza contra los criterios →
propone 18/20, claramente marcado como sugerencia de IA →
el docente revisa, modifica una respuesta de 3/4 a 4/4 → la calificación final queda en 19/20 →
el docente exporta el resultado en PDF → se lo entrega al estudiante.
```

---

# 40. Definición de éxito

El MVP será exitoso si un docente puede completar el flujo completo **sin tener que reconstruir manualmente la actividad**, si la corrección asistida por IA reduce significativamente el trabajo necesario para corregirla, y si el resultado final llega a alguien (el estudiante) de forma completa, no solo hasta la pantalla del docente.

```text
"Subo mi actividad → la plataforma la entiende → reviso lo que detectó, priorizando lo dudoso →
subo las respuestas → la IA corrige y me muestra claramente qué es suyo y qué es mío →
yo reviso → exporto y entrego → listo."
```
