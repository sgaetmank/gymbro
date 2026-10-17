# Bloque 8b-2: `editar_rutina_trainer`, render y modales

Archivo: `src/screens/editar_rutina_trainer.tsx`. Esta parte cubre las líneas 515 a 1162 (render y modales). Las ~490 líneas restantes son `StyleSheet`. La mecánica del arrastre (`Sortable.Flex`, `DragHandle`, `cardWidth`) está en el documento 16; acá se ve el árbol como pantalla.

## 1. Estructura del render

```
SafeAreaView
├─ Header:  ‹ (goBack)  ·  "Editar"  ·  [Guardar | Guardado ✓]
├─ Animated.ScrollView
│    "Rutina de <nombre>"     (su onLayout mide el ancho disponible)
│    Sortable.Flex de días
│       día  →  header (≡, nombre, 🗑)
│          Sortable.Flex de bloques
│             bloque  →  header (≡, "Bloque N", 🗑)
│                Sortable.Flex de ítems
│                   ítem  →  tarjeta (≡, info, 🗑)
│                [＋ Ejercicio] [＋ Descanso]
│          [＋ Agregar Bloque]
│    [＋ Añadir Día]
├─ Modal: agregar ejercicio
└─ Modal: agregar descanso
```
Es el mismo árbol de `mi_rutina_user` (días → bloques → ítems), con controles de edición. Las `key` son los ids de los datos (`Sortable.Flex` también las usa para saber qué elemento se movió).

## 2. El botón Guardar

```tsx
disabled={!hasUnsavedChanges}
style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
{hasUnsavedChanges ? 'Guardar' : 'Guardado ✓'}
```
- **Estado derivado:** `hasUnsavedChanges` compara el borrador con la "foto" del último guardado (`JSON.stringify(days) !== savedSnapshot`). No es un estado: se calcula en cada render.
- Una sola variable controla si el botón se puede tocar, su estilo y su texto.
- `‹` ejecuta `navigation.goBack()`, que dispara el `beforeRemove` del documento 03 si hay cambios sin guardar (8b-3).
- La única confirmación visual de guardado es el cambio de texto a "Guardado ✓"; `saveChanges` es síncrono.

## 3. El árbol editable

### Controles por nivel
Cada nivel (día, bloque, ítem) tiene una barrita de arrastre `DragHandle` (documentos 04 y 16) y un botón 🗑 que llama a `deleteDay`, `deleteBlock` o `deleteItem`.

- **El nombre de los bloques depende del orden:** `Bloque ${blockIndex + 1}` usa el índice del `.map`, así que al arrastrar un bloque los nombres se renumeran solos. Los días, en cambio, conservan el nombre guardado.
- **Los borrados no piden confirmación.** Un toque en 🗑 elimina un día entero con todos sus bloques. La red de seguridad es el modelo de borrador: nada se guarda hasta tocar Guardar, y "Salir sin guardar" descarta todo. Pero dentro de la sesión no hay "deshacer".

### Las tarjetas de ítem
- `item.type === 'rest' ? styles.restCard : styles.exerciseCard`: estilo distinto según el tipo (unión discriminada).
- El nombre del ejercicio repite `getExerciseById(...)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')`: es la **cuarta copia** de ese patrón (con `mi_rutina_user` y dos veces en `entrenar_dia_user`: la tarjeta del paso y el modal "Ver rutina").
- Comentarios: `{item.comments ? (<Text/>) : null}`. Es un **tercer estilo** de renderizado condicional en la app (`!== ''`, `!!x?.trim()`, ternario con `null`). Los tres funcionan; solo difiere la convención.
- El descanso se muestra como `⏳ Descanso: {item.time} {item.unit}` **sin singular/plural** ("1 minutos"), a diferencia de `mi_rutina_user` y `entrenar_dia_user`, que usan `formatRestUnit`.

### Lo que NO se puede hacer
- **No hay edición de un ítem ya agregado.** Cada tarjeta ofrece reordenar (arrastrando) y borrar. Para corregir las series de un ejercicio hay que borrarlo y volver a agregarlo.
- **No se pueden renombrar días ni bloques.** Esto cierra la duda del documento 11: el nombre duplicado "Día 3" no se puede corregir, salvo borrando el día.
- **No hay validación de estructura al guardar:** se puede guardar un día sin bloques o un bloque vacío (el alumno vería un "Bloque 1" sin ejercicios).

## 4. El modal de ejercicio

### Piezas de interfaz
```tsx
<Modal visible transparent animationType="slide" onRequestClose={...}>
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={modal}>
      <ScrollView keyboardShouldPersistTaps="handled"> ...formulario... </ScrollView>
```
- **`Modal`** con `transparent` y `slide`; `onRequestClose` cierra con el botón atrás de Android.
- **`KeyboardAvoidingView`** y **`keyboardShouldPersistTaps="handled"`** (ver pregunta 2).
- **El modal de descanso no usa `KeyboardAvoidingView`.** Tiene un único campo, pero en horizontal el teclado podría tapar el botón (a verificar).
- A diferencia de los modales del QR y de `entrenar_dia_user`, **no hay un `Pressable` de fondo**: solo se cierra con la `×` o el botón atrás.

### El patrón de autocompletado
```tsx
onChangeText={(text) => { setExerciseName(text); setSelectedExerciseId(null); }}
...
onPress={() => { setExerciseName(exercise.name); setSelectedExerciseId(exercise.id); }}
```
Dos estados cooperan:
- `exerciseName`: el **texto** del campo (lo que ve el entrenador).
- `selectedExerciseId`: el **ejercicio realmente elegido** (lo que se guarda).

`addExercise` exige `selectedExerciseId`, así que no se puede enviar un nombre escrito a mano: hay que elegir uno del catálogo.

### Los mensajes de la zona de sugerencias
| Condición | Mensaje |
|---|---|
| `loading` | "Cargando ejercicios…" |
| `error` | "No se pudieron cargar… Tocá para reintentar" (llama a `retry`, el mecanismo `attempt` del documento 02) |
| `!loading && !error && busqueda.length < 2` | "Escribí al menos 2 letras para buscar" |
| `!loading && !error && busqueda.length >= 2 && 0 resultados` | "No se encontraron ejercicios" |
| (con resultados) | lista de hasta 3 sugerencias, con nombre y grupo muscular |

Las condiciones están escritas con `&&` y son **mutuamente excluyentes**.

### La búsqueda
```tsx
const busqueda = normalizar(exerciseName.trim());
const ejerciciosFiltrados = busqueda.length < 2 ? [] : exercises.filter(e => normalizar(`${e.name} ${e.muscleGroup}`).includes(busqueda)).slice(0, 3);
```
- Busca en nombre **y** grupo muscular, sin tildes (mismo `normalizar` que `buscar_usuario_trainer`, duplicado).
- Con ~1300 ejercicios, exige 2 letras mínimo.
- **Solo muestra 3 sugerencias**: no hay forma de explorar más que afinando el texto. El `filter` recorre todo el catálogo y recién después `slice` recorta.
- Se calcula en el cuerpo del componente, es decir, en cada render (ver pregunta 6).

### Campos y errores
Series, repeticiones y peso son `TextInput` con `keyboardType="numeric"`; comentarios es `multiline`. Cada `onChangeText` es el setter directo (`onChangeText={setSeries}`). El teclado no impide pegar texto: la validación real es la de 8b-1. El error se muestra con `exerciseFormError !== '' && <Text>`.

## 5. El modal de descanso

- **Selector de unidad:** dos `TouchableOpacity` casi idénticos (Minutos / Segundos) con el estilo condicional `restUnit === 'minutos' && styles.selectedUnit`. Están escritos dos veces a mano; en `signup` el mismo patrón se resolvió con `OptionChips` y `.map`.
- Un `TextInput` para el tiempo (`placeholder="Ej: 1.5"`) y un botón "Agregar".
- Arranca con `'minutos'` (lo reinicia `openRestModal`).

## 6. Patrones de React vistos en esta pantalla
| Patrón | Dónde |
|---|---|
| Estado derivado (`hasUnsavedChanges`, `ejerciciosFiltrados`) | Guardar, sugerencias |
| Componentes controlados | todos los `TextInput` |
| Renderizado condicional en cadena | mensajes de sugerencias |
| Estilos condicionales con arrays | unidad, Guardar, tarjetas |
| Listas con `key` por id | días, bloques, ítems, sugerencias |
| Callback con función de orden | `onDragEnd` de `Sortable.Flex` (documento 16) |
| Medir el layout con `onLayout` | ancho de las tarjetas (documento 16) |

## 7. Lista para el bloque 9 (continúa la del documento 11)
57. Alcance funcional: hoy no se pueden editar ítems ya cargados ni renombrar días/bloques. Decidir si queda así o se agrega edición (cambio de interfaz, no pantallas nuevas).
58. Selector de ejercicios: con un catálogo propio en la BD, la búsqueda pasa al servidor (con *debounce*) y puede mostrar más resultados o filtrar por grupo muscular.
59. Validar la estructura al guardar (días sin bloques, bloques sin ejercicios) en cliente y servidor, y decidir qué se permite.
60. Confirmación o "deshacer" al borrar días y bloques.
61. `saveChanges` pasa a ser asíncrono: mostrar "Guardando…", manejar errores de red y no pasar a "Guardado ✓" (ni actualizar el snapshot) hasta que el servidor confirme.
62. Unificar el pluralizado del descanso y las copias del nombre del ejercicio en un helper o componente compartido.

## 8. Preguntas de verificación, con respuestas

### 1. ¿Cómo funciona el autocompletado (texto + id) y por qué `onChangeText` hace `setSelectedExerciseId(null)`?
El campo guarda dos cosas distintas: el **texto** que el entrenador escribe (`exerciseName`) y el **id del ejercicio elegido** (`selectedExerciseId`). El texto sirve para buscar; el id es el dato que se guarda en la rutina.

Flujo:
1. El entrenador escribe → se actualiza el texto y la selección pasa a `null` (todavía no eligió nada).
2. Aparecen sugerencias; al tocar una, el campo se rellena con su nombre y se guarda su id.
3. `addExercise` exige que `selectedExerciseId` no sea `null`.

Por qué se borra la selección al escribir: si no se hiciera, el entrenador podría elegir "Press de banca", luego editar el texto a "Sentadilla" y el campo mostraría "Sentadilla" mientras el id seguiría siendo el de "Press de banca": se guardaría un ejercicio distinto del que ve. Reiniciar la selección asegura que **lo que se ve y lo que se guarda coincidan**, y obliga a elegir una sugerencia en vez de aceptar texto libre.

### 2. ¿Qué hacen `KeyboardAvoidingView` y `keyboardShouldPersistTaps="handled"`, y por qué `behavior` depende de la plataforma?
- **`KeyboardAvoidingView`:** cuando aparece el teclado, tapa la parte inferior de la pantalla, incluidos campos y botones. Este componente ajusta el layout para que el contenido quede visible.
- **`behavior`:** iOS y Android manejan el teclado de forma distinta. En iOS el teclado se superpone a la vista, y `'padding'` agrega relleno inferior del alto del teclado. En Android la ventana suele redimensionarse sola, y `'height'` ajusta el alto del contenedor. Por eso se elige con `Platform.OS`.
- **`keyboardShouldPersistTaps`:** define qué pasa al tocar con el teclado abierto.
  - `'never'` (default): el primer toque fuera de un input solo cierra el teclado y no llega a los botones.
  - `'always'`: el toque llega siempre a los hijos y el teclado no se cierra.
  - `'handled'`: el toque llega a los hijos que lo manejan (botones, sugerencias) y el teclado se cierra solo si se tocó un espacio vacío.

Con `'handled'`, el entrenador puede tocar una sugerencia o "Añadir" a la primera, con el teclado abierto.

### 3. ¿Qué condiciones distinguen los mensajes de la zona de sugerencias?
Dependen de `loading`, `error` y la longitud de la búsqueda:
- `loading` es `true` → "Cargando ejercicios…".
- `error` tiene valor → mensaje de error tocable que llama a `retry`.
- Ni cargando ni error, y la búsqueda tiene menos de 2 letras → "Escribí al menos 2 letras".
- Ni cargando ni error, con 2 letras o más, y 0 resultados → "No se encontraron ejercicios".
- Con resultados → la lista de hasta 3 sugerencias.

Las condiciones son mutuamente excluyentes porque cada mensaje de búsqueda exige `!loading && !error`, y los de `loading` y `error` no coinciden entre sí en la práctica (`retry` pone `loading` en `true` y `error` en `null`).

### 4. ¿Cómo se decide si el botón Guardar está habilitado y qué muestra?
`hasUnsavedChanges = JSON.stringify(days) !== savedSnapshot`. `savedSnapshot` es el texto JSON del último estado guardado (inicialmente, la rutina al abrir la pantalla). Cuando el borrador difiere, el botón está habilitado y dice "Guardar". Al guardar, `saveChanges` persiste y actualiza `savedSnapshot` con el borrador actual: pasan a ser iguales, `hasUnsavedChanges` vuelve a ser `false`, y el botón se deshabilita y dice "Guardado ✓".

Ventaja de comparar contenido en vez de usar una bandera "modificado = true": si el entrenador cambia algo y lo revierte (agrega un bloque y lo borra), el borrador vuelve a ser idéntico y la pantalla ya no avisa de cambios pendientes. Costo: serializar todo el árbol en cada render. Limitación: depende de que las propiedades se serialicen en el mismo orden.

### 5. ¿Qué no puede hacer el entrenador con un ejercicio ya agregado, y qué implica para los nombres de día?
No puede **editarlo**: la tarjeta solo ofrece reordenar y borrar. Para cambiar series, repeticiones, peso o comentarios hay que borrarlo y volver a agregarlo (perdiendo su posición, salvo que lo reubique arrastrándolo con la barrita).

Tampoco hay forma de **renombrar** días ni bloques. Los bloques no lo necesitan (se numeran por posición), pero los días sí guardan su nombre: una vez creado "Día 3" duplicado, o un día que quedó fuera de orden tras reordenar, no se puede corregir desde la pantalla. Solo se puede borrar el día y crearlo de nuevo.

### 6. ¿Por qué `ejerciciosFiltrados` se calcula en el render y qué costo podría tener?
Se calcula en el cuerpo del componente porque es un **valor derivado** de `exercises` y `exerciseName`: no necesita ser estado. Siempre está consistente con sus entradas.

Costo: el `filter` normaliza (descomposición Unicode, regex y minúsculas) el nombre de cada uno de los ~1300 ejercicios. Todo el estado de la pantalla (los campos de series, repeticiones, peso, etc.) vive en el mismo componente, así que cada tecla en cualquiera de esos campos vuelve a renderizar y a recalcular el filtro, aunque el texto de búsqueda no haya cambiado.

Con el React Compiler activo, ese cálculo probablemente se memoiza (mientras `exercises` y la búsqueda no cambien, reutiliza el resultado). Sin él, se podría usar `useMemo` con esas dos dependencias. No lo medí; con rutinas y catálogo de este tamaño es probable que no se note.
