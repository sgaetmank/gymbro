# Bloque 4: navegación

Archivos: `app/index.tsx`, `src/navigation/types.ts`, `src/navigation/UserTabs.tsx`, `src/navigation/TrainerTabs.tsx`, y las llamadas a `navigation` en cada pantalla. Contexto histórico en `docs/superpowers/plans/2026-10-01-bottom-tabs-navegacion.md`.

## 1. Stack vs Tabs

| | **Stack** (`native-stack`) | **Tabs** (`bottom-tabs`) |
|---|---|---|
| Modelo mental | Pila de cartas: adelante y atrás | Pestañas paralelas, mismo nivel |
| Al ir a otra pantalla | La **apila** (`push`/`navigate`) | **Cambia el foco**; no apila |
| Al volver | **Desapila** (`goBack`) y la pantalla se destruye | No se destruye nada: la pestaña queda viva en segundo plano |
| Estado de lo que dejaste | Se pierde al salir | **Se conserva** al volver |
| Ejemplo típico | Lista → detalle | Inicio / Buscar / Perfil |

Antes, el nav inferior eran `View`s con botones hechos a mano que llamaban `navigate(...)` dentro de **un solo stack plano**. Cada cambio de sección **apilaba** pantallas y el botón atrás de Android recorría esa pila. Con Tabs reales, cambiar de sección no apila nada.

## 2. Estructura de tres niveles

```
Stack raíz (app/index.tsx)
│
├─ sin sesión:  login, signup
│
├─ trainer:     TrainerTabs ──► Tab.Navigator
│                                ├─ buscar_usuario_trainer ──► Stack anidado (SearchStack)
│                                │                              ├─ buscar_usuario_trainer_root
│                                │                              ├─ ver_datos_trainer
│                                │                              └─ editar_rutina_trainer
│                                └─ mi_cuenta_trainer
│
└─ usuario:     UserTabs ──► Tab.Navigator
                 │           ├─ home_user
                 │           ├─ mi_rutina_user ──► Stack anidado (RoutineStack)
                 │           │                      ├─ mi_rutina_user_root
                 │           │                      └─ ver_dia_x_user
                 │           ├─ reloj
                 │           ├─ estadisticas_user
                 │           └─ mi_cuenta_user
                 └─ escanear_qr_user   (hermano de UserTabs, en el stack raíz)
```

- **Un Tab por rol.** El stack raíz solo registra el grupo del rol logueado, así que un usuario no puede ver las pestañas del trainer.
- **Stack anidado solo donde hay drill-down** (entrar a un detalle y volver): "Rutinas" (lista → día) y "Buscar Usuario" (búsqueda → datos / editar). Las demás pestañas son pantallas planas.
- **`escanear_qr_user` vive en el stack raíz**, no dentro de las tabs. Por eso, al abrirse, tapa la barra de pestañas.

## 3. El nombre `_root`

La pantalla inicial del stack anidado se llama `mi_rutina_user_root`, no `mi_rutina_user`, porque el **tab** ya se llama `mi_rutina_user`. Con el mismo nombre habría dos rutas iguales, una dentro de otra; React Navigation lo advierte porque `navigate('mi_rutina_user')` sería ambiguo. Desde afuera, `navigate('mi_rutina_user')` apunta a la pestaña; `_root` es un detalle interno.

## 4. Tipado: `types.ts`

Cada navigator tiene un tipo `ParamList`: `nombreDePantalla → parámetros que recibe`.

```ts
export type UserRoutineStackParamList = {
  mi_rutina_user_root: undefined;          // no recibe nada
  ver_dia_x_user: { day: RoutineDay };     // exige "day"
};
```
- `undefined` = sin parámetros.
- `NavigatorScreenParams<X>` = "esta pantalla es un navigator anidado y se le pueden pasar params para una pantalla hija" (`UserTabs: NavigatorScreenParams<UserTabParamList>`).
- TypeScript falla al compilar si olvidás un parámetro o escribís mal un nombre.
- Las pantallas se tipan con `NativeStackScreenProps<ParamList, 'nombre'>` (da `navigation` y `route` tipados). Una pantalla de pestaña que además navega al stack raíz usa `CompositeScreenProps` (`home_user.tsx`), que combina el tipo del tab y el del stack padre.

## 5. Configuración del Tab.Navigator

`UserTabs` y `TrainerTabs` son casi idénticos:
- **`headerShown: false`:** cada pantalla dibuja su propio encabezado.
- **`backBehavior="none"`:** el botón atrás de Android, parado en la raíz de una pestaña, **cierra la app** en vez de volver a la pestaña anterior.
- **`useSafeAreaInsets()`:** cuánto espacio ocupa la barra del sistema; se suma a la altura de la barra de pestañas (`72 + insets.bottom`).
- **Íconos:** glifos Unicode en un `<Text>`, sin librería de íconos. `makeTabIcon` devuelve un componente por clave; el `color` lo inyecta el navigator (activo `#FFC107`, inactivo `#666666`).
- **`name` vs `title`:** `name` es el identificador interno (el de los `navigate`); `title` es el texto visible.

## 6. Llamadas de navegación del código

| Llamada | Dónde | Qué hace |
|---|---|---|
| `navigation.navigate('signup')` | `login` | Va al registro (apila en el stack raíz) |
| `navigation.navigate('ver_dia_x_user', { day })` | `mi_rutina_user` | Entra al detalle dentro del stack anidado, con el objeto `day` |
| `navigation.goBack()` | detalles | Desapila una pantalla |
| `navigation.navigate('estadisticas_user')` | `home_user` | Cambia a una **pestaña hermana** |
| `navigation.getParent()?.navigate('escanear_qr_user')` | `home_user` | Sube al navigator padre (stack raíz) y navega a una pantalla que no es de las tabs |
| `navigation.replace('UserTabs', {...})` | `escanear_qr_user` | Ver abajo |

**Navegación anidada con parámetros** (después de registrar un entrenamiento):
```ts
navigation.replace('UserTabs', {
  screen: 'mi_rutina_user',           // elige la pestaña
  params: {
    screen: 'ver_dia_x_user',         // y la pantalla del stack
    params: { day: selectedDay },     // y sus parámetros
  },
});
```
Es una "dirección completa": raíz → pestaña → pantalla del stack → parámetros.

**Recibir parámetros:** `route.params.day` (`ver_dia_x_user`), `route.params.user` (`ver_datos_trainer`).

## 7. `useFocusEffect`

Las pestañas **siguen montadas** al cambiar de una a otra, así que un `useEffect` de `home_user` corre solo al montar. Si el alumno escanea el QR y vuelve a Inicio, el contador de días entrenados quedaría viejo.

`useFocusEffect` (`home_user.tsx`) ejecuta su callback **cada vez que la pantalla gana el foco** y recalcula `getWorkoutDaysThisYear`. Se envuelve en `useCallback` porque React Navigation necesita una función con identidad estable; si la función cambiara en cada render, el efecto se volvería a ejecutar sin parar.

## 8. Interceptación en `editar_rutina_trainer`

**a) `beforeRemove`.** Se dispara cuando la pantalla está a punto de ser **desapilada** (botón atrás, gesto, `goBack`). Con cambios sin guardar:
1. `e.preventDefault()` congela la salida.
2. Un `Alert` pide confirmación.
3. Si confirma, `skipExitPrompt.current = true` (un `useRef`, para no volver a preguntar) y `navigation.dispatch(e.data.action)` **retoma la acción original** que se había frenado.

**b) `tabPress` en el navigator padre** (`navigation.getParent()`). Cambiar de pestaña no desmonta la pantalla, solo le saca el foco, así que `beforeRemove` no se dispara. El código intenta cubrir ese caso escuchando `tabPress` y aplicando la misma lógica.

> **Corrección (verificada en el código fuente de React Navigation, ver documento 13):** `navigation.getParent()` devuelve la navegación de la pestaña "Buscar Usuario", la que contiene al editor, y los eventos `tabPress` se emiten con `target` igual a la pestaña tocada. Por lo tanto, ese listener solo se dispara al tocar **"Buscar Usuario"**, no al tocar "Mi Cuenta". El comentario del código (que dice que cubre "Mi Cuenta") es incorrecto.

**c) `listeners` del tab "Buscar Usuario"** (`TrainerTabs.tsx`). Al tocar esa pestaña: `e.preventDefault()` y `navigate(..., { screen: 'buscar_usuario_trainer_root' })`. Tocar esa pestaña **siempre devuelve a la búsqueda**, incluso desde "editar rutina": la pestaña reinicia su stack.

## 9. Puntos a verificar (no probados en ejecución)
1. **`replace('UserTabs', ...)` en el QR.** `replace` sustituye la ruta actual por una nueva; como `UserTabs` ya existe debajo del QR, podría quedar una segunda instancia de `UserTabs` en la pila. Probar el botón atrás tras escanear. Alternativa: `navigate('UserTabs', {...})`.
2. **`tabPress` de `editar_rutina_trainer`** (corregido tras revisar el código fuente de React Navigation): solo se dispara al tocar la pestaña "Buscar Usuario" (la suya), **no** al tocar "Mi Cuenta". Consecuencias probables: (a) pasar a "Mi Cuenta" con cambios sin guardar **no avisa**; (b) tocar "Buscar Usuario" sí dispara el aviso, pero al confirmar el código navega a `mi_cuenta_trainer`, y como el listener del tab también actúa, podrían aparecer dos confirmaciones. Detalle en el documento 13. Falta probarlo en el emulador.
3. **Params con objetos completos** (`{ user }`, `{ day }`) en lugar de ids. Hoy es una referencia al mismo objeto en memoria; con BD será una copia que se desactualiza. Lo recomendado es pasar el id y cargar los datos en la pantalla destino. Los params también deben ser serializables para deep linking y restauración de estado.

## 10. Lista para el bloque 9 (continúa la del documento 02)
13. Cambiar los params `{ user }` y `{ day }` por ids (`userId`, `dayId`); la pantalla destino carga los datos (con estados de carga/error).
14. Revisar `replace` del QR y el `tabPress` del editor (puntos 1 y 2 de la sección 9).
15. Con sesión persistente (token), el stack raíz necesitará un estado "cargando sesión" antes de decidir entre login y tabs.

## 11. Preguntas de verificación, con respuestas

### 1. ¿Por qué el botón atrás de Android cierra la app parado en una pestaña, y qué prop lo controla?
El botón atrás se resuelve de adentro hacia afuera, y cada navigator intenta manejarlo:
1. El stack anidado (si lo hay) está en su pantalla raíz: no hay nada que desapilar, así que no lo maneja.
2. El Tab.Navigator decide según **`backBehavior`**. Con `"none"`, atrás nunca cambia de pestaña, aunque se hayan visitado otras.
3. El stack raíz tiene como pantalla activa `UserTabs` (o `TrainerTabs`), que es la única de su grupo: tampoco hay nada que desapilar.
4. Ningún navigator maneja el evento, y Android aplica su comportamiento por defecto: **cerrar la app**.

La prop es `backBehavior`. Sus valores: `firstRoute` (el default: atrás lleva a la primera pestaña), `initialRoute`, `order`, `history`, `fullHistory` y `none`. Sin esa prop, parado en "Reloj", atrás te llevaría a "Inicio" antes de poder salir.

### 2. ¿Por qué `beforeRemove` no alcanza para avisar de cambios sin guardar al tocar otra pestaña?
`beforeRemove` se dispara cuando una ruta **se elimina del estado** del navigator (pop, `goBack`, `reset`). Cambiar de pestaña no elimina nada del stack anidado: solo mueve el foco del Tab.Navigator, y la pantalla de edición sigue montada en segundo plano. Para el stack, nunca hubo una remoción.

Por eso el código intenta escuchar `tabPress`, que sí se emite al tocar la barra de pestañas. Dos limitaciones: `tabPress` solo se emite por toques en la barra (un `navigate('mi_cuenta_trainer')` hecho por código no lo dispararía), y **cada evento `tabPress` llega solo a los listeners de la pestaña tocada** (`target`). El listener del editor está registrado en la pestaña "Buscar Usuario", así que no se entera de los toques en "Mi Cuenta" (corrección verificada en el documento 13).

### 3. ¿Por qué `home_user` usa `useFocusEffect` y no `useEffect`?
`useEffect` corre al montar y cuando cambian sus dependencias. Las pestañas no se desmontan al cambiar de una a otra, así que al volver a Inicio no corre de nuevo: el contador quedaría desactualizado tras registrar un entrenamiento.

`useFocusEffect` corre **cada vez que la pantalla gana el foco**. Se envuelve en `useCallback` (con `[userId]`) porque el hook vuelve a suscribirse si la identidad de la función cambia; sin `useCallback` se ejecutaría en cada render.

### 4. ¿Qué diferencia hay entre `navigate('estadisticas_user')` y `getParent()?.navigate('escanear_qr_user')`?
La `navigation` que recibe `home_user` pertenece al **Tab.Navigator**.
- `estadisticas_user` es una pestaña **hermana** en ese mismo navigator: la maneja directamente, cambia el foco y no apila nada.
- `escanear_qr_user` está registrada en el **stack raíz**, un nivel más arriba. `getParent()` devuelve ese navigator y deja explícito dónde se resuelve. Se **apila encima de las tabs** y por eso tapa la barra de pestañas; al volver (`goBack`), las tabs siguen con su estado.

Matiz: React Navigation también hace "subir" automáticamente las acciones `navigate` que el navigator actual no reconoce, así que probablemente funcionaría sin `getParent()`; usarlo lo hace explícito.

### 5. ¿Por qué se llama `mi_rutina_user_root` y no `mi_rutina_user`?
Porque `mi_rutina_user` ya es el nombre de la **pestaña** que contiene al stack. Con el mismo nombre habría dos rutas iguales, una anidada en la otra: React Navigation lo advierte y `navigate('mi_rutina_user')` sería ambiguo. El sufijo `_root` identifica la pantalla inicial del stack interno y deja que `navigate('mi_rutina_user')` apunte sin dudas a la pestaña.
