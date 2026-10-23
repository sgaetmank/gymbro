# Bloque 3: estado global y sesión

Archivos: `src/context/AuthContext.tsx`, `src/context/ExercisesContext.tsx`, `src/services/exercisesApi.ts` (y `src/components/ExerciseGif.tsx` como consumidor visual).

## 1. Qué es un Context y por qué se usa

Problema: muchas pantallas necesitan saber quién es el usuario. Sin Context habría que pasar `user` como prop de componente en componente (*prop drilling*).

1. `createContext(valorPorDefecto)` crea el "canal".
2. `<Provider value={...}>` lo alimenta desde arriba (en `app/index.tsx`).
3. `useContext(...)` lo lee desde cualquier componente de abajo. `useAuth()` y `useExercises()` son atajos que envuelven esa llamada.

Cuando el `value` cambia, **todos los componentes que lo consumen se re-renderizan**.

El valor por defecto (`user: null`, funciones vacías) solo se usa si un componente lee el context fuera de su Provider. En esta app no ocurre.

## 2. `AuthContext`

**Estado:** un único `useState<User | null>(null)`. `null` = nadie logueado.

**Funciones:**
- `login(email, password)`: busca en `users` por email (sin distinguir mayúsculas ni espacios) y contraseña exacta. Si no encuentra, devuelve `{ ok: false, error }`. Si encuentra, hace `setUser(found)` y devuelve `{ ok: true }`.
- `register(data)`: valida que email y DNI no estén repetidos, llama a `addUser(data)` (INSERT en memoria) y hace `setUser(...)`: el alumno nuevo queda logueado.
- `logout()`: `setUser(null)`.

**Patrón `{ ok, error? }`:** los errores esperados (credenciales malas, email repetido) no lanzan excepciones; se devuelve un objeto y la pantalla decide qué mostrar. Con backend se mantiene, pero la función pasa a ser `async`.

**Conexión con la navegación:** `setUser` cambia el estado, `AuthProvider` se re-renderiza, `AppNavigator` (que consume `useAuth`) también, y el stack muestra las pantallas del rol. No hay `navigate()` después del login.

### Cosas a notar
1. **Aliasing de objetos.** `setUser(found)` usa el mismo objeto que está dentro del array `users`. Ver pregunta 4 más abajo.
2. **No hay persistencia.** `@react-native-async-storage/async-storage` está instalado pero no se usa en ningún archivo. Al cerrar la app se pierde la sesión, y también cualquier cambio en memoria (alumnos nuevos, rutinas editadas, logs).
3. **"Solo cambiar el cuerpo de la función"** (comentario del código) es cierto como idea, pero además hay que cambiar cada pantalla que llama a `login` y `register`, porque pasan a ser asíncronas: aparecen estados de carga y errores de red que hoy no existen.
4. **Seguridad real.** El `user` incluye `password`. Con backend, la contraseña no vuelve nunca al cliente. El login envía credenciales y recibe un **token** (JWT o similar), que se guarda de forma segura (`expo-secure-store`, no AsyncStorage).

## 3. `exercisesApi.ts`

- **Fuente:** JSON estático en GitHub servido por el CDN jsDelivr. Sin API key. La URL fija la versión (`@v1.1.0`) para que un cambio en el repo original no rompa la app.
- **`fetchExercises()`**: hace `fetch`, revisa `response.ok` y lanza `Error` si falla, parsea el JSON y lo pasa por `adaptarEjercicio`.
- **Dos tipos:** `ApiExercise` (cómo viene de afuera: `muscle`, `gifUrl`) y `Exercise` (cómo lo usa la app: `muscleGroup`, `gif`). Es un **adaptador**: si la API cambia sus campos, solo se toca este archivo.
- **`GRUPOS_MUSCULARES`:** reduce los músculos de la API (inglés, muy granulares) a los grupos que usan las estadísticas (Abdomen, Pecho, Espalda, Hombro, Bíceps, Tríceps, Glúteos, Pierna, Cardio). Si aparece un músculo no mapeado, `?? ejercicio.muscle` deja el valor original en lugar de romper.
- `workoutLogs.ts` contiene grupos como `'Movilidad'` que no están en este diccionario; se guardan en el log al momento del registro (se ve en `escanear_qr_user`).

## 4. `ExercisesContext`

**Estado:** `exercises`, `loading` (arranca en `true`), `error`, `attempt`.

**Flujo de carga** (`useEffect` con dependencia `[attempt]`):
1. Al montar llama a `fetchExercises()`.
2. Si sale bien guarda los datos; si falla guarda el mensaje. En ambos casos `finally` pone `loading` en `false`.
3. La bandera `cancelled` evita escribir estado si el componente se desmontó o si ya hay una carga más nueva.

**El índice con `Map`:** ~1300 ejercicios. Un `useMemo` construye una vez un `Map` id → ejercicio, y `getExerciseById` pasa a ser O(1).

**Dato clave:** la rutina solo guarda `exerciseId`. Cada pantalla resuelve nombre, GIF e instrucciones con `getExerciseById`. Es como una clave foránea apuntando a una fuente externa.

### Cosas a notar
1. `useState(null)` para el error: TypeScript infiere `null`, no `string | null`. Compila porque `err.message` es `any`, pero está impreciso. Correcto: `useState<string | null>(null)`.
2. Se descargan ~1300 ejercicios en cada arranque, sin caché propio. `expo-image` cachea los GIFs, pero no este JSON.
3. Consumidores:
   - `AuthContext`: login, signup, home, mi_rutina, estadísticas, escanear_qr, ambas cuentas.
   - `ExercisesContext`: `editar_rutina_trainer`, `escanear_qr_user`, `mi_rutina_user`, `entrenar_dia_user`.

## 5. Cómo funciona `attempt`

`attempt` es un contador que **no se muestra en ningún lado**. Existe solo para cambiar de valor y **obligar a que el `useEffect` se ejecute de nuevo**.

### Regla de las dependencias
```tsx
useEffect(() => { ... }, [attempt]);
```
Después de cada render, React compara las dependencias con las del render anterior. Si ninguna cambió, no hace nada. Si alguna cambió, ejecuta el cleanup del efecto anterior y vuelve a ejecutar el efecto. Con `[]` corre solo al montar; con `[attempt]` corre al montar y cada vez que `attempt` cambie.

### Línea de tiempo con una falla de red
1. **Montaje.** `attempt = 0`, `loading = true`. El effect lanza el `fetch` #1, con su propia variable `cancelled = false`.
2. **Falla.** `setError(...)` y `setLoading(false)`. La pantalla muestra el error y "Reintentar".
3. **El usuario toca "Reintentar".** `retry()` hace `setLoading(true)`, `setError(null)` y `setAttempt(n => n + 1)`. React junta los tres cambios en un solo render (*batching*).
4. **Render con `attempt = 1`.** React compara `[0]` con `[1]`: cambió. Primero corre el cleanup del effect anterior (`cancelled = true` en la ejecución #1). Después corre el effect de nuevo, con su propia `cancelled = false`, y lanza el `fetch` #2.
5. El `fetch` #2 termina; como su `cancelled` es `false`, guarda los datos y apaga `loading`.

### Por qué cada ejecución tiene su propia `cancelled`
Cada vez que el effect corre se crea un `let cancelled` nuevo (variable local del cuerpo del effect). Los `.then` y `.catch` recuerdan la `cancelled` de la ejecución en la que nacieron (*closure*). Por eso el cleanup de la ejecución #1 cancela solo a #1.

### Por qué no llamar a `fetchExercises()` directo en `retry()`
Habría que duplicar la lógica de `then/catch/finally` y reimplementar la cancelación. Con `attempt`, toda la lógica de carga vive en un solo lugar y `retry` solo avisa que hay que volver a ejecutarla (enfoque declarativo).

### Por qué `retry` hace `setLoading(true)` y `setError(null)`
El effect no los pone al empezar, solo al terminar. Sin ellos seguiría visible el mensaje de error y no aparecería el indicador de carga durante el nuevo intento.

## 6. Cómo guarda `useMemo` los datos

`useMemo` no guarda nada en una variable tuya ni en memoria global. **Lo guarda React dentro de la estructura interna del componente** (*fiber*), mientras esté montado.

Por cada llamada a `useMemo` se conserva `[valor calculado, dependencias anteriores]`. En este caso: el `Map` ya construido y `[exercises]`.

En cada render:
1. React compara las dependencias nuevas con las guardadas, una por una con `Object.is` (referencia, no contenido).
2. Si todas son iguales, devuelve el valor guardado y no ejecuta la función.
3. Si alguna cambió, ejecuta la función, guarda el resultado y las dependencias nuevas, y lo devuelve.

```js
function useMemo(fn, deps) {
  const slot = hookActual();
  if (slot.existe && depsIguales(slot.deps, deps)) return slot.valor;
  const valor = fn();
  slot.valor = valor;
  slot.deps = deps;
  return valor;
}
```

**Cómo sabe React cuál es su casillero:** los hooks de un componente se guardan como lista ordenada, identificados por el orden de llamada (useState, useState, useState, useState, useEffect, useMemo...). Por eso los hooks no pueden ir dentro de `if` ni bucles: si el orden cambiara, cada llamada se asociaría al casillero equivocado.

| Momento | `exercises` | Qué hace useMemo |
|---|---|---|
| Primer render | `[]` | No hay nada guardado: ejecuta y guarda un Map vacío |
| Re-render por `setLoading(true)` | el mismo `[]` | Misma referencia: devuelve el Map guardado |
| Llegan los datos (`setExercises(data)`) | array nuevo de ~1300 | Referencia distinta: reconstruye el Map |
| Re-renders siguientes | mismo array | Devuelve el Map guardado |

Detalles:
1. **Compara referencias.** `setExercises([...exercises])` con los mismos datos igual reconstruye el Map; y `exercises.push(...)` no cambia la referencia, así que `useMemo` no se enteraría. En React el estado se reemplaza, no se muta.
2. **El cache vive con el componente.** Pertenece a la instancia de `ExercisesProvider`, que está en la raíz y no se desmonta, así que el Map dura toda la sesión. No se comparte entre componentes.
3. **Es una optimización, no una garantía.** React puede descartar valores cacheados. Este caso lo cumple: el Map siempre se puede derivar de `exercises`.
4. Guarda solo un valor por casillero, sin historial.
5. Con **React Compiler** (activado en `app.json`) se inserta automáticamente un mecanismo parecido (valor guardado + comparación de entradas por referencia); por eso hay pocos `useMemo` en el código. Dejar este explícito no daña y documenta la intención.

## 7. Preguntas de verificación, con respuestas

### 1. ¿Por qué `fetch` necesita `response.ok` si ya hay un `.catch`?
`fetch` solo rechaza su promesa cuando **no hay respuesta** (sin internet, DNS, timeout). Si el servidor responde 404 o 500, la promesa se **resuelve** normalmente.

Sin el chequeo, con un 404: `response.json()` falla con un error confuso o parsea algo con otra forma, y luego `data.exercises.map(...)` explota con "Cannot read property 'map' of undefined". Con `if (!response.ok) throw new Error(...)` el error HTTP se convierte en una excepción clara que sí llega al `.catch`.

### 2. ¿Qué pasaría sin `cancelled` si el usuario toca "Reintentar" dos veces rápido?
Cada toque lanza un `fetch` nuevo y no hay garantía de que terminen en orden. Compiten por escribir el mismo estado:
- **Estado inconsistente:** un pedido viejo falla y hace `setError`, otro más nuevo tuvo éxito y hizo `setExercises`: datos y error a la vez.
- **`loading` se apaga antes de tiempo:** el primero que termina ejecuta `finally`.
- **Gana el último en llegar, no el último en pedirse.**

Aquí los datos son siempre iguales, así que lo que se notaría es el desorden entre `error` y `loading`. `cancelled` hace que el pedido viejo termine pero su resultado se descarte; solo el vigente escribe estado. También cubre el caso de desmontaje. Limitación: ignora el resultado, pero el pedido de red sigue consumiendo datos; `AbortController` lo cancelaría de verdad.

### 3. ¿Por qué un `Map` y no `exercises.find(...)`?
`.find()` recorre el array hasta encontrar: hasta ~1300 comparaciones por búsqueda (O(n)). El `Map` indexa por `id` y busca con un solo acceso (O(1)).

Una lista de rutina puede mostrar decenas de ejercicios, cada uno buscando en cada render: decenas × 1300 comparaciones cada vez que algo cambia. `useMemo` construye el Map una sola vez y lo reutiliza.

### 4. ¿Qué problema trae que `setUser(found)` use el mismo objeto del array?
`found` no es copia, es el mismo objeto en memoria que `users[i]`:
```
users[2]  ──┐
            ├──►  { id: 3, name: 'Lucía', id_rutina: 3, ... }
user (state)┘
```
1. **Mutación invisible para React:** React detecta cambios por referencia. Si algo hace `user.id_rutina = 9`, el objeto cambió por dentro pero la referencia es la misma: no re-renderiza y las pantallas muestran datos viejos.
2. **Cambios "mágicos":** cualquier modificación al array afecta la sesión sin pasar por `setUser`.
3. **Hoy no rompe nada**, porque `setUserRoutine` la llama el trainer sobre otro usuario. Depende de esa casualidad.

Con BD real se invierte: el `user` llega por red como copia y puede quedar desactualizado (por ejemplo, si el trainer le cambia la rutina). Habrá que decidir cuándo refrescarlo. La práctica correcta es tratar el estado como inmutable: crear un objeto nuevo y llamar a `setUser` con él.

## 8. Lista para el bloque 9 (continúa la del documento 01)
8. `login` y `register` pasan a ser async y con token. Almacenamiento seguro del token y forma de restaurar la sesión al abrir la app.
9. `user` pasa de objeto compartido a copia: decidir cuándo se refresca (por ejemplo, cuando el trainer asigna una rutina).
10. El `password` desaparece del tipo `User` que ve el cliente.
11. Cachear el catálogo de ejercicios o guardarlo en la propia BD (si se cambia de API de ejercicios, los `exerciseId` guardados en las rutinas se invalidan).
12. Considerar `AbortController` en las llamadas de red, además de la bandera `cancelled`.
