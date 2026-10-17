# Bloque 8b-3: `editar_rutina_trainer`, guardado y avisos de salida

Archivos: `src/screens/editar_rutina_trainer.tsx` (líneas 427 a 513: guardado, aviso de salida y registro del guard; y el guard exportado, líneas 1164 a 1171) y `src/navigation/TrainerTabs.tsx` (los `listeners` de las pestañas).

## 0. Tres caminos para salir del editor

Con cambios sin guardar, se puede abandonar la edición de tres maneras, y cada una se intercepta distinto:

| Camino | Quién lo detecta |
|---|---|
| Botón atrás del celu, `‹` de arriba o gesto atrás | `beforeRemove` en el editor (sección 2) |
| Tocar la pestaña **"Buscar Usuario"** | `listeners` de `TrainerTabs`, que consultan el guard del editor (sección 3) |
| Tocar la pestaña **"Mi Cuenta"** | `listeners` de `TrainerTabs`, que consultan el guard del editor (sección 3) |

Tocar una pestaña no elimina nada del stack del editor, solo mueve el foco: `beforeRemove` no se entera. Por eso hay un segundo mecanismo. Probado en el celu: en los tres caminos sale el aviso y la pantalla no cambia hasta que el entrenador confirma.

## 1. Guardar

```tsx
const persistRoutine = () => {
  if (routineId.current === null) {
    const created = createRoutine(days);            // INSERT: crea la rutina
    setUserRoutine(editedUser.id, created.id);      // UPDATE: se la asigna al alumno
    routineId.current = created.id;                 // recuerda que ya existe
  } else {
    updateRoutineDays(routineId.current, days);     // UPDATE: reemplaza los días
  }
};

const saveChanges = () => {
  persistRoutine();
  setSavedSnapshot(JSON.stringify(days));           // "esto es lo último guardado"
};
```

### Dos caminos
- **Alumno con rutina:** `updateRoutineDays` reemplaza los días (con la copia profunda del documento 01).
- **Alumno sin rutina** (recién registrado): `createRoutine` crea la rutina con el nombre fijo `'Mi Rutina'` y `setUserRoutine` se la asigna. Es el flujo que arranca en `signup`: el alumno nace con `id_rutina: null` y recibe su primera rutina acá.

### `routineId` como `useRef`
`useRef(routine?.id ?? null)` recuerda el id de la rutina para no crear dos veces la de un alumno nuevo: tras el primer guardado `routineId.current` deja de ser `null` y los siguientes hacen `update`.
- Es un ref y no un estado porque no se dibuja y `persistRoutine` lo lee y modifica en el mismo instante (también se la llama desde callbacks de `Alert`).
- `setUserRoutine` muta el usuario dentro del array `users`; como `editedUser` (el param de navegación) es ese mismo objeto, también se actualiza (el aliasing del documento 02, acá a favor). El ref hace que el guardado no dependa de esa casualidad.

### Cosas a notar
1. **Guardar no valida nada** (ni días vacíos ni bloques vacíos) y no maneja errores: todo es síncrono.
2. **No se puede crear una rutina vacía:** si el alumno no tiene rutina y no se agrega nada, el borrador es `[]`, igual al snapshot `'[]'`, y el botón Guardar queda deshabilitado.
3. **El nombre de la rutina es siempre `'Mi Rutina'`** y no se puede cambiar.
4. Después de guardar, el entrenador sigue en la pantalla ("Guardado ✓").
5. **Crear y asignar son dos pasos separados** (`createRoutine` y `setUserRoutine`): si fallara el segundo, quedaría una rutina huérfana. Hoy no puede fallar; con BD sí.

## 2. El aviso de salida: `beforeRemove`

```tsx
const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
  if (!hasUnsavedChanges || skipExitPrompt.current) return;   // nada que avisar
  e.preventDefault();                                          // congela la salida
  confirmExitWithUnsavedChanges(() => {
    skipExitPrompt.current = true;
    navigation.dispatch(e.data.action);                        // retoma la salida original
  });
});
```
1. **Cuándo se dispara:** cuando la pantalla está por ser **eliminada del stack** (botón atrás de Android, gesto, `‹` con `goBack`, o un `navigate` que desapile).
2. **`e.preventDefault()`:** frena esa salida; el entrenador sigue en la pantalla.
3. **`e.data.action`:** la acción de navegación original (pop, go back...). Se conserva en el closure para **repetirla** si el entrenador decide salir.
4. **`skipExitPrompt`:** al repetir la acción con `navigation.dispatch(...)`, `beforeRemove` se dispararía otra vez y volvería a preguntar en bucle. Poner `skipExitPrompt.current = true` justo antes hace que la segunda vez salga directo. Es un **ref** porque se escribe y se lee en el mismo instante.

### El diálogo de tres opciones
| Botón | Estilo | Acción |
|---|---|---|
| Seguir editando | `cancel` | no hace nada; la salida sigue frenada |
| Salir sin guardar | `destructive` | `leave()`: descarta el borrador |
| Guardar y salir | normal | `persistRoutine()` y luego `leave()` |

`{ cancelable: true }`: en Android, tocar afuera equivale a "Seguir editando".

## 3. El guard para el cambio de pestaña

### Por qué la decisión se toma en `TrainerTabs`
Se revisó el código fuente de React Navigation (`node_modules/@react-navigation`):
- El tab bar emite `tabPress` con `target: route.key` de la pestaña tocada (`bottom-tabs/src/views/BottomTabBar.tsx`).
- Cada pantalla tiene su propio registro de listeners, indexado por su `route.key` (`core/src/useEventEmitter.tsx` y `core/src/useNavigationCache.tsx`). Un evento con `target` solo llega a los listeners de esa ruta.
- Desde el editor, `navigation.getParent()` devuelve la navegación de la ruta de la pestaña **"Buscar Usuario"**, la que contiene al stack. Un `addListener('tabPress')` registrado ahí solo recibiría los toques de esa pestaña, nunca los de "Mi Cuenta".

Además, el listener de "Buscar Usuario" en `TrainerTabs` navega a la raíz de su stack con `navigate(..., { screen: 'buscar_usuario_trainer_root' })`. Esa navegación no se detiene con `beforeRemove` (se observó en el celu: el aviso aparecía, pero la pantalla ya había cambiado de fondo).

Conclusión: el único lugar que ve los toques de **todas** las pestañas y decide si navegar es `TrainerTabs`. Pero `TrainerTabs` no puede leer el estado de otra pantalla, y `hasUnsavedChanges` vive en el editor. De ahí el guard.

### El guard

```tsx
// Registro: dentro del useEffect principal del editor
unsavedChangesGuard = (leave) => {
  if (!hasUnsavedChanges || skipExitPrompt.current) return false;   // nada que avisar
  confirmExitWithUnsavedChanges(() => {
    skipExitPrompt.current = true;
    leave();                                                          // retoma la navegación
  });
  return true;                                                        // "tomé el control"
};
return () => {
  unsubscribeBeforeRemove();
  unsavedChangesGuard = null;                                         // el editor se fue
};

// Al final del archivo
let unsavedChangesGuard: ((leave: () => void) => boolean) | null = null;

export function guardUnsavedChanges(leave: () => void): boolean {
  return unsavedChangesGuard ? unsavedChangesGuard(leave) : false;
}
```
- **Contrato:** `guardUnsavedChanges(leave)` devuelve `true` si mostró el aviso. Quien la llama debe **frenar** su navegación; `leave` se ejecuta solo si el entrenador elige salir. Devuelve `false` si no hay nada que avisar: la navegación sigue normal.
- **Variable de módulo:** `unsavedChangesGuard` vive fuera de React. El editor la llena en su efecto y la limpia al desmontarse; `TrainerTabs` la consulta desde un listener. Si el editor no está montado vale `null` y `guardUnsavedChanges` devuelve `false`.
- **Mismo aviso:** reutiliza `confirmExitWithUnsavedChanges`, el diálogo de tres opciones de la sección 2 (con "Guardar y salir", `persistRoutine()` y luego `leave()`).

### Los listeners en `TrainerTabs`

```tsx
// Pestaña "Buscar Usuario"
tabPress: (e) => {
  e.preventDefault();
  const goToRoot = () =>
    navigation.navigate('buscar_usuario_trainer', { screen: 'buscar_usuario_trainer_root' });
  if (!guardUnsavedChanges(goToRoot)) {
    goToRoot();
  }
},

// Pestaña "Mi Cuenta"
tabPress: (e) => {
  if (navigation.isFocused()) return;                    // ya está en Mi Cuenta
  if (guardUnsavedChanges(() => navigation.navigate('mi_cuenta_trainer'))) {
    e.preventDefault();                                  // frena el cambio hasta confirmar
  }
},
```
- **Buscar Usuario:** siempre hace `e.preventDefault()` (la pestaña siempre vuelve a la raíz del stack, ver documento 03), así que lo que se decide es **cuándo** se ejecuta `goToRoot`: de inmediato, o recién después de confirmar.
- **Mi Cuenta:** el cambio de pestaña es el comportamiento por defecto; para frenarlo hay que llamar a `e.preventDefault()`, y solo se hace si el guard tomó el control. Si el entrenador confirma, `leave` navega a Mi Cuenta.

### `skipExitPrompt` y el efecto de `focus`
Al confirmar la salida, el guard pone `skipExitPrompt.current = true` (igual que `beforeRemove`). Si el destino fue "Mi Cuenta", el editor **no se desmonta**: queda sin foco, con su borrador. Sin otra cosa, el flag quedaría en `true` y el aviso apagado para siempre. Lo evita un efecto aparte:

```tsx
useEffect(
  () => navigation.addListener('focus', () => { skipExitPrompt.current = false; }),
  [navigation]
);
```
Cada vez que el editor recupera el foco, el aviso se reactiva. Y mientras el flag está en `true` (el entrenador ya eligió descartar), tocar "Buscar Usuario" desde "Mi Cuenta" no vuelve a preguntar: el guard devuelve `false` y la pestaña vuelve a la raíz de su stack, lo que desmonta el editor y descarta el borrador.

### Qué pasa en cada caso (con cambios sin guardar)

| Acción del entrenador | Qué pasa |
|---|---|
| Botón atrás, `‹` o gesto atrás | Aviso (`beforeRemove`); sigue en el editor hasta confirmar |
| Toca **"Buscar Usuario"** | Aviso (guard); la pantalla no cambia hasta confirmar; al confirmar vuelve a la raíz del stack |
| Toca **"Mi Cuenta"** | Aviso (guard); el cambio de pestaña queda frenado; al confirmar navega a Mi Cuenta |
| "Seguir editando" | Se queda en el editor |
| "Guardar y salir" | `persistRoutine()` y luego `leave()` |
| "Salir sin guardar" por "Mi Cuenta" y vuelve al editor | El `focus` reactiva el aviso |
| Sin cambios pendientes | Todos los caminos navegan sin avisar |
| Cierra sesión (desde Mi Cuenta) | Para llegar a Mi Cuenta ya se confirmó la salida; el borrador se pierde al desmontarse `TrainerTabs`, sin aviso adicional |

## 4. Las dependencias del `useEffect`

```tsx
}, [navigation, hasUnsavedChanges, persistRoutine]);
```
- El listener de `beforeRemove` y el guard "recuerdan" (*closure*) los valores del render en que se crearon. Por eso el effect se re-ejecuta cuando cambia `hasUnsavedChanges`, para que vean siempre el valor actual. El cleanup quita el listener viejo y deja el guard en `null`; el nuevo registro lo vuelve a asignar.
- `persistRoutine` es una función definida en el cuerpo del componente, o sea **nueva en cada render**. Incluirla en las dependencias hace que el effect se re-ejecute en cada render, y garantiza que "Guardar y salir" use el `days` más reciente. Con el React Compiler (activo) la función probablemente se memoiza con `days` y `editedUser`, y el efecto se re-ejecuta solo cuando cambian.
- Un listener o un guard desactualizado sería peligroso: "Guardar y salir" guardaría un borrador viejo, o el aviso no aparecería cuando corresponde.
- El efecto de `focus` (sección 3) es aparte y depende solo de `navigation`: solo toca `skipExitPrompt`, que es un ref y no necesita estar en las dependencias.

## 5. Lista para el bloque 9 (continúa la del documento 12)
63. Guardado asíncrono: `persistRoutine` pasa a ser una llamada de red con carga y error. "Guardar y salir" debe esperar la confirmación del servidor antes de dejar salir y mostrar el error si falla.
64. Crear y asignar la rutina deben ser una sola operación atómica (transacción o un único endpoint), y evitar que un doble toque cree dos rutinas (idempotencia).
65. Aviso de cambios sin guardar: el guard es una variable de módulo, así que sirve mientras haya una sola pantalla de edición montada. Si algún día pudiera haber dos instancias a la vez, habría que compartirlo mediante un contexto.
66. Nombre de la rutina: hoy es fijo (`'Mi Rutina'`); decidir si es editable o si se elimina de la BD.
67. Concurrencia: si el entrenador B edita la misma rutina mientras A tiene el borrador abierto, el último en guardar pisa al otro. Usar un campo de versión y detectar el conflicto.

## 6. Preguntas de verificación, con respuestas

### 1. ¿Por qué `routineId` es un `useRef` y qué evita?
Evita **crear dos rutinas para el mismo alumno**. Un alumno nuevo no tiene rutina: el primer guardado la crea (`createRoutine`) y se la asigna. Si el entrenador guarda de nuevo, tiene que **actualizar** la existente. `routineId.current` recuerda el id creado: es `null` antes del primer guardado y tiene valor después.

Por qué un ref y no un estado:
- No se dibuja en pantalla, así que no necesita provocar un render.
- Se modifica y se lee de inmediato (`routineId.current = created.id` y la siguiente llamada ya lo ve). Un estado se actualiza en el siguiente render y una función llamada desde un `Alert` podría seguir viendo el valor viejo.

Tampoco se apoya en `routine` (derivada de `editedUser.id_rutina`): eso solo se actualiza porque `editedUser` es el mismo objeto que `users` y `setUserRoutine` lo muta. Con una BD, `editedUser` sería una copia y esa cuenta fallaría; el ref seguiría funcionando.

### 2. ¿Qué hace `e.preventDefault()` en `beforeRemove`, cómo se retoma la salida y por qué `skipExitPrompt` es un ref?
- `e.preventDefault()` **cancela la eliminación de la pantalla**: el entrenador se queda en el editor mientras decide.
- La salida se retoma con `navigation.dispatch(e.data.action)`: `e.data.action` es la acción original (volver, desapilar, etc.), guardada en el closure del callback del botón del `Alert`; se vuelve a enviar como estaba.
- Al reenviarla, `beforeRemove` se dispara de nuevo y volvería a preguntar, en bucle. Por eso, justo antes, se pone `skipExitPrompt.current = true`, y la segunda vez el listener sale con `return`.
- Es un ref porque se escribe y se lee **en el mismo instante** (asignar y despachar seguidos). Un `setState` no estaría aplicado cuando `beforeRemove` vuelva a consultar, y el aviso reaparecería.

### 3. ¿Por qué el `useEffect` tiene `persistRoutine` y `hasUnsavedChanges` en sus dependencias?
Los listeners y el guard que se registran dentro del effect "congelan" los valores de ese render (*closure*). Si el effect no se re-ejecutara cuando cambian:
- `hasUnsavedChanges` quedaría con el valor viejo: el listener creyera que no hay cambios y deje salir sin avisar (o avise cuando ya se guardó).
- `persistRoutine` guardaría el `days` de un render anterior: "Guardar y salir" persistiría un borrador desactualizado.

Con las dependencias, el effect limpia los listeners viejos y registra nuevos con los valores actuales. Como `persistRoutine` se recrea en cada render, el efecto se re-ejecuta en cada render (con el React Compiler activo, probablemente solo cuando cambia `days`).

### 4. ¿Por qué el aviso al cambiar de pestaña no puede resolverse con un listener dentro del editor, y cómo se resuelve?
`beforeRemove` solo se dispara cuando una ruta se **elimina** del stack; cambiar de pestaña solo mueve el foco, así que no se entera. La alternativa natural, escuchar `tabPress` desde el editor con `navigation.getParent()`, tampoco sirve: los eventos `tabPress` se emiten con `target: route.key` de la pestaña tocada y cada pantalla tiene su propio registro de listeners, así que un evento solo llega a los listeners de esa ruta. `getParent()` devuelve la navegación de la ruta "Buscar Usuario" (la que contiene al editor): ese listener vería los toques de "Buscar Usuario" y **nunca** los de "Mi Cuenta". Además, "Buscar Usuario" ya tiene un listener en `TrainerTabs` que navega a la raíz de su stack, y esa navegación no pasa por `beforeRemove`.

Se resuelve decidiendo en el único lugar que ve los toques de todas las pestañas: `TrainerTabs`. Como allí no se conoce `hasUnsavedChanges`, el editor expone un **guard** (`guardUnsavedChanges(leave)`). Cada listener lo consulta: si devuelve `true` (mostró el aviso), frena su navegación y la retoma con `leave` solo si el entrenador confirma.

### 5. ¿Qué pasa si el entrenador, con cambios sin guardar, toca "Mi Cuenta" o "Buscar Usuario"?
- **"Mi Cuenta":** el listener de esa pestaña llama al guard. Como hay cambios, se muestra el aviso y se hace `e.preventDefault()`: el cambio de pestaña queda frenado y el editor sigue en pantalla. Con "Seguir editando" se queda; con "Salir sin guardar" o "Guardar y salir" se navega a Mi Cuenta con `leave`. El editor queda montado sin foco; `skipExitPrompt` queda en `true` y el efecto de `focus` lo reactiva cuando vuelve.
- **"Buscar Usuario":** el listener siempre cancela el comportamiento por defecto y la pestaña siempre vuelve a la raíz de su stack. Lo que cambia es **cuándo** se ejecuta esa navegación: se pasa por el guard y recién se hace al confirmar. Mientras tanto la pantalla no cambia.

Con cualquiera de las dos, si no hay cambios pendientes (o ya se eligió descartar), el guard devuelve `false` y se navega sin aviso.

### 6. ¿Qué cambia en `persistRoutine` cuando haya una BD real?
- **Es asíncrona:** pasa de una función directa a una llamada de red (`await`), con estados de "Guardando…", manejo de errores (sin conexión, 4xx/5xx) y un botón deshabilitado mientras espera.
- **El snapshot se actualiza solo después del éxito:** `setSavedSnapshot` y el cambio a "Guardado ✓" deben esperar la respuesta; si falla, el borrador sigue marcado como sin guardar. "Guardar y salir" solo debe dejar salir después de confirmar.
- **Atomicidad:** crear la rutina y asignarla al alumno deben ser una sola operación (transacción o un único endpoint), para no dejar rutinas huérfanas.
- **Idempotencia:** un doble toque no debe crear dos rutinas.
- **Ids:** el servidor devuelve los ids definitivos de días, bloques e ítems nuevos, que reemplazan a los temporales (`Date.now()`).
- **Concurrencia:** detectar si otro entrenador cambió la rutina entre tanto (campo de versión).
- **Validación en el servidor** de las mismas reglas del formulario.
