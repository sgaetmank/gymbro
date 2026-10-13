# Bloque 8b-1: `editar_rutina_trainer`, estado y operaciones de edición

Archivo: `src/screens/editar_rutina_trainer.tsx` (1.744 líneas). Esta primera parte cubre hasta la línea 532: datos, estado y las operaciones de agregar, mover y borrar. El JSX y los modales se estudian en 8b-2, y el guardado y los avisos de salida en 8b-3.

## 1. Mapa del archivo

| Líneas | Contenido |
|---|---|
| 37-62 | Entrada, `routineId`, helpers de validación |
| 68-107 | Todo el estado |
| 113-187 | Agregar día/bloque y abrir los modales |
| 193-310 | Agregar ejercicio y descanso (con validación) |
| 316-464 | Mover día, bloque, ítem |
| 470-532 | Borrar ítem, bloque, día |
| 538-618 | Guardado y avisos de salida (8b-3) |
| 624-... | Render, modales y estilos (8b-2) |

## 2. La idea central: un borrador editable de un árbol

La rutina es un árbol: `días → bloques → ítems`. La pantalla trabaja sobre una **copia de trabajo** en estado:

```tsx
const [days, setDays] = useState<RoutineDay[]>(routine?.days ?? []);
```
Nada se escribe en el modelo de datos hasta guardar (`persistRoutine`, 8b-3). Lo que se ve en pantalla es el borrador.

- **`useState(valorInicial)` solo usa el valor en el primer render.** Aunque `routine` se recalcule en cada render, `days` no se reinicia.
- El borrador **arranca apuntando al mismo array** que la rutina guardada (misma referencia). Eso no la corrompe porque **ninguna operación muta**: todas crean objetos nuevos. Y al guardar, `updateRoutineDays` hace la copia profunda (`JSON.parse(JSON.stringify(...))`, documento 01) para que el dato guardado nunca comparta referencias con el borrador.
- Un alumno sin rutina arranca con `[]`.
- `routineId = useRef(routine?.id ?? null)` recuerda la rutina del alumno y evita crearla dos veces (se usa en `persistRoutine`, 8b-3).

## 3. El patrón de actualización inmutable (el más importante)

Para cambiar algo dentro del árbol no se modifica nada: se **reconstruye el camino** desde la raíz hasta el elemento, copiando con spread (`...`) cada nivel por el que se pasa. Ejemplo (`addExercise`, `addRest`, `deleteItem` y `moveItem` siguen la misma forma):

```tsx
setDays(
  days.map((day) => {
    if (day.id !== selectedDayId) return day;            // rama intacta: misma referencia
    return {
      ...day,                                             // copia del día
      blocks: day.blocks.map((block) => {
        if (block.id !== selectedBlockId) return block;  // rama intacta
        return { ...block, items: [...block.items, newExercise] };  // copia con el ítem nuevo
      }),
    };
  })
);
```
- Los elementos que **no** cambian conservan su misma referencia (*structural sharing*); solo se crean objetos nuevos a lo largo del camino modificado.
- React detecta el cambio porque el array que se pasa a `setDays` es una referencia nueva.
- Es la misma regla de siempre (`setUser`, `setForm`): nunca mutar el estado, siempre reemplazar.
- Es un código **muy repetitivo**: el mismo anidado aparece en 7 funciones. Un helper tipo `updateBlock(dayId, blockId, fn)` lo reduciría bastante. Es una mejora de mantenimiento, no un error.
- Estas operaciones usan `setDays(days.map(...))` con el `days` del render actual, no la forma funcional `setDays(prev => ...)`. Para un toque por vez funciona bien; la forma funcional importa si pueden ocurrir varias actualizaciones seguidas antes de re-renderizar.

## 4. Operaciones

### Agregar
- `addDay`: crea `{ id: Date.now(), name: 'Día N', blocks: [] }` y lo agrega al final.
- `addBlock`: agrega `{ id: Date.now(), items: [] }` al día elegido. "Bloque N" **no se guarda**: se calcula por posición (así lo dibujan `mi_rutina_user` y `ver_dia_x_user`).
- `addExercise` / `addRest`: validan (sección 5), arman el ítem y lo agregan al bloque destino, identificado con `selectedDayId` y `selectedBlockId` (el "destino" del alta, común a ambos modales). Luego cierran el modal.

### Mover (arriba / abajo)
`moveDay`, `moveBlock` y `moveItem` siguen el mismo esquema:
1. `findIndex` para ubicar el elemento por id.
2. `newIndex = currentIndex ± 1`.
3. **Guardas:** si no se encontró (`-1`) o el nuevo índice se sale del rango, no hace nada.
4. **Copia del array** (`[...items]`) e **intercambio** con una variable temporal.

La diferencia entre las tres es cuántos niveles hay que reconstruir.

### Borrar
`filter` por id (`item.id !== itemId`), con el mismo anidado. Estas funciones no piden confirmación; si el JSX lo hace, se verá en 8b-2.

## 5. Validación del formulario de ejercicio

| Campo | Regla | Cómo |
|---|---|---|
| Obligatorios | ejercicio, series, reps y peso no vacíos (comentarios, no) | `!selectedExerciseId \|\| !series.trim() ...` |
| Series y repeticiones | entero mayor a 0, sin ceros a la izquierda | `/^[1-9]\d*$/` |
| Peso | número ≥ 0 (0 = peso corporal); acepta coma | `Number(weight.replace(',', '.'))` y `!(weightValue >= 0)` |
| Tiempo de descanso | entero o decimal | `/^\d+(\.\d+)?$/` |

- **`/^[1-9]\d*$/`:** `^` inicio, `[1-9]` primer dígito de 1 a 9 (impide "0", "00", "04"), `\d*` cero o más dígitos, `$` fin. "4.5" y "-3" no pasan.
- **`!(weightValue >= 0)`:** el truco del `NaN` de `signup`: `NaN >= 0` es `false`, así que la negación lo rechaza.
- **Normalización al guardar:** el peso se guarda como `` `${weightValue} kg` ``. "20,5" o "020" quedan como "20.5 kg" y "20 kg".
- **Las repeticiones deben ser un entero:** no se aceptan rangos como "8-12". Esto resuelve la duda abierta en el ítem 34 (documento 07): en la BD pueden ser una columna numérica.

### Detalles a notar
1. **Descanso: se valida con `trim` pero se guarda sin `trim`** (`time: restTime`). Un valor como `"5 "` pasa y se almacena con el espacio.
2. **Descanso: no acepta coma** (`1,5` falla), mientras que el peso sí. Criterios distintos para campos parecidos.
3. **El descanso acepta `0`.**
4. **`Number()` acepta más de lo esperado:** el peso admite notación científica (`1e2` = 100) y hexadecimal (`0x10` = 16). Rareza menor.
5. **Sin topes máximos:** se puede cargar 9999 series.
6. El mensaje de error muestra una sola regla a la vez (la primera que falla).

## 6. Los ids con `Date.now()`

Todo elemento nuevo recibe `id: Date.now()` (milisegundos desde 1970, hoy ~1,76 × 10¹²). Los datos iniciales usan enteros chicos (1, 2, 3...).
- Funciona porque es raro crear dos elementos en el mismo milisegundo. Con una colisión, dos elementos tendrían la misma `key` (documento 04) y las operaciones por id actuarían sobre ambos.
- **Con una BD, el id lo genera la BD.** Además, esos valores **no caben en un entero de 32 bits** (máximo ~2,147 × 10⁹): habría que usar `BIGINT` o UUID. El cliente necesita un id temporal para los elementos nuevos hasta que el servidor responda con el definitivo.

## 7. Nombres de día

`addDay` nombra el día `` `Día ${days.length + 1}` ``, a diferencia de los bloques, cuyo nombre se calcula por posición. Con "Día 1", "Día 2" y "Día 3", si se borra el "Día 2" y se agrega otro, el nuevo se llama "Día 3": queda **duplicado**. Tampoco se renumeran al reordenar o borrar (en lo leído; si el JSX permite renombrar, se verá en 8b-2). Es una inconsistencia entre días (se guardan) y bloques (se derivan).

## 8. Estado del formulario de los modales

Hay unos 12 `useState` sueltos:
- **Ejercicio:** `exerciseName` (texto de búsqueda), `selectedExerciseId` (el elegido), `series`, `repetitions`, `weight`, `comments`, `exerciseFormError`.
- **Descanso:** `restTime`, `restUnit`, `restFormError`.
- **Control:** `exerciseModalVisible`, `restModalVisible`, `selectedDayId`, `selectedBlockId`.

`openExerciseModal` y `openRestModal` **reinician a mano** todos los campos antes de abrir. `signup`, en cambio, agrupa todo en un único objeto `form`.

Como todo ese estado vive en el mismo componente, **cada tecla escrita en un modal vuelve a renderizar toda la pantalla** y recalcula `hasUnsavedChanges` (que serializa el árbol con `JSON.stringify`), además de la búsqueda de ejercicios. Con rutinas chicas no se nota.

## 9. Lista para el bloque 9 (continúa la del documento 10)
51. Ids: los genera la BD (`BIGINT` o UUID); el cliente usa ids temporales para lo nuevo y los reemplaza con los definitivos de la respuesta.
52. Guardado: decidir entre enviar la rutina completa (y que el servidor la reemplace en una transacción) o enviar solo los cambios. Prever **edición simultánea** (dos entrenadores sobre la misma rutina) con un campo de versión.
53. Validación: repetir las mismas reglas en el servidor (series y reps enteros ≥ 1, peso decimal ≥ 0 en kg, descanso numérico) y agregar topes máximos. Unificar los criterios del descanso (coma, `trim`).
54. Nombres de día: decidir si se guardan o se derivan por posición, como los bloques.
55. Mantenimiento: extraer un helper para las actualizaciones anidadas y mover `normalizar` a una utilidad compartida (también está en `buscar_usuario_trainer`).
56. La relación `id_rutina` con los alumnos (una rutina por alumno o compartida) se resuelve en el modelo de la BD.

## 10. Preguntas de verificación, con respuestas

### 1. ¿Por qué cada operación usa `map` más spread y no modifica el árbol directamente? ¿Qué ramas conservan su referencia?
Hay dos razones:
- **React detecta cambios por referencia.** Si se modifica un objeto interno sin crear uno nuevo, `setDays` recibiría el mismo array y React no vería ningún cambio: la pantalla no se actualizaría.
- **El borrador comparte referencias con los datos guardados.** `days` arranca siendo el mismo array que `routine.days`. Mutarlo modificaría directamente la rutina guardada sin haber tocado "Guardar", y "Salir sin guardar" ya no podría descartar nada (los datos reales ya cambiaron).

Con `map` + spread se crea una copia de cada nivel **por el que pasa el cambio** (el array `days`, el día modificado, el array `blocks`, el bloque modificado, el array `items`). Conservan su referencia original todos los **días que no son el elegido** y todos los **bloques que no son el elegido** (el `return day` / `return block`), y también los ítems anteriores de ese bloque.

### 2. ¿Por qué `days` arranca con la misma referencia que `routine.days` y eso no corrompe los datos guardados?
Porque el borrador nunca se modifica en el lugar: cada edición crea objetos y arrays nuevos y deja los originales intactos. Mientras eso se cumpla, los datos guardados siguen siendo los mismos objetos de antes.

Para el momento de guardar existe una segunda protección: `updateRoutineDays`/`createRoutine` hacen `JSON.parse(JSON.stringify(days))`, una **copia profunda**. Así, lo guardado ya no comparte ninguna referencia con el borrador, y las ediciones posteriores no pueden alterarlo.

### 3. ¿Qué valida `/^[1-9]\d*$/` y por qué el peso usa `!(weightValue >= 0)`?
- **Regex:** `^` inicio; `[1-9]` primer carácter un dígito de 1 a 9 (impide "0", "00", "04"); `\d*` cero o más dígitos más; `$` fin. Resultado: un entero positivo sin ceros a la izquierda, sin signo ni decimales. Pasan "4" y "12"; no pasan "0", "04", "4.5", "-3" ni "".
- **`!(weightValue >= 0)`:** `Number('abc')` da `NaN`, y toda comparación con `NaN` es `false`. Con `weightValue < 0`, un `NaN` pasaría la validación (`NaN < 0` es `false`). Con `!(weightValue >= 0)`, `NaN >= 0` es `false`, la negación da `true` y se rechaza. Además permite 0 (peso corporal).

### 4. ¿Qué problemas tiene `Date.now()` como id y qué cambia con una BD?
- **Colisiones:** dos elementos creados en el mismo milisegundo tendrían el mismo id (duplicando `key`s y haciendo que las operaciones por id afecten a ambos). Es improbable con toques humanos, pero posible.
- **Tamaño:** ~1,76 × 10¹² no cabe en un entero de 32 bits (máximo ~2,147 × 10⁹). Una columna `INT` lo desbordaría.
- **Conceptual:** el id lo decide el reloj del dispositivo, que puede estar mal configurado.

Con una BD, el id definitivo lo genera la propia BD (autoincremental o UUID). El cliente puede seguir usando un id temporal para lo nuevo (por ejemplo un UUID generado en el cliente, o un número negativo) hasta recibir el definitivo en la respuesta.

### 5. ¿Por qué las funciones de mover copian el array antes de intercambiar?
Intercambiar elementos con `items[i] = items[j]` **modifica el array en el lugar**. Si ese array es el del estado, se estaría mutando el estado: React no detectaría el cambio (misma referencia) y, como `days` arranca compartiendo referencias con `routine.days`, se alteraría la rutina guardada sin guardar. `const newItems = [...block.items]` hace una copia superficial; el intercambio se hace sobre la copia, y esa copia (referencia nueva) se pone en el estado.

### 6. ¿Qué pasa con el nombre de los días al borrar uno del medio y agregar otro? ¿Y con los bloques?
- **Días:** el nombre se guarda como texto (`Día N`, con N = cantidad de días + 1 en el momento de crearlo). Con "Día 1", "Día 2", "Día 3", si se borra el "Día 2" quedan "Día 1" y "Día 3"; al agregar uno nuevo se llama "Día 3" (`días.length + 1 = 3`), duplicando el nombre. Tampoco se renumeran al reordenar.
- **Bloques:** el nombre no se guarda; se calcula al mostrar con `Bloque ${índice + 1}`. Siempre es consecutivo y se renumera solo al borrar o reordenar.

La inconsistencia es de criterio: lo mismo (un nombre ordinal) se resuelve de dos maneras distintas.
