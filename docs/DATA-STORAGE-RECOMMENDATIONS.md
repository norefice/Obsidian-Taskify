# Recomendaciones para el almacenamiento de tareas (data.json)

Las tareas se guardan en `data.json` mediante la API de Obsidian (`loadData` / `saveData`). Este documento recoge recomendaciones para que el tamaño y el uso de este archivo no sean un problema a medio/largo plazo.

---

## ¿Cuándo es un problema?

- **Hasta varios miles de tareas** (p. ej. 5.000–10.000), un único `data.json` de 1–2 MB suele ser manejable: carga en milisegundos y Obsidian escribe en disco sin problema.
- Puede volverse incómodo con **decenas de miles** de tareas o si se escribe en disco en cada cambio muy seguido (muchas escrituras).

---

## 1. Debounced save (prioridad alta, cambio pequeño)

**Objetivo:** No escribir en disco en cada llamada a `saveTasks()`, sino **solo tras un breve retraso** desde el último cambio (p. ej. 300–500 ms).

**Beneficio:** Varias ediciones seguidas (o muchos cambios en poco tiempo) generan una sola escritura. Menos I/O, menos riesgo de bloqueos y mejor comportamiento con muchas tareas.

**No reduce** el tamaño del archivo, pero hace que crecer no se note tanto.

**Tareas:**
- [ ] Introducir un timer/debounce en el flujo de guardado (p. ej. en `main.ts` o donde se llame a `saveData`).
- [ ] Definir un delay razonable (300–500 ms) y documentarlo o hacerlo configurable.
- [ ] Asegurar que, al cerrar/desactivar el plugin, se vuelque cualquier guardado pendiente (flush del debounce).

---

## 2. Archivar tareas completadas (prioridad alta, mantener archivo acotado)

**Objetivo:** No mantener todas las tareas "Done" en la lista principal indefinidamente. Añadir **archivo de tareas completadas** (p. ej. "Archivar tareas Done" o "Archivar tareas completadas hace más de X días").

**Implementación sugerida:**
- Mover las tareas archivadas a una clave separada en el mismo `data.json` (p. ej. `archivedTasks`) o a un archivo aparte (`archive.json`).
- La lista principal solo muestra tareas no archivadas; el archivo se puede cargar solo cuando el usuario quiera ver el historial.
- Opcional: **retención configurable** (p. ej. archivar solo las "Done" de más de 90 días).

**Beneficio:** El archivo principal crece menos; la experiencia con la lista activa se mantiene ágil.

**Tareas:**
- [ ] Definir modelo de datos para archivo: `archivedTasks: Task[]` en el mismo JSON o archivo separado.
- [ ] Añadir comando o botón "Archivar tareas completadas" (y opcionalmente "Archivar tareas Done de más de X días").
- [ ] Ajustar `getTasks()` (o equivalente) para que por defecto no incluya archivadas; opción de "Ver archivo" que sí las cargue.
- [ ] Documentar en README o en la UI que las tareas archivadas no se muestran en la lista principal pero se conservan.

---

## 3. No guardar en cada tecla

**Objetivo:** El guardado debe ocurrir al **confirmar** (cerrar modal, cambiar estado, etc.), no en cada carácter del formulario.

**Estado actual:** Revisar que no haya listeners que disparen `saveTasks()` en cada `oninput`/`onchange` de campos de texto. Con debounce (punto 1), incluso si hubiera varios eventos, solo se escribiría una vez.

**Tareas:**
- [ ] Revisar `TaskFormModal`, `TaskListView` y cualquier otro sitio que llame a `saveTasks()`.
- [ ] Confirmar que los guardados se disparan en acciones concretas (submit, cambiar estado, eliminar, etc.) y no en cada keystroke.

---

## 4. Opciones a futuro si el volumen crece mucho

Solo considerar si, aun con debounce y archivo, el volumen de tareas o el tamaño de `data.json` siguen siendo un problema.

### 4.1 Dividir por tiempo

- Varios archivos, p. ej. `data-2024.json`, `data-2025.json`.
- Cargar solo el año "actual" (o los que el usuario elija).
- **Tareas:** Definir convención de nombres, lógica de carga/guardado por año, y migración desde un único `data.json` si aplica.

### 4.2 Dividir por tag o categoría

- Un JSON por tag (o por grupo de tags); cargar solo los que se usan en la vista actual.
- **Tareas:** Definir estructura de archivos, índices (p. ej. qué tags existen) y lógica de lectura/escritura.

### 4.3 Guardar tareas como archivos en el vault

- Carpeta dedicada (p. ej. `.taskify/`) con un archivo por tarea o por día.
- Escala bien y encaja con la filosofía "todo son archivos" de Obsidian; requiere un rediseño mayor del modelo de persistencia.
- **Tareas:** Diseño del formato de archivo (frontmatter + contenido), migración desde `data.json`, y políticas de sincronización (evitar conflictos si el usuario edita esos archivos a mano).

---

## Resumen de prioridades

| Prioridad | Medida                         | Objetivo principal              |
|----------|---------------------------------|----------------------------------|
| Alta     | Debounced save                  | Menos I/O, mejor comportamiento |
| Alta     | Archivar tareas Done            | Mantener `data.json` acotado    |
| Media    | Revisar que no se guarde por tecla | Evitar guardados innecesarios   |
| Baja     | Dividir por tiempo/tag o por archivos | Escalar si hace falta más adelante |

---

## Referencias en el código

- **Guardado actual:** `main.ts` → `saveTasks()` → `this.saveData(this.data)`.
- **Estructura de datos:** `types.ts` → `Task`, `TaskPluginData`; `storage.ts` → `mergeWithDefaults`, normalización.
- **Lugares que llaman a guardado:** `TaskListView`, `TaskFormModal`, `TaskListModal`, `main.ts` (comandos, createTaskFromSelection, etc.).

---

*Documento generado para trabajar las mejoras de almacenamiento en futuras iteraciones.*
