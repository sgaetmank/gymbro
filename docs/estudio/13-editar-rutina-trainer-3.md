# Bloque 8b-3: `editar_rutina_trainer`, guardado y avisos de salida

Archivo: `src/screens/editar_rutina_trainer.tsx`, líneas 534 a 618.

## 0. Corrección respecto del documento 03

Para estudiar esta parte se revisó el código fuente de React Navigation (`node_modules/@react-navigation`). El comentario del editor dice que escucha `tabPress` en el navigator padre para avisar al tocar "Mi Cuenta". **Eso no funciona así:**
- El tab bar emite `tabPress` con `target: route.key` de la pestaña tocada (`bottom-tabs/src/views/BottomTabBar.tsx`).
- Cada pantalla tiene su propio registro de listeners, indexado por su `route.key` (`core/src/useEventEmitter.tsx` y `core/src/useNavigationCache.tsx`). Un evento con `target` solo llega a los listeners de esa ruta.
- `navigation.getParent()` desde el editor devuelve la navegación de la pestaña **"Buscar Usuario"**, la que contiene al stack.

Por lo tanto el listener se dispara **solo al tocar "Buscar Usuario"**, no al tocar "Mi Cuenta". El documento 03 decía que "no mira qué pestaña se tocó": era una interpretación equivocada y ya fue corregida allí. Verificado en el código fuente, **no probado en el emulador**.

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

## 3. El listener `tabPress`, con lo que realmente hace

```tsx
const parentTabNavigation = navigation.getParent<BottomTabNavigationProp<TrainerTabParamList>>();
const unsubscribeTabPress = parentTabNavigation?.addListener('tabPress', (e) => {
  ... e.preventDefault(); confirmExitWithUnsavedChanges(() => { skipExitPrompt.current = true; parentTabNavigation.navigate('mi_cuenta_trainer'); });
});
```
Teniendo en cuenta la sección 0, lo que ocurre es esto (deducido del código, **a verificar en el emulador**):

| Acción del entrenador con cambios sin guardar | Qué pasa |
|---|---|
| Toca el botón atrás / `‹` | Aviso correcto (`beforeRemove`) |
| Toca **"Mi Cuenta"** | **No hay aviso.** No se elimina nada del stack y el listener no recibe ese evento. Pasa a Mi Cuenta con el borrador vivo en segundo plano |
| Después toca **"Buscar Usuario"** | El listener del tab (`TrainerTabs`) reinicia el stack a la raíz, lo que elimina el editor y dispara `beforeRemove` (aviso). Además dispara el listener `tabPress` del editor, así que podrían aparecer **dos avisos** |
| En ese aviso elige "Guardar y salir" por el camino de `tabPress` | Guarda y navega a `mi_cuenta_trainer`, aunque el entrenador había tocado "Buscar Usuario" |
| Cierra sesión (desde Mi Cuenta) | El borrador se pierde al desmontarse todo `TrainerTabs`; no se sabe si React Navigation avisa en ese caso |

El `skipExitPrompt` que queda en `true` tras salir por `tabPress` no causa problemas: la pantalla no se puede retomar, porque tocar "Buscar Usuario" siempre vuelve a la raíz del stack.

## 4. Las dependencias del `useEffect`

```tsx
}, [navigation, hasUnsavedChanges, persistRoutine]);
```
- Los listeners "recuerdan" (*closure*) los valores del render en que se crearon. Por eso el effect se re-ejecuta cuando cambia `hasUnsavedChanges`, para que el listener vea siempre el valor actual; el cleanup (`unsubscribe...`) quita los viejos.
- `persistRoutine` es una función definida en el cuerpo del componente, o sea **nueva en cada render**. Incluirla en las dependencias hace que el effect se re-ejecute (y re-suscriba los listeners) en cada render, y garantiza que "Guardar y salir" use el `days` más reciente. Con el React Compiler (activo) la función probablemente se memoiza con `days` y `editedUser`, y el efecto se re-ejecuta solo cuando cambian.
- Un listener desactualizado sería peligroso: "Guardar y salir" guardaría un borrador viejo.

## 5. Lista para el bloque 9 (continúa la del documento 12)
63. Guardado asíncrono: `persistRoutine` pasa a ser una llamada de red con carga y error. "Guardar y salir" debe esperar la confirmación del servidor antes de dejar salir y mostrar el error si falla.
64. Crear y asignar la rutina deben ser una sola operación atómica (transacción o un único endpoint), y evitar que un doble toque cree dos rutinas (idempotencia).
65. Aviso de cambios sin guardar: corregir el alcance del listener `tabPress` (cubrir "Mi Cuenta" y el cierre de sesión) y evitar el doble aviso. Probar los casos de la tabla de la sección 3.
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
Los listeners que se registran dentro del effect "congelan" los valores de ese render (*closure*). Si el effect no se re-ejecutara cuando cambian:
- `hasUnsavedChanges` quedaría con el valor viejo: el listener creyera que no hay cambios y deje salir sin avisar (o avise cuando ya se guardó).
- `persistRoutine` guardaría el `days` de un render anterior: "Guardar y salir" persistiría un borrador desactualizado.

Con las dependencias, el effect limpia los listeners viejos y registra nuevos con los valores actuales. Como `persistRoutine` se recrea en cada render, el efecto se re-ejecuta en cada render (con el React Compiler activo, probablemente solo cuando cambia `days`).

### 4. ¿A qué pestaña responde realmente el listener `tabPress` del editor y cómo lo sabemos?
A **"Buscar Usuario"**, la pestaña que contiene al editor. Se verificó en el código fuente de React Navigation:
1. `BottomTabBar.tsx` emite `tabPress` con `target: route.key`, la pestaña tocada.
2. `useEventEmitter.tsx` guarda los listeners por `target` y, al emitir con `target`, llama solo a los de esa ruta.
3. `navigation.getParent()` (desde `useNavigationCache.tsx`) devuelve la navegación de la ruta padre, o sea la ruta `buscar_usuario_trainer` del Tab.Navigator, y su `addListener` registra bajo esa ruta.

Los eventos de "Mi Cuenta" no llegan a ese listener. El comentario del código, que decía lo contrario, es incorrecto.

### 5. ¿Qué pasa hoy si el entrenador, con cambios sin guardar, toca "Mi Cuenta"? ¿Y si luego toca "Buscar Usuario"?
Deducido del código (a verificar en el emulador):
- **Toca "Mi Cuenta":** no hay aviso. No se elimina ninguna ruta (no hay `beforeRemove`) y el listener `tabPress` del editor no recibe ese evento. El editor sigue montado, sin foco, con su borrador.
- **Luego toca "Buscar Usuario":** el listener de `TrainerTabs` cancela el comportamiento por defecto y navega a la raíz del stack, lo que elimina el editor y dispara `beforeRemove` (primer aviso). También se dispara el listener `tabPress` del editor, que abre su propio aviso: podría haber dos. Si en ese aviso se elige "Guardar y salir", el camino de `tabPress` navega a Mi Cuenta.

El aviso aparece, pero tarde y puede duplicarse; el comportamiento deseado es avisar en el momento en que se abandona el editor.

### 6. ¿Qué cambia en `persistRoutine` cuando haya una BD real?
- **Es asíncrona:** pasa de una función directa a una llamada de red (`await`), con estados de "Guardando…", manejo de errores (sin conexión, 4xx/5xx) y un botón deshabilitado mientras espera.
- **El snapshot se actualiza solo después del éxito:** `setSavedSnapshot` y el cambio a "Guardado ✓" deben esperar la respuesta; si falla, el borrador sigue marcado como sin guardar. "Guardar y salir" solo debe dejar salir después de confirmar.
- **Atomicidad:** crear la rutina y asignarla al alumno deben ser una sola operación (transacción o un único endpoint), para no dejar rutinas huérfanas.
- **Idempotencia:** un doble toque no debe crear dos rutinas.
- **Ids:** el servidor devuelve los ids definitivos de días, bloques e ítems nuevos, que reemplazan a los temporales (`Date.now()`).
- **Concurrencia:** detectar si otro entrenador cambió la rutina entre tanto (campo de versión).
- **Validación en el servidor** de las mismas reglas del formulario.
