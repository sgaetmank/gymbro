# Bloque 7c: `estadisticas_user`, `reloj` y `mi_cuenta_user`

Archivos: `src/screens/estadisticas_user.tsx` (488 líneas), `src/screens/reloj.tsx` (186) y `src/screens/mi_cuenta_user.tsx` (272). Cierran el flujo del usuario.

## 1. `estadisticas_user.tsx`

### Estado y flujo
```tsx
const [selected, setSelected] = useState({ year: today.getFullYear(), month: today.getMonth() });
```
El **único estado** es el mes que se mira. Todo lo demás se **deriva en cada render**:

```
userLogs     = getWorkoutLogsByUser(user.id)             // todos los registros del usuario
monthLogs    = userLogs.filter(log => log.date.startsWith('YYYY-MM'))
weeks        = getWeeksOfMonth(...)                       // barras semanales
muscleGroups = countByMuscleGroup(...)                    // barras por grupo
exercisesDone = monthLogs.reduce(...)                     // suma de ejercicios
```
Principio: guardar el mínimo y calcular el resto.

### Detalles de fechas
- **Filtrar por mes con `startsWith`:** las fechas son `'YYYY-MM-DD'`; el prefijo `'2026-08'` identifica el mes. `toDateKey(year, month, 1).slice(0, 7)` lo arma. Funciona porque el formato ISO ordena igual como texto que como fecha.
- **`month` empieza en 0** (enero = 0), por eso `toDateKey` hace `month + 1`.
- **`new Date(year, month + 1, 0).getDate()`** da la cantidad de días del mes (ver pregunta 1).
- **Cambiar de mes:** `new Date(selected.year, selected.month + delta, 1)` con `delta` de `-1` o `+1` (ver pregunta 2).

### `getWeeksOfMonth`
Recorre los días del mes uno por uno:
- Cada **lunes** (`getDay() === 1`; 0 es domingo) abre una semana nueva. Si el mes no arranca en lunes, la primera semana es parcial.
- `week.to = day` extiende la semana actual; si la fecha está en `trainedDates` (un `Set`), suma 1 a `trained`.
- Cuenta **días distintos**, no registros: usa `new Set(monthLogs.map(log => log.date))`.
- `weeks.push(week)` guarda una **referencia**; las modificaciones posteriores al mismo objeto se reflejan en el array (ver pregunta 3).

### `countByMuscleGroup`
Acumula en un `Record<string, number>` con `counts[g] = (counts[g] ?? 0) + 1`, lo convierte con `Object.entries(...).map(...)` y ordena de mayor a menor con `.sort((a, b) => b.count - a.count)`. Cuenta ejercicios: un mismo ejercicio hecho en dos días suma dos veces.

### Gráficos sin librería
Las barras son `View`s con tamaño calculado:
- Semanal: `height = (week.trained / maxWeekValue) * 120` px.
- Por grupo: `width = ${(count / maxGroupCount) * 100}%`.
- **`Math.max(1, ...weeks.map(w => w.trained))`:** el `1` evita dividir por cero en un mes sin entrenamientos.
- **`muscleGroups[0]?.count ?? 1`:** como la lista está ordenada de mayor a menor, el primero es el máximo; el `?? 1` cubre la lista vacía.
- Mes sin registros: un ternario muestra un mensaje en lugar de gráficos vacíos.
- Las columnas semanales muestran solo el número de días; **no tienen etiqueta de qué semana son**.

### Cosas a notar
1. **¿Se actualiza al registrar un entrenamiento? (a verificar).** No usa `useFocusEffect` como `home_user`. La pestaña, una vez visitada, queda montada y los datos se recalculan solo si el componente vuelve a renderizar. Además el proyecto tiene el React Compiler habilitado (`reactCompiler: true`; el paquete `babel-plugin-react-compiler` está en `node_modules` como dependencia transitiva). El compilador asume que los componentes son puros y puede **cachear** el resultado de `getWorkoutLogsByUser(user.id)` mientras `user.id` no cambie, aunque el array en memoria haya cambiado. No lo comprobé. Prueba: abrir Estadísticas, registrar un entrenamiento con el QR y volver.
2. **Dos definiciones de "entrenamiento":** la tarjeta "Entrenamientos" cuenta **registros** (`monthLogs.length`); el gráfico semanal y el contador de `home_user` cuentan **días distintos**.
3. **`'Movilidad'`:** los registros de ejemplo usan ese grupo para ciertos estiramientos, pero el mapeo actual de `exercisesApi.ts` los clasifica como `'Pierna'`. Un mes viejo mostraría un grupo que los meses nuevos nunca mostrarán.
4. Se puede navegar a meses futuros sin límite.
5. Con BD, bajar todos los registros y filtrar en el cliente no escala; la agregación debe hacerla el servidor.

## 2. `reloj.tsx` (cronómetro)

```tsx
const [elapsedTime, setElapsedTime] = useState(0);   // milisegundos
const [isRunning, setIsRunning] = useState(false);

useEffect(() => {
  if (!isRunning) return undefined;
  const interval = setInterval(() => setElapsedTime(t => t + 1000), 1000);
  return () => clearInterval(interval);
}, [isRunning]);
```
- Cuenta **hacia arriba** (el descanso de `ver_dia_x_user` cuenta hacia abajo).
- **El intervalo no necesita `useRef`** porque se crea y se limpia dentro del mismo effect (ver pregunta 4).
- `return undefined` explícito: el effect devuelve algo en todos los caminos.
- `setIsRunning((running) => !running)`: forma funcional para alternar Iniciar/Pausar.
- "Reiniciar": `setIsRunning(false)` y `setElapsedTime(0)` (React los junta en un solo render).
- Formato: `Math.floor(elapsed / 60000)` minutos y `Math.floor((elapsed % 60000) / 1000)` segundos, con `padStart(2, '0')`. Pasada la hora muestra `75:00` (no hay horas).
- Es la **única pantalla que usa `width`** del hook, para achicar la tarjeta en pantallas angostas (`width < 360`).
- **Sigue corriendo al cambiar de pestaña** (ver pregunta 5).
- Mismo problema de precisión que el descanso: sumar 1000 por tick acumula error y en segundo plano los timers se limitan. Con una hora de inicio (`Date.now() - inicio`) sería exacto.
- Es 100 % cliente: no tiene relación con la rutina ni con la base de datos.

## 3. `mi_cuenta_user.tsx`

Muestra el perfil (`user.initials`, `user.name`, `user.email`), dos `ProfileDataCard` (documento 04), una tarjeta de objetivo y el botón de cerrar sesión. Es de solo lectura.

### `confirmLogout`
```tsx
Alert.alert('Cerrar sesión', '¿Estás seguro...?', [
  { text: 'Cancelar', style: 'cancel' },
  { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
], { cancelable: true, onDismiss: () => {} });
```
- **`onPress: logout`** pasa la función, no la ejecuta (ver pregunta 6).
- `style: 'cancel'` y `'destructive'` los interpreta iOS (botón en negrita y botón rojo); en Android casi se ignoran.
- `cancelable: true` solo tiene efecto en Android (tocar afuera cierra el Alert). El `onDismiss` vacío no hace nada.
- `logout` hace `setUser(null)`; `AppNavigator` quita `UserTabs` y los guards `if (!user) return null` evitan errores durante la animación (documentos 02 y 03).
- **Al cerrar sesión se desmonta todo `UserTabs`**, por eso el próximo usuario ve las pantallas con estado nuevo.

### Cosas a notar
- No hay edición de perfil ni de contraseña.
- Los datos se muestran tal cual (`"23 años"`, `"75.5 kg"`).
- Con backend, cerrar sesión también debe borrar el token guardado e idealmente invalidarlo en el servidor.

## 4. Lista para el bloque 9 (continúa la del documento 08)
41. Estadísticas: endpoint que devuelva ya agregados el resumen del mes, las semanas y los grupos (por año/mes), con carga y error, y refrescado al ganar el foco.
42. Unificar la definición de métricas ("registro" vs "día entrenado") y fijar la zona horaria con la que se agrupa por día y por semana.
43. Definir de dónde sale el grupo muscular del registro y normalizar los datos antiguos (`'Movilidad'`).
44. El cronómetro es 100 % cliente; solo decidir si debe sobrevivir al cierre de la app. Pasarlo a hora de inicio.
45. Perfil: obtener los datos del usuario desde el servidor (sin contraseña) y, si entra en el alcance, permitir editarlos. Cerrar sesión borra el token.

## 5. Preguntas de verificación, con respuestas

### 1. ¿Qué hace `new Date(year, month + 1, 0).getDate()` y por qué funciona?
Devuelve la **cantidad de días del mes** `month`. El constructor `Date` acepta valores fuera de rango y los **normaliza**: el día `0` significa "el día anterior al día 1". Entonces `new Date(year, month + 1, 0)` es "el día anterior al día 1 del mes siguiente", o sea el **último día del mes** `month`, y `getDate()` extrae ese número.

Ejemplo: febrero de 2024 (`month = 1`) → `new Date(2024, 2, 0)` → 29 de febrero → `29`. Resuelve solo los años bisiestos y los meses de 28, 30 y 31 días, sin tablas.

### 2. ¿Por qué `new Date(year, month + delta, 1)` maneja solo el cambio de año?
Por la misma normalización: un mes fuera de rango pasa al año correspondiente.
- `new Date(2026, 12, 1)` → 1 de enero de 2027.
- `new Date(2026, -1, 1)` → 1 de diciembre de 2025.

Después se leen `getFullYear()` y `getMonth()` del resultado, que ya vienen corregidos. Se usa el día `1` a propósito: con el día 31 y avanzar un mes, `Date` se desbordaría (31 de enero + 1 mes = 3 de marzo, porque febrero no tiene 31). El día 1 existe en todos los meses.

### 3. En `getWeeksOfMonth`, `week` se modifica después de `weeks.push(week)`. ¿Por qué el array lo refleja?
Los objetos en JavaScript se guardan y se pasan **por referencia**. `weeks.push(week)` no copia el objeto: guarda en el array una referencia al mismo objeto al que apunta la variable `week`. Cuando luego se hace `week.to = day` o `week.trained++`, se modifica ese único objeto, y el array lo ve porque apunta al mismo.

Cuando arranca una semana nueva, `week = { ... }` asigna un objeto distinto a la variable (no toca el anterior, que queda en el array con sus valores finales).

Esto no contradice la regla de "no mutar el estado" de React: acá el objeto es una **variable local** que se construye dentro de una función y no pertenece al estado de ningún componente.

### 4. ¿Por qué el cronómetro de `reloj` no necesita `useRef` y el descanso de `ver_dia_x_user` sí?
Depende de **desde dónde se corta el intervalo**.
- **`reloj`:** el intervalo se crea y se limpia dentro del mismo `useEffect`. La variable local `interval` y el cleanup (`return () => clearInterval(interval)`) están en el mismo ámbito (*closure*), así que no hace falta guardar nada entre renders.
- **`ver_dia_x_user`:** el intervalo se corta también desde otras funciones fuera del effect (`startRest`, `pauseRest`, el cleanup de desmontaje). Esas funciones necesitan acceder al id, así que debe guardarse en algo que persista entre renders y sea accesible desde todas partes: un `useRef`.

Regla: si todo el ciclo de vida ocurre dentro de un effect, una variable local alcanza; si otras funciones necesitan tocarlo, va en un ref.

### 5. ¿Por qué el cronómetro sigue corriendo al cambiar de pestaña, pero el temporizador de descanso se pierde al volver atrás?
- **Cronómetro:** vive en una pantalla de un Tab.Navigator. Al cambiar de pestaña, la pantalla **no se desmonta**: solo pierde el foco, su estado y su `setInterval` siguen vivos. Se detiene recién cuando todo `UserTabs` se desmonta (al cerrar sesión).
- **Descanso:** vive en `ver_dia_x_user`, una pantalla de un **stack**. Al hacer `goBack`, esa pantalla se **desmonta**, y su cleanup (`useEffect(() => clearRestInterval, [])`) corta el intervalo y todo su estado se pierde.

Es la diferencia entre Tabs y Stack del documento 03.

### 6. ¿Diferencia entre `onPress: logout` y `onPress: logout()`?
- `onPress: logout` pasa **la función** como valor: el Alert la guarda y la llama cuando el usuario toque "Cerrar sesión".
- `onPress: logout()` **ejecuta la función en ese momento** (al armar la lista de botones) y le pasa a `onPress` lo que devuelva, que es `undefined`.

Con `logout()`, la sesión se cerraría apenas se abre el diálogo, antes de que el usuario pueda confirmar ni cancelar. Es el error clásico de pasar el resultado de una función cuando se quería pasarla a ella.

### 7. ¿Por qué la tarjeta "Entrenamientos" y el gráfico semanal podrían no coincidir?
Miden cosas distintas:
- **"Entrenamientos"** = `monthLogs.length`: cantidad de **registros** (cada escaneo del QR crea uno).
- **Gráfico semanal** = `trainedDates.has(...)`, con un `Set` de fechas: cantidad de **días distintos** con al menos un registro.

Si un usuario registra dos entrenamientos el mismo día, "Entrenamientos" suma 2 y el gráfico suma 1. `home_user` también cuenta días distintos. Hay que decidir cuál es la definición oficial y usarla en todas partes.
