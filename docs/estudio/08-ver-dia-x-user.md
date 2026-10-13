# Bloque 7b: `ver_dia_x_user`

Archivo: `src/screens/ver_dia_x_user.tsx` (728 líneas; la lógica y el JSX llegan hasta la línea 371, el resto es `StyleSheet`). Tiene tres partes con lógica propia: el modal (GIF e instrucciones), el temporizador de descanso (lo más delicado) y el manejo de carga y error del catálogo.

## 1. Entrada y datos

```tsx
const day = route.params.day;
const { getExerciseById, loading, error, retry } = useExercises();
```
- Recibe el día completo por parámetro de navegación. Viene de `mi_rutina_user` ("Ver día") o del QR, que hace el `replace` con `params: { day: selectedDay }`.
- Es una **foto del día en el momento de navegar**: si la rutina cambia, esta pantalla no se entera.
- El subtítulo usa `reduce`:
  ```tsx
  day.blocks.reduce((total, block) => total + block.items.filter(i => i.type === 'exercise').length, 0)
  ```
  `reduce` recorre el array acumulando un valor (`total`, que arranca en 0). Acá suma la cantidad de ejercicios de cada bloque, sin contar descansos. El texto no se pluraliza ("1 ejercicios", "1 bloques").

## 2. Carga y error del catálogo

- **Error:** `{error && (<View>... "Reintentar" ...)}`. El botón llama a `retry` del `ExercisesContext`, es decir, el mecanismo del `attempt` (documento 02).
- **Botones "Ver ejercicio" / "Ver instrucciones":**
  ```tsx
  disabled={!getExerciseById(item.exerciseId)}
  style={[styles.button, !getExerciseById(...) && styles.buttonDisabled]}
  ```
  Deshabilitados hasta que el ejercicio exista en el catálogo. Llamar varias veces a `getExerciseById` por ítem no es problema: es una búsqueda en un `Map` (O(1)), la ganancia de haber indexado el catálogo.
- **Comentarios:** `{!!item.comments?.trim() && (...)}`. `!!` convierte a booleano (evita el problema del string vacío). El `?.` no es necesario porque `comments` siempre es un string.
- **`<Text>` anidado:** `<Text><Text style={label}>Nota: </Text>{item.comments}</Text>`. En React Native un `Text` dentro de otro `Text` se dibuja en la misma línea y hereda estilos; un `View` dentro de un `Text` no.

## 3. El modal de GIF e instrucciones

```tsx
const [modalVisible, setModalVisible] = useState(false);
const [modalType, setModalType] = useState<'' | 'gif' | 'instructions'>('');
const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
```
- `showGif` / `showInstructions` cargan el ejercicio, fijan el tipo y abren; `closeModal` resetea los tres.
- Un **solo** `Modal` sirve para ambos contenidos, decidido con `modalType` (renderizado condicional).
- Mismo patrón que el selector de día del QR: `onRequestClose` (botón atrás de Android) y un `Pressable` con `absoluteFill` detrás del contenido para cerrar al tocar afuera.
- Las instrucciones vienen como array de pasos; se dibujan con `map` y `key={index}` (aceptable: lista estática).
- `ExerciseGif` es el componente del documento 04.

**Observaciones:**
1. **Tres estados que cambian siempre juntos** pueden quedar en combinaciones imposibles (por ejemplo, visible sin ejercicio). Alternativa más segura: un único estado `modal: { type, exercise } | null`, donde "visible" es `modal !== null`.
2. `closeModal` pone `selectedExercise` en `null` al instante, así que durante el fundido de salida el contenido ya desapareció (probablemente se ve un recuadro con solo el botón "Cerrar"). Detalle visual menor.

## 4. El temporizador de descanso

### Las piezas
```tsx
const [activeRestId, setActiveRestId] = useState<number | null>(null);   // cuál descanso es el "activo"
const [remainingSeconds, setRemainingSeconds] = useState(0);             // cuánto queda
const [isRestRunning, setIsRestRunning] = useState(false);               // ¿corriendo?
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // el id del setInterval
```
- Solo puede haber **un descanso activo a la vez**: un único contador para toda la pantalla, identificado por el `id` del ítem.
- **`intervalRef` es un ref** porque es un identificador técnico que no se dibuja y cambiarlo no debería provocar re-render (igual que `scanProcessed` en el QR).
- `ReturnType<typeof setInterval>` evita decidir si el id es `number` (web) u objeto (Node).

### Los cuatro estados implícitos de un descanso

| Estado | `activeRestId` | `isRestRunning` | `remainingSeconds` | Botón |
|---|---|---|---|---|
| Sin iniciar | otro o `null` | — | — | ▶ |
| Corriendo | este | `true` | > 0 | ⏸ |
| Pausado | este | `false` | > 0 | ▶ |
| Terminado | este | `false` | 0 | ▶ (reinicia) |

El `onPress` resuelve esos casos en orden: si no es el activo → empezar; si está corriendo → pausar; si terminó (0) → empezar de nuevo; si no → reanudar.

### El `useEffect` que cuenta
```tsx
useEffect(() => {
  if (!isRestRunning) return;
  intervalRef.current = setInterval(() => {
    setRemainingSeconds((prev) => {
      if (prev <= 1) { clearRestInterval(); setIsRestRunning(false); Vibration.vibrate(); return 0; }
      return prev - 1;
    });
  }, 1000);
  return clearRestInterval;
}, [isRestRunning, activeRestId]);
```
- **El intervalo se crea cuando `isRestRunning` pasa a `true` o cuando cambia el descanso activo (`activeRestId`)**, y se limpia cuando `isRestRunning` pasa a `false` o cuando el effect se vuelve a ejecutar (la función que devuelve el effect es el cleanup). La dependencia `activeRestId` es lo que permite cambiar de un descanso a otro mientras corre (ver sección siguiente).
- **`setRemainingSeconds((prev) => ...)`:** forma funcional, porque el callback del `setInterval` se crea una vez y "recuerda" el valor de ese momento (*closure*).
- Cuando `prev <= 1`: corta el intervalo, marca que ya no corre, vibra y deja el contador en 0.

### La limpieza al salir de la pantalla
```tsx
useEffect(() => clearRestInterval, []);
```
El effect **devuelve** `clearRestInterval` como cleanup: se ejecuta al desmontarse el componente (por ejemplo, con `goBack`), para que el intervalo no siga corriendo en una pantalla que ya no existe.

### Conversión de tiempo
`toSeconds(time, unit)` pasa `'minutos'` a segundos multiplicando por 60. `formatRestTime` da formato `m:ss` con `Math.floor`, `%` y `padStart(2, '0')`.

### Bug corregido: pasar de un descanso a otro mientras corre
Detectado leyendo el código; la corrección está aplicada (verificada con `tsc` y `eslint`, **no probada en el emulador**).

**El problema (versión original, con `[isRestRunning]` como única dependencia):**
1. El descanso A está corriendo (`isRestRunning = true`, intervalo activo).
2. Se toca ▶ en el descanso B → `startRest(B)`.
3. `startRest` hace `clearRestInterval()` (mata el intervalo de A), `setActiveRestId(B)`, `setRemainingSeconds(...)` y `setIsRestRunning(true)`.
4. Pero `isRestRunning` **ya era `true`**: el estado no cambia, la dependencia no cambia y **el effect no se volvía a ejecutar**. Nadie creaba el intervalo nuevo, y el descanso B quedaba congelado mostrando el tiempo inicial, con el ícono ⏸.

**La corrección (una sola línea):** agregar `activeRestId` a las dependencias, más un comentario que explica por qué.
```diff
-    }, [isRestRunning]);
+    }, [isRestRunning, activeRestId]);
```

**Por qué funciona:** al pasar de A a B cambia `activeRestId`, así que React:
1. ejecuta el cleanup del effect anterior (corta el intervalo de A),
2. vuelve a ejecutar el effect: como `isRestRunning` es `true`, crea un intervalo nuevo,
3. ese intervalo cuenta desde los segundos de B, porque `startRest` los había cargado en el mismo render.

Los otros casos siguen igual: pausar y reanudar (cambia `isRestRunning`), reiniciar un descanso terminado (`isRestRunning` pasa de `false` a `true`) e iniciar un descanso con otro pausado (cambian las dos dependencias, pero el effect corre una sola vez). La llamada a `clearRestInterval()` dentro de `startRest` quedó redundante pero inofensiva.

**Lo que no cambió:** la precisión del conteo y los efectos secundarios dentro del updater (siguen en "Otras fragilidades").

### Otras fragilidades
1. **Efectos secundarios dentro del updater** de `setRemainingSeconds` (vibrar, `setIsRestRunning`): los updaters deben ser puros, React puede ejecutarlos más de una vez (por ejemplo en `StrictMode`).
2. **Precisión:** contar de a un tick de 1000 ms acumula error, y en segundo plano las apps móviles pausan o limitan los timers.
3. **El temporizador no sobrevive al `goBack`:** se limpia a propósito, pero el progreso se pierde.
4. **Entradas inválidas:** si `time` fuera `''` o no numérico, `toSeconds` daría `0` o `NaN` y se vería `NaN:NaN`.

## 5. Código repetido
`formatRestUnit` está escrita igual en `mi_rutina_user` y en esta pantalla. Conviene moverla a un archivo común (por ejemplo `src/utils/`). Si el descanso se guarda como segundos, desaparecen `toSeconds` y `formatRestUnit`.

## 6. Lista para el bloque 9 (continúa la del documento 07)
37. Recibir `dayId` por parámetro y cargar el día desde el origen de datos; la pantalla pasa a tener estados de carga y error propios.
38. Temporizador: el cambio de descanso en caliente ya está corregido (dependencia `activeRestId`). Falta basarlo en la hora de fin y mover los efectos secundarios fuera del updater. Evaluar notificaciones locales si debe sonar con la app en segundo plano.
39. Extraer utilidades comunes (`formatRestUnit`, formato de tiempo) o eliminarlas guardando el descanso en segundos.
40. Unificar los tres estados del modal en uno solo.

## 7. Preguntas de verificación, con respuestas

### 1. ¿Qué hace `useEffect(() => clearRestInterval, [])` y cuándo se ejecuta la función?
Es la forma abreviada de:
```tsx
useEffect(() => {
  return () => clearRestInterval();
}, []);
```
El cuerpo del effect no hace nada al montar; solo **devuelve** `clearRestInterval` como función de limpieza. Con `[]` como dependencias, esa limpieza se ejecuta **una sola vez, cuando el componente se desmonta** (por ejemplo al volver atrás). Garantiza que el `setInterval` no quede corriendo en una pantalla que ya no existe (lo que seguiría consumiendo recursos y llamaría a `setState` sobre un componente desmontado).

Detalle: `clearRestInterval` se recrea en cada render, pero la versión del primer render funciona igual porque solo lee `intervalRef.current`, y el ref es el mismo objeto durante toda la vida del componente.

### 2. ¿Por qué `setRemainingSeconds((prev) => ...)` y no `remainingSeconds - 1`?
El callback del `setInterval` se crea una sola vez, cuando corre el effect, y captura (*closure*) el valor de `remainingSeconds` de ese instante, por ejemplo 60. Si dentro usara `remainingSeconds - 1`, cada segundo calcularía `60 - 1 = 59` y lo guardaría: el contador se quedaría clavado en 59.

La forma funcional `(prev) => prev - 1` recibe de React el valor **más reciente** en el momento de aplicar el cambio, sin depender de la captura. Es la misma razón del `setForm((prev) => ...)` en `signup` (documento 05).

### 3. ¿Por qué `intervalRef` es un `useRef` y no un `useState`?
- El id del intervalo **no se dibuja en pantalla**, así que no hace falta que su cambio provoque un re-render. Un `setState` dispararía renders innecesarios cada vez que empieza o termina un intervalo.
- Hay que leerlo **de inmediato** y desde varias funciones (`clearRestInterval`, `startRest`, el cleanup). Un estado se actualiza recién en el próximo render, y una función podría leer un valor viejo.
- Un ref persiste entre renders y se modifica al instante.

Regla práctica: lo que se muestra en pantalla va en estado; los identificadores internos (timers, candados, referencias a elementos) van en refs.

### 4. ¿Qué pasa si un descanso está corriendo y se toca ▶ en otro? ¿Por qué?
**Antes de la corrección** el nuevo descanso quedaba **congelado**. `startRest` mata el intervalo anterior y pone `isRestRunning` en `true`, pero ya estaba en `true`: React no considera que haya cambiado, la dependencia `[isRestRunning]` del effect no cambia, el effect no se re-ejecuta y no se crea ningún intervalo nuevo. En pantalla, el segundo descanso mostraba su tiempo inicial con el ícono ⏸ y no avanzaba hasta que se lo pausaba y se lo reanudaba.

**Ahora** el effect depende también de `activeRestId`: al tocar ▶ en otro descanso cambia el id, el effect se re-ejecuta (cortando el intervalo anterior y creando uno nuevo) y el segundo descanso cuenta con normalidad. El descanso anterior deja de ser el activo y vuelve a mostrar su duración completa (la pantalla solo muestra la cuenta regresiva del descanso activo).

La lección general: un `useEffect` solo reacciona a **cambios** de sus dependencias. Si querés que se ejecute otra vez, algo de la lista tiene que cambiar. Por eso el arreglo consistió en agregar la dependencia que sí cambia en ese caso.

### 5. ¿Por qué contar ticks de 1 segundo es impreciso y cómo se haría más preciso?
- `setInterval(fn, 1000)` **no garantiza** que `fn` corra cada 1000 ms exactos: si el hilo de JavaScript está ocupado, el tick se atrasa, y esos retrasos se acumulan.
- En segundo plano o con la pantalla bloqueada, iOS y Android pausan o limitan los timers de JavaScript, y se pierden ticks.
- Restar 1 en cada tick supone que ocurrió exactamente un segundo.

Solución: guardar el **momento de finalización** y calcular el tiempo restante contra el reloj en cada tick:
```ts
const endAt = Date.now() + totalSeconds * 1000;
// en cada tick:
const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
```
Así, aunque se pierdan ticks, el valor se corrige solo; al volver de segundo plano el tiempo restante es el correcto. El intervalo pasa a ser solo un "disparador de actualización de pantalla".

### 6. ¿Qué problema tienen los tres estados del modal y cómo se simplificaría?
`modalVisible`, `modalType` y `selectedExercise` representan **una sola cosa** ("qué modal está abierto y para qué ejercicio") repartida en tres variables que hay que mantener sincronizadas a mano. Pueden quedar combinaciones imposibles (visible con ejercicio `null`, tipo `'gif'` con el modal cerrado), y cada función debe acordarse de actualizar las tres.

Con un único estado:
```ts
type ModalState = { type: 'gif' | 'instructions'; exercise: Exercise } | null;
const [modal, setModal] = useState<ModalState>(null);
// abrir:  setModal({ type: 'gif', exercise })
// cerrar: setModal(null)
// visible: modal !== null
```
Las combinaciones inválidas dejan de existir y TypeScript lo garantiza. El principio: modelar el estado de modo que los estados imposibles no se puedan representar.
