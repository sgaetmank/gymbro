# Bloque 7a: `home_user` y `mi_rutina_user`

Archivos: `src/screens/home_user.tsx` y `src/screens/mi_rutina_user.tsx`. Las dos son sobre todo **presentación**: leen datos y los dibujan.

## 1. `home_user.tsx`

### Qué muestra
Saludo con `user.firstName`, un contador de "días entrenados este año" y tres tarjetas de acción:

| Tarjeta | Botón | Destino |
|---|---|---|
| Ver más estadísticas | Ver | `navigate('estadisticas_user')` (pestaña hermana) |
| ¿Ya entrenaste hoy? | Escanear | `getParent()?.navigate('escanear_qr_user')` (stack raíz) |
| ¿Cómo llegar al gym? | Ver mapa | `handleOpenMap` (abre Google Maps) |

Las dos primeras se analizaron en el documento 03 (navegación). El inicio ya no tiene un atajo a la rutina: se llega desde la pestaña "Rutinas" de la barra inferior, o desde el QR (documento 08).

### El contador y `useFocusEffect`
```tsx
const userId = user?.id;
const [workoutDaysThisYear, setWorkoutDaysThisYear] = useState(0);

useFocusEffect(
  useCallback(() => {
    setWorkoutDaysThisYear(userId != null ? getWorkoutDaysThisYear(userId) : 0);
  }, [userId])
);
```
- **Por qué estado y no cálculo directo en el render:** `addWorkoutLog` modifica el array en memoria, pero nadie le avisa a React. Al volver a la pestaña "Inicio" no cambió ningún estado, así que no hay re-render. `useFocusEffect` recalcula el número al ganar el foco y, al llamar a `setWorkoutDaysThisYear`, fuerza el re-render.
- **`userId` aparte en vez de `user` como dependencia:** `user` es un objeto (se compara por referencia); `user?.id` es un número (se compara por valor).
- **Con BD real** esto pasa a ser una consulta asíncrona dentro del mismo `useFocusEffect`, con estado de carga.

### El guard `if (!user) return null`
Al hacer `logout()`, `user` pasa a `null` pero la pantalla **sigue montada durante la animación de salida** del stack. Sin el guard, `user.firstName` rompería. TypeScript también lo exige (`user` es `User | null`).

El `return null` está **después** de todos los hooks: los hooks no pueden ir después de un `return` condicional porque el orden de llamada cambiaría entre renders. `mi_rutina_user` cumple lo mismo.

### `handleOpenMap`
```tsx
const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
await Linking.openURL(url);
```
- `Linking.openURL` le pide al sistema que abra la URL: en la app de Google Maps si está instalada, o en el navegador.
- `encodeURIComponent` convierte espacios, comas y tildes a su forma válida en una URL.
- `try/catch` con un `Alert` si falla.
- La dirección es la de la Pontificia Universidad Católica Argentina, consistente con `GYM_LOCATION` del QR.

### Cosas a notar
1. **"Racha" no existe.** El comentario dice "días en racha" y el texto "para no perder la racha", pero lo que se calcula es la cantidad de días entrenados en el año, no días consecutivos.
2. **Espacios dentro de `<Text>`:** `<Text> Hola, {user.firstName}! </Text>` conserva los espacios del principio y del final porque están en la misma línea. Detalle de estilo.

## 2. `mi_rutina_user.tsx`

Lee la rutina asignada y dibuja cada día como una **tarjeta plegable**. Plegada, la tarjeta muestra el nombre del día, un resumen ("N ejercicios · M bloques"), el botón "Comenzar entrenamiento" y un enlace "Ver ejercicios ▾". Al desplegarla aparece el detalle anidado: bloques → ítems (ejercicios y descansos). La idea es que entren varios días en una sola pantalla.

```tsx
const routine = getRoutineById(user.id_rutina);
```
Lectura síncrona del modelo de datos (documento 01) en cada render.

### Tarjetas plegables

**Qué días están abiertos.**
```tsx
const [openDayIds, setOpenDayIds] = useState<number[]>([]);

const toggleDay = (dayId: number) =>
  setOpenDayIds((ids) =>
    ids.includes(dayId) ? ids.filter((id) => id !== dayId) : [...ids, dayId]
  );
```
- Es un **arreglo de ids**, no un solo número: así pueden estar abiertos varios días a la vez. Empieza vacío (todo plegado).
- `toggleDay` usa la forma funcional `(ids) => ...` para partir del valor más reciente. Si el id ya está, lo saca con `filter` (que devuelve un arreglo **nuevo**); si no está, devuelve `[...ids, dayId]`, otro arreglo nuevo con el id agregado. Nunca se modifica el arreglo existente (`push`/`splice`), porque React solo detecta un cambio de estado si recibe una referencia distinta.
- Se guardan **ids y no objetos día**, por el mismo criterio de "una sola fuente de verdad" del documento 06.
- El estado vive en la pantalla: al cambiar de pestaña y volver se conserva (las pestañas no se desmontan), pero al cerrar la app todo vuelve a empezar plegado.

**El resumen.**
```tsx
const countExercises = (day: RoutineDay) =>
  day.blocks.reduce(
    (total, block) => total + block.items.filter((i) => i.type === 'exercise').length,
    0
  );
```
`reduce` recorre el arreglo acumulando un valor (`total`, que arranca en 0). Acá suma la cantidad de ejercicios de cada bloque, sin contar los descansos. El texto es `${countExercises(day)} ejercicios · ${day.blocks.length} bloques` y no se pluraliza ("1 ejercicios", "1 bloques").

**Desplegar el detalle.** La lista de bloques se dibuja con un renderizado condicional:
```tsx
{openDayIds.includes(day.id) && day.blocks.map((block, blockIndex) => ( ... ))}
```
Si el día no está abierto, la expresión vale `false` y React no dibuja nada. El texto del enlace cambia entre "Ver ejercicios ▾" y "Ocultar ejercicios ▴" con la misma condición.

**Comenzar el entrenamiento.** El botón hace `navigation.navigate('entrenar_dia_user', { day })` (documento 08). Se **deshabilita** si el día no tiene nada para hacer:
```tsx
disabled={buildSteps(day).length === 0}
```
`buildSteps` es la función que aplana el día en pasos (documento 08); una lista vacía significa día sin ejercicios ni descansos.

### Las tres capas de `.map`
```
routine?.days.map(day =>            // key = day.id
  day.blocks.map((block, i) =>      // key = block.id
    block.items.map(item =>         // key = item.id
```
- `routine?.days.map(...)`: si `routine` es `undefined`, la expresión vale `undefined` y React no dibuja nada. Antes se muestra "Todavía no tenés una rutina asignada".
- Los `key` son los `id` de los datos (teoría del documento 04).
- **El nombre del bloque no se guarda:** `Bloque ${blockIndex + 1}` se calcula con la posición (segundo argumento de `.map`). Si el entrenador reordena los bloques, los nombres se renumeran solos. Los días sí guardan nombre (`"Día 1"`).

### Unión discriminada en acción
```tsx
{item.type === 'exercise' ? ( ...item.exerciseId, item.series... ) : ( ...item.time, item.unit... )}
```
Dentro de cada rama TypeScript sabe qué campos existen (documento 01).

### El nombre del ejercicio: tres casos en una línea
```tsx
getExerciseById(item.exerciseId)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')
```
- `?.` (*optional chaining*): si el resultado es `undefined`, corta y da `undefined` en vez de romper.
- `??` (*nullish coalescing*): usa el valor de la derecha solo si el de la izquierda es `null` o `undefined`.
- Resultado: **nombre** si está en el catálogo, **"Cargando…"** si el catálogo está bajando, **"Ejercicio no disponible"** si ya terminó y no está.
- Esta pantalla no distingue "error de red" ni ofrece reintentar (`entrenar_dia_user` sí).

### `formatRestUnit`
```tsx
const formatRestUnit = (time, unit) => Number(time) === 1 ? unit.slice(0, -1) : unit;
```
Singular/plural: `1 minuto`, `2 minutos`. `slice(0, -1)` quita la última letra. Funciona solo con `minutos` y `segundos`; es simple pero frágil. Está **escrita igual en `entrenar_dia_user`** (documento 08): código repetido que conviene mover a un archivo común (o eliminar si el descanso se guarda como segundos).

### Comentarios opcionales
`{item.comments !== '' && (<Text>...)}`: la comparación explícita devuelve un booleano. Con `{item.comments && ...}`, un string vacío quedaría como valor "falso" que React intentaría dibujar, y en React Native un string suelto fuera de un `<Text>` es un problema.

### Navegación
`navigation.navigate('entrenar_dia_user', { day })` pasa el **objeto día completo** (punto 3 de la sección 9 del documento 03).

## 3. Por qué hoy los cambios del trainer sí se ven (y con BD no)

`getRoutineById` se ejecuta en cada render y lee el array en memoria. Cuando el entrenador guarda (`updateRoutineDays` / `createRoutine`), modifica ese array. El alumno **no puede estar logueado al mismo tiempo** (hay una sola sesión): al cerrar sesión y entrar como alumno, las pantallas se montan de cero y leen los datos actuales. Es una coincidencia del prototipo.

Con BD real, el alumno puede tener la app abierta mientras el entrenador cambia la rutina desde otro dispositivo. La pantalla tendría que volver a pedir los datos (al ganar el foco, con pull-to-refresh o con notificaciones).

## 4. Lista para el bloque 9 (continúa la del documento 06)
32. El contador de `home_user` pasa a ser una consulta asíncrona (idealmente un endpoint que devuelva el conteo calculado) dentro de `useFocusEffect`, con carga y error.
33. `mi_rutina_user` tiene que refrescar la rutina (al ganar el foco o con pull-to-refresh), con estados de carga y de "sin rutina".
34. Modelado de la rutina: `series`, `repetitions` y `weight` son strings (`'4'`, `'10'`, `'0 kg'`) y el descanso es `time` + `unit` en texto. En la BD conviene guardar números (y el descanso como segundos) y formatear en la pantalla, lo que elimina `formatRestUnit`. Revisar si las repeticiones admiten rangos como "8-12" antes de decidir (se verá en el editor).
35. Decidir si se implementa una racha real (días consecutivos) o se renombra el texto.
36. La dirección del gimnasio pasa a configuración compartida con las coordenadas del check-in.

## 5. Preguntas de verificación, con respuestas

### 1. ¿Por qué `userId` se extrae a una variable y se usa como dependencia en vez de `user`?
Las dependencias de `useCallback`/`useEffect` se comparan con `Object.is`: los números por **valor** y los objetos por **referencia**. El callback solo usa el id, así que la dependencia correcta es el id.

Si la dependencia fuera `user`, el callback se recrearía cada vez que cambie la referencia del objeto, aunque sea el mismo usuario. Hoy `user` es siempre el mismo objeto durante la sesión, así que no se notaría. Pero con BD, `user` pasará a ser una copia que se refresca desde el servidor: cada refresco produciría un objeto nuevo y `useFocusEffect` volvería a ejecutarse sin necesidad. Con `userId`, solo se ejecuta si cambia el usuario de verdad. Regla: depender de lo mínimo y de valores primitivos.

### 2. ¿Por qué el contador necesita `useFocusEffect` y estado, y no basta calcularlo en el render?
Porque React solo vuelve a renderizar un componente cuando cambia su estado, sus props o un context. `addWorkoutLog` agrega un registro a un array común, y eso no dispara ningún re-render. Al volver a "Inicio" tras escanear el QR, el componente no tiene motivo para renderizar, y si el cálculo estuviera directo en el render se mostraría el valor viejo.

`useFocusEffect` ejecuta el cálculo cada vez que la pantalla gana el foco, y `setWorkoutDaysThisYear` cambia el estado, lo que sí provoca el re-render con el valor nuevo. El estado es el "puente" entre un dato que cambió afuera de React y la pantalla.

### 3. ¿Por qué existe `if (!user) return null` y por qué va después de los hooks?
**Por qué existe:** al cerrar sesión, `user` pasa a `null` pero la pantalla sigue montada mientras dura la animación de salida del stack, y se renderiza una vez más. Sin el guard, `user.firstName` lanzaría un error. Además, TypeScript exige el guard porque `user` es `User | null`.

**Por qué después de los hooks:** las reglas de los hooks obligan a llamarlos siempre, en el mismo orden, en cada render. Si el `return null` estuviera antes de un hook, cuando `user` sea `null` ese hook no se ejecutaría y React encontraría una cantidad distinta de hooks que en el render anterior, lo que da error ("Rendered fewer hooks than expected").

### 4. ¿Qué tres resultados puede dar `getExerciseById(...)?.name ?? (loading ? ... : ...)`?
1. **El nombre real del ejercicio**, si el catálogo ya cargó y el id existe.
2. **"Cargando…"**, si el ejercicio no está y el catálogo todavía se está descargando (`loading` es `true`).
3. **"Ejercicio no disponible"**, si el ejercicio no está y la carga ya terminó (o falló).

`?.` evita el error cuando no hay ejercicio; `??` pasa a la alternativa solo cuando el resultado es `null` o `undefined`.

### 5. Si el usuario está en pleno entrenamiento, cambia de pestaña y vuelve a "Rutinas", ¿qué ve?
Vuelve al **mismo paso** en que estaba. Las pestañas no se desmontan al cambiar de foco: solo pierden el foco y siguen vivas en segundo plano, y eso incluye el stack anidado de "Rutinas" con `entrenar_dia_user` adentro. Su estado (`stepIndex`, el modal, el temporizador) se conserva. En cambio, si sale con el botón atrás (`goBack`), la pantalla sí se desmonta y el progreso se pierde. Para volver a la lista de días desde otra pestaña habría que navegar con `{ screen: 'mi_rutina_user_root' }`, como hace el listener del tab de "Buscar Usuario" en `TrainerTabs`.

### 6. ¿Por qué hoy el alumno ve los cambios del trainer, y qué cambia con una BD real?
**Hoy:** el trainer modifica el array en memoria y `getRoutineById` lo lee en cada render. Como hay una sola sesión a la vez, al cerrar sesión y entrar como alumno las pantallas se montan de cero y leen los datos ya actualizados. No hay concurrencia.

**Con BD:** el alumno puede tener la app abierta con una versión vieja de la rutina mientras el trainer la edita desde otro dispositivo. La pantalla tiene que volver a pedir los datos (al ganar el foco, con pull-to-refresh o por notificación), y gestionar los estados de carga, error y "sin rutina". Lo que hoy es una lectura síncrona pasa a ser una consulta de red.

### 7. ¿Por qué `openDayIds` es un `useState<number[]>` y `toggleDay` no usa `push` ni `splice`?
**Por qué un arreglo:** hace falta saber *cuáles* días están abiertos, y se permite más de uno a la vez. Un solo número (`openDayId`) solo podría recordar un día, y obligaría a plegar el anterior al abrir otro.

**Por qué no se muta:** React decide si volver a dibujar comparando la referencia del estado nuevo con la del anterior. `push` y `splice` modifican el **mismo** arreglo, así que la referencia no cambia y React puede no enterarse. `filter` y el spread (`[...ids, dayId]`) devuelven un arreglo **nuevo**, que sí se detecta como cambio. La forma funcional `setOpenDayIds((ids) => ...)` garantiza además partir del valor más reciente aunque se toquen dos tarjetas muy seguido.
