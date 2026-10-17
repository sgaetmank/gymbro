# Bloque 7b: entrenamiento guiado (`entrenar_dia_user`)

Archivos: `src/screens/entrenar_dia_user.tsx` (la pantalla), `src/utils/buildSteps.ts` (la lógica pura), `src/navigation/types.ts` y `src/navigation/UserTabs.tsx` (la ruta), `src/screens/mi_rutina_user.tsx` y `src/screens/escanear_qr_user.tsx` (las dos formas de llegar). Se apoya en `ExercisesContext`, `ExerciseGif` y `useResponsiveLayout` (ver bloque 4).

## 1. Qué es y qué problema resuelve

Es una pantalla que recorre **un día de la rutina un paso a la vez**. Un paso es un ejercicio o un descanso. El usuario ve solamente lo que le toca hacer ahora y, cuando termina, avanza al siguiente, hasta llegar a una pantalla de felicitación.

La idea nació de una corrección de los profesores: el usuario tiene que poder *seguir el flujo del entrenamiento*, no solo ver una lista. Aun así se quiso conservar la posibilidad de "tener todo a mano" (la máquina está ocupada, no hay ganas de hacer un ejercicio, etc.). Por eso la pantalla tiene un modal **"Ver rutina"** que muestra el día completo y permite saltar a cualquier paso sin perder el recorrido.

Decisiones de alcance:
- El recorrido es **de un solo día**, no encadena días.
- Al terminar solo se muestra una pantalla de felicitación. **No registra nada** en estadísticas: eso lo hace el check-in con QR (sección 10).
- El progreso **no se guarda**: si el usuario sale de la pantalla, la próxima vez empieza en el paso 1.

## 2. Mapa de piezas

| Archivo | Responsabilidad |
|---|---|
| `entrenar_dia_user.tsx` | La pantalla: estado, temporizador, gestos, modales y render |
| `buildSteps.ts` | Función pura que convierte un día en una lista plana de pasos |
| `types.ts` | Declara la ruta `entrenar_dia_user: { day: RoutineDay }` |
| `UserTabs.tsx` | Registra la pantalla dentro del stack de la pestaña "Rutinas" |
| `mi_rutina_user.tsx` | Primera entrada: botón "Comenzar entrenamiento" en cada día |
| `escanear_qr_user.tsx` | Segunda entrada: después del check-in abre el entrenamiento |

## 3. De día a pasos: `buildSteps`

Un día se guarda como bloques, y cada bloque como una lista de items (ejercicios y descansos). Para recorrerlo de a un paso, conviene tener **una sola lista**:

```
Día { bloques: [ {items:[ej, descanso]}, {items:[ej]} ] }

   →  [ {item: ej,       blockIndex: 0},
        {item: descanso, blockIndex: 0},
        {item: ej,       blockIndex: 1} ]
```

```ts
export function buildSteps(day: RoutineDay): WorkoutStep[] {
  return day.blocks.flatMap((block, blockIndex) =>
    block.items.map((item) => ({ item, blockIndex }))
  );
}
```

- `flatMap` recorre cada bloque, convierte sus items en pasos y junta todo en una lista sin anidar.
- Se guarda el `blockIndex` en cada paso porque el nombre "Bloque N" **no existe en los datos**: se calcula por posición (índice + 1).
- Es una **función pura**: mismo día de entrada, misma lista de salida, sin efectos secundarios. Por eso no depende de React ni de la pantalla, y se puede reutilizar desde cualquier lugar.

## 4. El estado principal

```ts
const day = route.params.day;
const steps = useMemo(() => buildSteps(day), [day]);

const [stepIndex, setStepIndex] = useState(0);
const isFinished = stepIndex >= steps.length;
const step = steps[stepIndex];
```

- **`day`** llega por parámetro de navegación: el día *entero* viaja en `route.params`. La pantalla no busca nada en `routines.ts`.
- **`steps`** se calcula una vez con `useMemo` y solo se recalcula si cambia `day`.
- **`stepIndex`** es el único estado que dice "dónde estoy". Todo lo demás se deriva de él.
- **`stepIndex === steps.length`** no corresponde a ningún paso real: es el **paso final**, el que muestra la felicitación. `isFinished` lo detecta.
- **`step`** es el paso actual. Cuando `isFinished` es `true` vale `undefined`, y por eso el código que lo usa está protegido.
- **`exercise`**: los pasos de ejercicio guardan solo un `exerciseId`. El detalle (nombre, GIF, instrucciones) sale del catálogo de la API con `getExerciseById`. Es `undefined` si el paso es un descanso, si ya terminó o si la API todavía no cargó.

## 5. Qué se dibuja, de arriba hacia abajo

1. **Header:** botón atrás, nombre del día y "Ver rutina" (se oculta al terminar).
2. **Aviso de error** (solo si falló la carga de ejercicios), con "Reintentar".
3. **Progreso:** el texto "Bloque N · Paso X de Y" y una barra cuyo ancho es `(stepIndex + 1) / steps.length` en porcentaje.
4. **Tarjeta del paso**, centrada en el espacio libre:
   - *Ejercicio:* nombre, tres cajas (Series, Reps, Peso), la nota si existe y los botones "Ver ejercicio" y "Ver instrucciones".
   - *Descanso:* el tiempo y un botón ▶/⏸ (sección 8).
5. **Pie:** botones "‹ Anterior" y "Siguiente ›". Está **fuera del scroll** para que siempre sea alcanzable.
6. **Pantalla final** (si `isFinished`): reemplaza a los puntos 3 y 4 con la felicitación y "Volver a mi rutina". El pie desaparece.

Casos de carga: mientras el catálogo no llega, el nombre dice "Cargando…"; si terminó de cargar y ese ejercicio no está, dice "Ejercicio no disponible". En ambos casos los botones de GIF e instrucciones quedan deshabilitados, porque dependen de `exercise`.

## 6. Cambiar de paso

Hay tres caminos, y los tres hacen lo mismo en dos tiempos: **cancelar el descanso en curso** y **cambiar `stepIndex`**.

```ts
const goNext = () => {
  cancelRest();
  setStepIndex((i) => Math.min(i + 1, steps.length));
};
const goPrevious = () => {
  cancelRest();
  setStepIndex((i) => Math.max(i - 1, 0));
};
```

- Los límites (`Math.min` / `Math.max`) impiden salirse del rango aunque el usuario toque muy rápido.
- En el último paso real, el botón dice "Finalizar" y lleva a `steps.length`, o sea, a la felicitación.
- Se usa la forma `setStepIndex((i) => ...)` para partir siempre del valor más reciente.

### Los gestos de deslizar

```ts
const swipe = Gesture.Pan()
  .runOnJS(true)
  .enabled(!isFinished)
  .activeOffsetX([-30, 30])
  .failOffsetY([-20, 20])
  .onEnd((e) => {
    if (e.translationX <= -SWIPE_DISTANCE) goNext();
    else if (e.translationX >= SWIPE_DISTANCE) goPrevious();
  });
```

- Viene de `react-native-gesture-handler`, que ya estaba instalado y ya tenía su `GestureHandlerRootView` en `app/index.tsx`.
- **`activeOffsetX([-30, 30])`**: el gesto solo se activa cuando el dedo se movió más de 30 px en horizontal.
- **`failOffsetY([-20, 20])`**: si el dedo se mueve más de 20 px en vertical primero, el gesto *falla* y deja que el `ScrollView` haga su scroll. Así el deslizar de costado y el scroll vertical no se pisan.
- **`onEnd`**: al soltar el dedo, si el recorrido horizontal fue de al menos 60 px (`SWIPE_DISTANCE`), cambia de paso. Izquierda avanza, derecha retrocede.
- **`.runOnJS(true)`**: la librería puede ejecutar los callbacks en un hilo nativo; esto fuerza que corran en el hilo normal de JavaScript, donde viven nuestros estados.
- **`.enabled(!isFinished)`**: en la pantalla final el gesto está apagado, para no poder "volver" desde ahí.
- En el árbol de componentes: `GestureDetector → View → ScrollView`. El `View` intermedio existe porque el detector necesita un hijo simple.
- Hay un `eslint-disable-next-line react-hooks/refs` sobre `onEnd`. Como el proyecto usa React Compiler (`reactCompiler: true` en `app.json`), la regla de lint desconfía de pasar funciones que tocan un `ref` (el del temporizador) durante el render. Acá es un falso positivo: esas funciones solo se ejecutan al soltar el dedo.

### Saltar con "Ver rutina"

`goToStep(index)` cancela el descanso, cambia `stepIndex` y cierra el modal. Lo llama el modal de la sección 7.

## 7. Los dos modales

### Modal de GIF e instrucciones
Tres estados: `modalVisible`, `modalType` (`'gif'` o `'instructions'`) y `selectedExercise`. `showModal(ejercicio, tipo)` los llena y `closeModal` los vacía. Un mismo `Modal` muestra el GIF (`ExerciseGif`) o la lista de instrucciones, según `modalType`. Tocar fuera del cuadro lo cierra: hay un `Pressable` que ocupa toda la pantalla detrás del cuadro y llama a `closeModal`.

### Modal "Ver rutina"
Estado: solo `listVisible`. Muestra el día completo dividido en bloques, con nombre, series, reps y peso de cada ejercicio y el tiempo de cada descanso.
- El paso actual se resalta con borde amarillo y la leyenda "Estás acá".
- Cada fila es tocable y lleva a su paso con `goToStep`.
- Para saber **a qué número de paso corresponde cada fila**, se aprovecha que los pasos están en el mismo orden en que se recorren los bloques: el índice es *índice del primer paso del bloque* (`steps.findIndex(s => s.blockIndex === blockIndex)`) más la posición del item dentro del bloque.

## 8. El temporizador de descanso

### Las piezas

```ts
const [activeRestId, setActiveRestId] = useState<number | null>(null);
const [remainingSeconds, setRemainingSeconds] = useState(0);
const [isRestRunning, setIsRestRunning] = useState(false);
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

- **`activeRestId`**: de qué descanso es el tiempo que corre o terminó. Sirve para que un descanso no muestre el tiempo de otro.
- **`remainingSeconds`**: segundos que quedan.
- **`isRestRunning`**: si el reloj está andando.
- **`intervalRef`**: guarda el *id* de la "alarma" creada por `setInterval` (ver abajo).

### `setInterval` y su id
`setInterval(función, 1000)` le pide al motor de JavaScript que ejecute la función **cada segundo**. Devuelve un **id** (un número), que es lo único que permite cancelarla después con `clearInterval(id)`. Si ese id se pierde, la alarma sigue sonando para siempre, incluso con la pantalla cerrada.

- `setInterval` se llama **una sola vez** y devuelve **un** id. Lo que se repite cada segundo es la *función de adentro*, no la creación de la alarma.
- Ese id **es el mismo durante todo el conteo**. Solo se genera otro cuando se vuelve a llamar a `setInterval`, es decir, al iniciar o reanudar.
- La alarma no cambia los segundos por sí misma: solo marca el ritmo. Cada segundo ejecuta `setRemainingSeconds(prev => prev - 1)`, y ese cambio de estado hace que React redibuje el número.

### `intervalRef`: por qué un `useRef`
El componente es una función que **se vuelve a ejecutar completa en cada render**, así que una variable común (`let id = null`) se reiniciaría y se perdería el id. Un `useRef` es una caja que React conserva entre renders, se accede con `.current`, y **cambiarla no provoca un nuevo render**. Esto último es justamente lo que se busca: el id no se muestra en pantalla, solo sirve para poder cancelar. Con un `useState` la pantalla se redibujaría sin necesidad.

### `clearRestInterval`: apagar la alarma, si hay una

```ts
const clearRestInterval = () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};
```

- El `if` evita intentar apagar algo que no existe.
- El `= null` deja anotado que ya no hay alarma. Así llamarla dos veces seguidas es inofensivo, y por eso se la llama desde muchos lugares: al iniciar un descanso, al pausar, al cancelar, cuando el tiempo llega a 0 y en la limpieza de los efectos.

### Las acciones

| Función | Qué hace |
|---|---|
| `startRest(id, time, unit)` | Apaga cualquier alarma vieja, guarda el id del descanso, carga el tiempo en segundos y pone `isRestRunning = true` |
| `pauseRest()` | Apaga la alarma y pone `isRestRunning = false`. `remainingSeconds` queda guardado |
| `resumeRest()` | Solo pone `isRestRunning = true`; el efecto crea la alarma nueva |
| `cancelRest()` | Apaga la alarma y deja todo en cero (`activeRestId = null`). Se llama al cambiar de paso |

El botón ▶/⏸ decide cuál usar según el estado: si no es el descanso activo, lo inicia; si está corriendo, pausa; si terminó en 0, reinicia; si está pausado, reanuda.

### Los cuatro estados implícitos de un descanso

No hay una variable "estado", pero la combinación de tres valores define en cuál está:

| Estado | `activeRestId` | `isRestRunning` | `remainingSeconds` | Botón |
|---|---|---|---|---|
| Sin iniciar | otro o `null` | — | — | ▶ (muestra la duración completa) |
| Corriendo | este | `true` | > 0 | ⏸ |
| Pausado | este | `false` | > 0 | ▶ (reanuda) |
| Terminado | este | `false` | 0 | ▶ (reinicia) y el texto dice "¡Descanso terminado!" |

El `onPress` resuelve esos casos en orden: si no es el activo → empezar; si está corriendo → pausar; si terminó (0) → empezar de nuevo; si no → reanudar.

**El timer no arranca solo.** Al llegar a un paso de descanso se ve el tiempo completo y el usuario decide cuándo empezar.

### El `useEffect` que hace andar el reloj

```ts
useEffect(() => {
  if (!isRestRunning) return;

  intervalRef.current = setInterval(() => {
    setRemainingSeconds((prev) => {
      if (prev <= 1) {
        clearRestInterval();
        setIsRestRunning(false);
        Vibration.vibrate();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return clearRestInterval;
}, [isRestRunning, activeRestId]);
```

- El botón **no inicia la alarma directamente**: solo cambia estados. Este efecto *reacciona* a ese cambio.
- Si `isRestRunning` es `false`, sale sin hacer nada (descanso pausado o detenido).
- Si es `true`, crea la alarma y **guarda su id** en `intervalRef`. Cada segundo resta 1.
- Al llegar al final (`prev <= 1`): apaga la alarma, pone `isRestRunning = false`, vibra y deja el tiempo en 0. La pantalla entonces muestra "¡Descanso terminado!".
- **`return clearRestInterval`** es la función de limpieza. React la ejecuta *antes de volver a correr el efecto* y también al desmontar. Así nunca hay dos alarmas simultáneas.
- **Dependencias `[isRestRunning, activeRestId]`**: el efecto se vuelve a ejecutar cuando cambia alguna. `activeRestId` está como protección: si se pasara de un descanso a otro con uno corriendo, `isRestRunning` seguiría en `true` y sin esa dependencia el efecto no se reiniciaría.

**¿Por qué `setRemainingSeconds((prev) => ...)` y no `remainingSeconds - 1`?** La función que recibe `setInterval` se crea una sola vez, al arrancar el efecto, y "recuerda" el valor de `remainingSeconds` de ese momento. Con `remainingSeconds - 1` siempre restaría sobre el valor inicial y el reloj se trabaría. La forma `(prev) => ...` le pide a React el valor *actual* en cada tic.

### La limpieza al salir de la pantalla

```ts
useEffect(() => clearRestInterval, []);
```

Es la forma abreviada de:
```ts
useEffect(() => {
  return () => clearRestInterval();   // se ejecuta al desmontar la pantalla
}, []);
```
El `[]` hace que el efecto corra una sola vez al montar, y la función que *devuelve* se ejecuta al desmontar. Si el usuario sale con el timer corriendo, la alarma se apaga. Sin esto seguiría restando segundos y vibraría con la pantalla cerrada. Ojo: devuelve `clearRestInterval` **sin paréntesis**, o sea la función en sí, no el resultado de llamarla.

### Recorrido de ejemplo: un descanso de 3 segundos

| Momento | `intervalRef.current` | Qué pasó |
|---|---|---|
| Antes de tocar ▶ | `null` | No hay alarma |
| Tocás ▶ | `42` (ejemplo) | `startRest` puso 3 segundos y `isRestRunning = true`; el efecto creó la alarma y guardó su id |
| 1 s | `42` | La alarma disparó: quedan 2 |
| 2 s | `42` | Misma alarma, mismo id: queda 1 |
| 3 s | `42` → `null` | Entra al `if`: apaga la alarma, `isRestRunning = false`, vibra, tiempo 0 |
| Re-render | `null` | La limpieza del efecto no encuentra alarma y no hace nada; el efecto sale por el `if` inicial |

Si se toca ⏸ a mitad de camino: `pauseRest` apaga la alarma enseguida y pone `isRestRunning = false`; el tiempo restante queda en `remainingSeconds`. Al tocar ▶ de nuevo, `resumeRest` pone `isRestRunning = true` y el efecto crea una alarma **nueva**, con otro id, que sigue desde donde quedó.

### Conversión y formato
- `toSeconds(time, unit)`: si la unidad es `'minutos'`, multiplica por 60; si no, usa el número tal cual.
- `formatRestUnit`: singulariza la unidad cuando vale 1 ("1 minuto", "2 minutos").
- `formatRestTime`: arma el texto `m:ss` (por ejemplo `1:05`) con `padStart` para el cero a la izquierda de los segundos.

## 9. Layout y estilos

- **Estructura de la pantalla:** `SafeAreaView` (respeta notch y barras) → header → área deslizable con el scroll → pie → modales.
- **Tarjeta centrada:** `content` tiene `flexGrow: 1` y `stepArea` tiene `flexGrow: 1` con `justifyContent: 'center'`. Así la tarjeta del paso queda en el medio del espacio libre entre el progreso y el pie.
- **Horizontal:** `useResponsiveLayout` entrega `isLandscape`, que se usa para limitar el ancho del contenido y de los modales.
- **Pie:** tiene el mismo fondo que la pantalla (`#101010`) para no confundirse con la barra de pestañas. "Anterior" y "Siguiente" comparten un único estilo (`navButton`, transparente con borde fino gris) y `flex: 1`, por lo que miden lo mismo.
- **Paleta:** fondo `#101010`, tarjetas `#1D1D1D`/`#242424`, acento amarillo `#FFC107`, descansos en azul `#66B8FF`.

## 10. Conexión con el escáner de QR

El escáner (bloque 6) valida que el QR sea el del gimnasio (`GYMBRO_CHECKIN_V1`) y que el usuario esté a menos de 150 m (fórmula de Haversine). Si todo es válido, `qrValid` pasa a `true` y la pantalla cambia a "Registrar entrenamiento": el usuario **elige qué día de su rutina hizo** en un selector (`dayPickerVisible`, `selectedDayId`), que muestra para cada día una descripción de los grupos musculares que trabaja (`getDayDescription`).

Al tocar "Confirmar día" se ejecuta `handleSubmit`:
1. Valida que haya día elegido y que los ejercicios hayan cargado.
2. Arma la lista de ejercicios del día con su grupo muscular.
3. Arma la fecha local (`YYYY-MM-DD`) y guarda el entrenamiento con `addWorkoutLog` (esto alimenta las estadísticas y el contador del inicio).
4. **Abre el entrenamiento guiado de ese día**:

```ts
navigation.replace('UserTabs', {
  screen: 'mi_rutina_user',
  params: {
    screen: 'entrenar_dia_user',
    params: { day: selectedDay },
    initial: false,
  },
});
```

Cómo leer esa llamada:
- **`replace`** (y no `navigate`) reemplaza la pantalla del escáner en la pila, para que atrás no vuelva a la cámara.
- **`'UserTabs'` → `screen: 'mi_rutina_user'` → `screen: 'entrenar_dia_user'`** es una navegación *anidada*: se le dice al stack raíz que abra el contenedor de pestañas, a este que se pare en "Rutinas", y a ese stack interno que muestre el entrenamiento.
- **`params: { day: selectedDay }`** es el día entero que viaja como parámetro.
- **`initial: false`**: cuando se navega a una pantalla anidada de un navegador que todavía no existe, React Navigation por defecto arma el stack **solo con esa pantalla**. Con `initial: false` se conserva la pantalla raíz del stack (`mi_rutina_user_root`) debajo. Esto es necesario: "Volver a mi rutina" usa `popToTop()` y el botón atrás necesita tener a dónde volver. Sin `initial: false`, el entrenamiento quedaría como única pantalla del stack.

Por lo tanto, la separación de responsabilidades es: **el QR registra que el usuario fue al gimnasio (estadísticas); el entrenamiento guiado lo acompaña durante la sesión (sin registrar nada)**.

## 11. Conexión con las demás pantallas

- **`mi_rutina_user`:** muestra cada día como una **tarjeta plegable**: título, resumen ("N ejercicios · M bloques"), botón "Comenzar entrenamiento" y un "Ver ejercicios ▾" que despliega la lista de bloques. Puede haber varios días abiertos a la vez (`openDayIds` es un arreglo de ids). El botón de comenzar hace `navigation.navigate('entrenar_dia_user', { day })`, y queda deshabilitado si `buildSteps(day)` devuelve una lista vacía (día sin nada para hacer).
- **`home_user`:** ya no tiene atajo a la rutina. Su acceso al flujo de entrenamiento es el botón "Escanear" del QR, que lleva al escáner (`navigation.getParent()?.navigate('escanear_qr_user')`, porque esa pantalla vive en el stack raíz y no en las pestañas).
- **`types.ts` / `UserTabs.tsx`:** la ruta se declara como `entrenar_dia_user: { day: RoutineDay }` en `UserRoutineStackParamList` y se registra con un `RoutineStack.Screen`. El árbol queda así:

```
UserTabs
 └─ mi_rutina_user ──► Stack anidado (RoutineStack)
                         ├─ mi_rutina_user_root     (lista de días)
                         └─ entrenar_dia_user       (el entrenamiento)
```

- **`ExercisesContext`:** provee `getExerciseById`, `loading`, `error` y `retry`. El catálogo viene de la API y se comparte con todas las pantallas.
- **Salir de la pantalla:** el botón atrás hace `goBack()` y vuelve a la lista de días **sin pedir confirmación**; "Volver a mi rutina" (en la pantalla final) hace `popToTop()`.

## 12. Limitaciones y mejoras posibles

1. **El temporizador cuenta ticks, no tiempo real.** Resta 1 por cada segundo que pasa con la app activa. Si el teléfono se bloquea o la app pasa a segundo plano, el reloj puede frenarse o atrasarse. Una versión exacta guardaría la hora de inicio (`Date.now()`) y calcularía el tiempo restante como la diferencia en cada tic.
2. **La vibración está dentro del actualizador de estado.** Los actualizadores deberían ser puros. En desarrollo React puede ejecutarlos dos veces para detectar problemas, lo que podría hacer vibrar dos veces. Se corregiría moviendo la vibración a un efecto que observe cuando el tiempo llega a 0.
3. **No hay persistencia del progreso.** `@react-native-async-storage/async-storage` ya está instalado. Se podría guardar `stepIndex` con una clave por usuario y día, borrarlo al terminar, y ofrecer "Continuar / Empezar de nuevo". Habría que decidir cuándo caduca (por ejemplo, al cambiar de día calendario) y qué hacer si el profesor edita la rutina y el paso guardado ya no existe.
4. **Gesto y atrás del sistema.** En iOS, un deslizamiento que empieza en el borde izquierdo puede ser interpretado por el sistema como "volver atrás". Como no hay confirmación al salir, se pierde el progreso.
5. **Tres estados para el modal** (`modalVisible`, `modalType`, `selectedExercise`) podrían unificarse en uno solo (`{ exercise, type } | null`): si hay ejercicio, el modal está visible.
6. **Datos de prueba.** Las rutinas viven en `src/data/routines.ts` (memoria). Con backend, `route.params.day` seguiría funcionando igual: solo cambiaría de dónde sale el día.
7. **Entradas inválidas en el timer.** Si `time` fuera `''` o no numérico, `toSeconds` daría `0` o `NaN` y se vería `NaN:NaN`.
8. **El contenido del modal desaparece antes del fundido.** `closeModal` pone `selectedExercise` en `null` al instante, así que durante la animación de salida probablemente se ve un recuadro con solo el botón "Cerrar". Detalle visual menor.
9. **Código repetido.** `formatRestUnit` (y el formato de tiempo) están escritos igual en `mi_rutina_user` y acá. Conviene moverlos a un archivo común, o eliminarlos si el descanso se guarda en segundos.

## 13. Lista para el bloque 9 (continúa la del documento 07)
37. Recibir `dayId` por parámetro y cargar el día desde el origen de datos; la pantalla pasa a tener estados de carga y error propios. Si se quiere retomar el recorrido al volver, persistir el `stepIndex` por usuario y día (AsyncStorage o servidor).
38. Temporizador: basarlo en la hora de fin (`Date.now()`) y mover la vibración y `setIsRestRunning` fuera del actualizador de `setRemainingSeconds`. Evaluar notificaciones locales si debe sonar con la app en segundo plano.
39. Extraer utilidades comunes (`formatRestUnit`, `toSeconds`, `formatRestTime`, hoy repetidas en `mi_rutina_user` y en esta pantalla) o eliminarlas guardando el descanso en segundos.
40. Unificar los tres estados del modal de GIF e instrucciones en uno solo.

## 14. Preguntas de verificación, con respuestas

### 1. ¿Por qué hay un solo estado `stepIndex` en vez de uno por cada cosa que se muestra?
Porque todo lo demás se puede **derivar** de él: el paso actual (`steps[stepIndex]`), si terminó (`stepIndex >= steps.length`), el texto de progreso y el ancho de la barra. Guardar valores derivados como estado aparte obligaría a mantenerlos sincronizados y abre la puerta a inconsistencias (por ejemplo, un "paso actual" que no coincide con el índice).

### 2. ¿Qué representa `stepIndex === steps.length`?
Es un paso *virtual*: no existe en la lista, y representa "ya terminó todo". Sirve para reutilizar el mismo mecanismo de avanzar para llegar a la pantalla de felicitación, sin necesitar otro estado booleano.

### 3. ¿Por qué `buildSteps` es una función aparte y no está dentro del componente?
Es lógica pura: recibe un día y devuelve una lista, sin depender de React. Al estar aparte se puede reutilizar: la usan la pantalla (para armar los pasos) y `mi_rutina_user` (para saber si el día tiene algo que hacer y deshabilitar el botón "Comenzar entrenamiento" si no).

### 4. ¿Qué pasa con el id de `setInterval` cuando se pausa y se reanuda?
Al pausar, `pauseRest` apaga la alarma (`clearInterval`) y deja `intervalRef.current = null`. Al reanudar, el efecto llama de nuevo a `setInterval`, que devuelve un id **nuevo**, y lo guarda. El tiempo restante se conserva porque vive en `remainingSeconds`, no en la alarma.

### 5. ¿Por qué `intervalRef` es un `useRef` y no un `useState`?
Porque el id no se muestra en pantalla: solo sirve para cancelar. Un `useRef` conserva el valor entre renders y no provoca un render al cambiar. Con `useState` cada guardado del id redibujaría la pantalla sin ningún beneficio.

Hay una segunda razón: el id hay que leerlo **de inmediato** y desde varias funciones (`clearRestInterval`, `startRest`, la limpieza del efecto). Un estado se actualiza recién en el próximo render, y una función podría leer un valor viejo; un ref se modifica al instante. Regla práctica: lo que se muestra en pantalla va en estado; los identificadores internos (timers, candados, referencias a elementos) van en refs.

### 6. ¿Qué haría falta para que el timer fuera exacto aunque la app pase a segundo plano?
Guardar el instante de fin (`Date.now() + segundos * 1000`) en vez de ir restando de a uno. En cada tic se calcula `fin - Date.now()`, así que, aunque los tics se atrasen o se frenen, al volver el tiempo mostrado es el real. Para un aviso con la app cerrada haría falta además una notificación local programada.

### 7. ¿Por qué `failOffsetY` es importante en el gesto de deslizar?
Sin él, el gesto horizontal competiría con el scroll vertical del `ScrollView`, y una tarjeta larga sería difícil de recorrer. `failOffsetY` hace que, si el dedo se mueve primero en vertical, el gesto se descarte y el scroll gane. Y `activeOffsetX` garantiza que solo se active ante un movimiento claramente horizontal.

### 8. ¿Por qué el QR navega con `initial: false`?
Para que la pantalla raíz del stack ("Rutinas") quede debajo del entrenamiento. Sin eso, React Navigation arma el stack anidado solo con la pantalla pedida, y tanto el botón atrás como "Volver a mi rutina" (`popToTop`) no tendrían a dónde volver.

### 9. ¿Por qué el QR usa `replace` y no `navigate`?
Con `navigate`, el escáner quedaría en la pila: al volver atrás desde el entrenamiento se reabriría la cámara. Con `replace`, la pantalla del escáner se *reemplaza* por el destino y desaparece de la pila.

### 10. ¿Qué diferencia hay entre lo que hace el QR y lo que hace el entrenamiento guiado?
El QR **registra** que el usuario asistió (`addWorkoutLog`, que alimenta estadísticas y el contador del inicio) y valida presencia con el código del gimnasio y la ubicación. El entrenamiento guiado **acompaña** la sesión paso a paso y no registra nada. Son independientes: el usuario puede abrir el entrenamiento desde "Rutinas" sin pasar por el QR.

### 11. ¿Por qué el pie con Anterior/Siguiente está fuera del `ScrollView`?
Para que siempre sea alcanzable, sin importar el largo de la tarjeta (por ejemplo, un ejercicio con una nota larga). Si estuviera dentro del scroll, el usuario tendría que desplazarse hasta abajo para poder avanzar.

### 12. ¿Cómo sabe el modal "Ver rutina" a qué paso saltar al tocar una fila?
Los pasos están en el mismo orden en que se recorren los bloques. Se busca el primer paso del bloque con `steps.findIndex(s => s.blockIndex === blockIndex)` y se le suma la posición del item dentro del bloque. Ese número es el `index` que recibe `goToStep`.

### 13. ¿Qué hace `useEffect(() => clearRestInterval, [])` y cuándo se ejecuta la función?
Es la forma abreviada de:
```ts
useEffect(() => {
  return () => clearRestInterval();
}, []);
```
El cuerpo del efecto no hace nada al montar; solo **devuelve** `clearRestInterval` como función de limpieza. Con `[]` como dependencias, esa limpieza se ejecuta **una sola vez, cuando el componente se desmonta** (por ejemplo, al volver atrás). Garantiza que el `setInterval` no quede corriendo en una pantalla que ya no existe, lo que seguiría consumiendo recursos y llamaría a `setState` sobre un componente desmontado.

Detalle: `clearRestInterval` se recrea en cada render, pero la versión del primer render funciona igual, porque solo lee `intervalRef.current` y el ref es el mismo objeto durante toda la vida del componente.

### 14. ¿Por qué `setRemainingSeconds((prev) => ...)` y no `remainingSeconds - 1`?
La función que recibe `setInterval` se crea una sola vez, cuando corre el efecto, y captura (*closure*) el valor de `remainingSeconds` de ese instante, por ejemplo 60. Si dentro usara `remainingSeconds - 1`, cada segundo calcularía `60 - 1 = 59` y lo guardaría: el contador se quedaría clavado en 59.

La forma funcional `(prev) => prev - 1` recibe de React el valor **más reciente** en el momento de aplicar el cambio, sin depender de la captura. Es la misma razón del `setForm((prev) => ...)` en `signup` (documento 05) y del `setOpenDayIds((ids) => ...)` de `mi_rutina_user`.

### 15. ¿Para qué sirve `activeRestId` en las dependencias del `useEffect` que cuenta?
Un `useEffect` solo reacciona a **cambios** de sus dependencias: si querés que se ejecute otra vez, algo de la lista tiene que cambiar.

Supongamos que el efecto dependiera solo de `[isRestRunning]`. Con el descanso A corriendo, si se inicia el descanso B, `startRest` apaga la alarma de A y pone `isRestRunning = true`, pero **ya era `true`**: React no ve ningún cambio, el efecto no se re-ejecuta y nadie crea la alarma nueva. B quedaría congelado mostrando su tiempo inicial con el ícono ⏸.

Con `activeRestId` en la lista, el cambio de A a B sí dispara el efecto: React ejecuta la limpieza (apaga la alarma vieja) y vuelve a correr el efecto, que crea una alarma nueva para B. En esta pantalla el caso casi no se da, porque `cancelRest` frena todo al cambiar de paso, pero la dependencia queda como protección.

### 16. ¿Qué problema tienen los tres estados del modal y cómo se simplificaría?
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
