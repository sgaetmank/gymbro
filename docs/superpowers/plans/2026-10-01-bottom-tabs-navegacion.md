# Bottom Tabs para la navegación de usuario y de trainer — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los dos bottom nav "a mano" que existen hoy (`UserBottomNav` y `TrainerBottomNav`: `View`s con `TouchableOpacity`s que llaman `navigation.navigate(...)` dentro de un único `Stack.Navigator` plano) por `Tab.Navigator`s reales de `@react-navigation/bottom-tabs`, para que cambiar de sección no apile pantallas y el botón atrás de Android cierre la app al estar parado en la raíz de un tab — tanto para el flujo de usuario común como para el de trainer.

**Architecture:** El `Stack.Navigator` raíz (en `app/index.tsx`) hoy tiene dos grupos de rutas sueltas: 6 pantallas para "usuario común" y 4 para "trainer". Cada grupo pasa a ser una sola `Stack.Screen` que monta un `Tab.Navigator` propio:

- `UserTabs` (usuario común): 5 tabs — Inicio, Rutinas, Reloj, Estadísticas, Mi Cuenta. Solo "Rutinas" tiene drill-down (`mi_rutina_user` → `ver_dia_x_user`), así que es el único tab con un `Stack.Navigator` anidado.
- `TrainerTabs` (trainer): 2 tabs — Buscar Usuario, Mi Cuenta. Solo "Buscar Usuario" tiene drill-down (`buscar_usuario_trainer` → `ver_datos_trainer` y → `editar_rutina_trainer`), así que es el único tab con un `Stack.Navigator` anidado.

En ambos casos los nombres de ruta de cada `Tab.Screen` se mantienen iguales a los actuales, así que los `navigation.navigate('mi_rutina_user')`, `navigation.navigate('buscar_usuario_trainer')`, etc. que ya existen en las pantallas siguen funcionando sin cambios — React Navigation resuelve el nombre contra el tab o la pantalla del stack anidado que corresponda.

**Tech Stack:** React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`, nuevo: `@react-navigation/bottom-tabs`), Expo SDK 57, React Native 0.86.

**Spec:** No hay spec separado — este plan surge de la conversación con el usuario (ver resumen arriba del chat). No hay suite de tests automatizados en el proyecto (no hay `jest` ni carpeta `__tests__`), así que cada tarea reemplaza "correr los tests" por: `npx tsc --noEmit` / `npx expo lint` como gate automático, más una verificación manual puntual con `expo start` (switch de tabs, drill-down, botón atrás de Android/emulador en cada tab raíz).

## Global Constraints

- No usar `npm`/`yarn` directo para instalar — usar `npx expo install <pkg>` para mantener la versión compatible con SDK 57.
- Mantener nombres de ruta existentes (`home_user`, `mi_rutina_user`, `ver_dia_x_user`, `reloj`, `estadisticas_user`, `mi_cuenta_user`, `buscar_usuario_trainer`, `ver_datos_trainer`, `editar_rutina_trainer`, `mi_cuenta_trainer`) para no romper los `navigation.navigate(...)` ya escritos en las pantallas.
- No tocar el flujo de `login`/`signup` en `app/index.tsx` — el cambio es exclusivo de los grupos "Usuario común" y "Trainer".
- Mantener la paleta visual actual de cada nav (`#1D1D1D` fondo, `#FFC107` activo, `#666666` inactivo, mismos glifos) para que el tab bar nativo se vea igual que las barras hechas a mano.
- Todo el trabajo va en la rama `feature/bottom-tabs-navegacion` (ya creada), nunca directo a `main`.

## Review Focus

- **Back button en la raíz de cada tab (usuario y trainer):** al estar en Inicio/Rutinas/Reloj/Estadísticas/Mi Cuenta (usuario) o Buscar Usuario/Mi Cuenta (trainer) recién abiertos, sin haber cambiado de tab antes, el botón atrás de Android debe cerrar la app.
- **Drill-down y vuelta dentro de "Rutinas" y de "Buscar Usuario":** entrar a `ver_dia_x_user`, a `ver_datos_trainer` o a `editar_rutina_trainer` y volver (ícono `‹`/botón atrás propio o botón atrás de Android) debe volver a la pantalla anterior del mismo stack anidado, no cerrar la app ni saltar de tab.
- **`navigation.navigate` cruzando tabs:** los botones existentes en `home_user` (`Ver más estadísticas`, `A entrenar`) y en `buscar_usuario_trainer` (ir a `ver_datos_trainer` / `editar_rutina_trainer`) deben seguir funcionando igual.
- **Logout en medio de una sesión de drill-down:** si el usuario o el trainer cierra sesión estando en `ver_dia_x_user` o en `editar_rutina_trainer`, `AppNavigator` desmonta todo el `Tab.Navigator` correspondiente al cambiar de grupo de rutas — no debe quedar estado colgado ni crashear.
- **Rotación de pantalla (landscape):** ningún tab bar nativo debe superponerse ni romper el layout que ya usa `isLandscape` en cada pantalla.

---

## Task 1: Instalar `@react-navigation/bottom-tabs`

**Files:**
- Modify: `package.json` (vía CLI, no a mano)

**Interfaces:**
- Produces: paquete `@react-navigation/bottom-tabs` disponible para importar `createBottomTabNavigator` en las Tasks 2 y 6.

- [ ] **Step 1: Instalar el paquete compatible con el SDK**

```bash
npx expo install @react-navigation/bottom-tabs
```

- [ ] **Step 2: Verificar que quedó en `package.json` y no rompió nada**

```bash
npx expo-doctor
```
Expected: sin errores nuevos relacionados a `@react-navigation/bottom-tabs`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: agregar @react-navigation/bottom-tabs"
```

---

## Task 2: Crear el `UserTabs` navigator

**Files:**
- Create: `src/navigation/UserTabs.js`

**Interfaces:**
- Consumes: `UserHomeScreen` (`src/screens/home_user.js`), `UserRoutineScreen` (`src/screens/mi_rutina_user.js`), `UserDayScreen` (`src/screens/ver_dia_x_user.js`), `StopwatchScreen` (`src/screens/reloj.js`), `UserStatisticsScreen` (`src/screens/estadisticas_user.js`), `UserProfileScreen` (`src/screens/mi_cuenta_user.js`). Todas reciben `navigation` (y `ver_dia_x_user` también `route`) como props estándar de React Navigation — no cambian de firma.
- Produces: `UserTabs` (default export), componente sin props que se monta como única `Stack.Screen` del grupo "Usuario común" en `app/index.tsx` (Task 3).

- [ ] **Step 1: Crear el archivo del navigator**

```js
// src/navigation/UserTabs.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import UserHomeScreen from '../screens/home_user';
import UserRoutineScreen from '../screens/mi_rutina_user';
import UserDayScreen from '../screens/ver_dia_x_user';
import StopwatchScreen from '../screens/reloj';
import UserStatisticsScreen from '../screens/estadisticas_user';
import UserProfileScreen from '../screens/mi_cuenta_user';

const Tab = createBottomTabNavigator();
const RoutineStack = createNativeStackNavigator();

// Mismos glifos que usaba UserBottomNav, para no cambiar el look del nav.
const TAB_ICONS = {
  home: '⌂',
  routine: '⚒',
  clock: '◷',
  stats: '▥',
  account: '♙',
};

function makeTabIcon(key) {
  return function TabIcon({ color }) {
    return <Text style={{ fontSize: 18, color }}>{TAB_ICONS[key]}</Text>;
  };
}

// El tab "Rutinas" es el único con drill-down (día de rutina), por eso
// tiene su propio Stack.Navigator anidado en vez de ser una screen plana.
function RoutineTabStack() {
  return (
    <RoutineStack.Navigator screenOptions={{ headerShown: false }}>
      <RoutineStack.Screen name="mi_rutina_user" component={UserRoutineScreen} />
      <RoutineStack.Screen name="ver_dia_x_user" component={UserDayScreen} />
    </RoutineStack.Navigator>
  );
}

export default function UserTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#1D1D1D',
          borderTopWidth: 1,
          borderTopColor: '#292929',
        },
      }}
    >
      <Tab.Screen
        name="home_user"
        component={UserHomeScreen}
        options={{ title: 'Inicio', tabBarIcon: makeTabIcon('home') }}
      />
      <Tab.Screen
        name="mi_rutina_user"
        component={RoutineTabStack}
        options={{ title: 'Rutinas', tabBarIcon: makeTabIcon('routine') }}
      />
      <Tab.Screen
        name="reloj"
        component={StopwatchScreen}
        options={{ title: 'Reloj', tabBarIcon: makeTabIcon('clock') }}
      />
      <Tab.Screen
        name="estadisticas_user"
        component={UserStatisticsScreen}
        options={{ title: 'Estadísticas', tabBarIcon: makeTabIcon('stats') }}
      />
      <Tab.Screen
        name="mi_cuenta_user"
        component={UserProfileScreen}
        options={{ title: 'Mi Cuenta', tabBarIcon: makeTabIcon('account') }}
      />
    </Tab.Navigator>
  );
}
```

Nota sobre `backBehavior="history"` (default de la librería, lo dejamos explícito a propósito): al tocar atrás, primero vuelve al tab visitado antes; recién cuando no queda historial de tabs, deja que Android cierre la app. Es el comportamiento estándar de bottom tabs nativo y cumple el pedido ("desde Inicio, atrás cierra la app") porque Inicio es el tab inicial y no tiene historial previo.

- [ ] **Step 2: Chequeo estático**

```bash
npx tsc --noEmit
```
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/UserTabs.js
git commit -m "feat: crear UserTabs con bottom tabs y stack anidado para Rutinas"
```

---

## Task 3: Enchufar `UserTabs` en `app/index.tsx`

**Files:**
- Modify: `app/index.tsx:44-54`

**Interfaces:**
- Consumes: `UserTabs` default export (Task 2).
- Produces: el grupo "Usuario común" del `Stack.Navigator` raíz pasa a tener una sola `Stack.Screen`.

- [ ] **Step 1: Reemplazar las 6 pantallas sueltas por una sola screen que renderiza `UserTabs`**

Reemplazar en `app/index.tsx`:

```tsx
) : (
  // Usuario común. React Navigation muestra la primera screen de este
  // grupo (home_user) apenas cambia el conjunto de rutas disponibles.
  <>
    <Stack.Screen name="home_user" component={UserHomeScreen} />
    <Stack.Screen name="mi_rutina_user" component={UserRoutineScreen} />
    <Stack.Screen name="mi_cuenta_user" component={UserProfileScreen} />
    <Stack.Screen name="ver_dia_x_user" component={UserDayScreen} />
    <Stack.Screen name="reloj" component={StopwatchScreen} />
    <Stack.Screen name="estadisticas_user" component={UserStatisticsScreen} />
  </>
)}
```

por:

```tsx
) : (
  // Usuario común: una sola screen que monta el Tab.Navigator (ver
  // src/navigation/UserTabs.js). Los tabs individuales resuelven sus
  // propias rutas internamente.
  <Stack.Screen name="UserTabs" component={UserTabs} />
)}
```

Y actualizar los imports: sacar `UserHomeScreen`, `UserRoutineScreen`, `UserProfileScreen`, `UserDayScreen`, `StopwatchScreen`, `UserStatisticsScreen` (ya no se usan directo en este archivo) y agregar:

```tsx
import UserTabs from '../src/navigation/UserTabs';
```

(Los imports de `SearchUserScreen`, `EditRoutineScreen`, `TrainerProfileScreen`, `UserDataScreen` se tocan recién en la Task 7 — no sacarlos todavía.)

- [ ] **Step 2: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin errores, sin imports no usados.

- [ ] **Step 3: Verificación manual**

```bash
npx expo start
```
Entrar como usuario común y confirmar que aparece el tab bar nativo abajo con los 5 tabs, arrancando en Inicio.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: montar UserTabs como única screen del grupo usuario en el stack raíz"
```

---

## Task 4: Sacar `UserBottomNav` de las 6 pantallas de usuario

**Files:**
- Modify: `src/screens/home_user.js:10,199-203`
- Modify: `src/screens/mi_rutina_user.js:10,193-197`
- Modify: `src/screens/ver_dia_x_user.js:16,122,353-357`
- Modify: `src/screens/reloj.js:11,72-76`
- Modify: `src/screens/estadisticas_user.js:11,278-282`
- Modify: `src/screens/mi_cuenta_user.js:12,126-130`

**Interfaces:**
- Produces: pantallas sin dependencia de `UserBottomNav`, listas para que se borre el componente en la Task 5.

- [ ] **Step 1: En cada una de las 6 pantallas, sacar el import de `UserBottomNav` y el bloque `<UserBottomNav ... />` que queda como último hijo dentro de `<SafeAreaView>`**

Patrón a remover (ejemplo tomado de `home_user.js`, es igual en las otras 5 con su `activeScreen` correspondiente):

```jsx
import UserBottomNav from '../components/UserBottomNav';
```

```jsx
      <UserBottomNav
        activeScreen="home"
        isLandscape={isLandscape}
        navigation={navigation}
      />
```

El `isLandscape` y el `navigation` prop siguen usándose para otras cosas en varias pantallas (headers, etc.) — no tocar esas otras referencias.

- [ ] **Step 2: En `ver_dia_x_user.js`, cambiar el botón atrás para que use `goBack()` en vez de navegar por nombre**

Reemplazar:
```jsx
<TouchableOpacity onPress={() => navigation.navigate('mi_rutina_user')}>
```
por:
```jsx
<TouchableOpacity onPress={() => navigation.goBack()}>
```
(Ahora que `ver_dia_x_user` vive en el `RoutineStack` anidado junto a `mi_rutina_user`, `goBack()` es más correcto que navegar por nombre.)

- [ ] **Step 3: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin imports colgantes, sin errores.

- [ ] **Step 4: Verificación manual**

```bash
npx expo start
```
- Cambiar entre los 5 tabs y confirmar que no queda ningún bottom nav duplicado.
- Entrar a un día desde Rutinas, tocar `‹` y confirmar que vuelve a `mi_rutina_user`.
- Desde el tab Inicio recién abierto, tocar el botón atrás físico (o `Backspace` en el emulador) y confirmar que la app se cierra.

- [ ] **Step 5: Commit**

```bash
git add src/screens/home_user.js src/screens/mi_rutina_user.js src/screens/ver_dia_x_user.js src/screens/reloj.js src/screens/estadisticas_user.js src/screens/mi_cuenta_user.js
git commit -m "refactor: sacar UserBottomNav de las pantallas, ahora lo dibuja el Tab.Navigator"
```

---

## Task 5: Borrar el componente `UserBottomNav`

**Files:**
- Delete: `src/components/UserBottomNav.js`

**Interfaces:**
- Consumes: confirmación de que ningún archivo lo importa más (resultado de la Task 4).

- [ ] **Step 1: Confirmar que no queda ninguna referencia**

```bash
grep -rn "UserBottomNav" src app
```
Expected: sin resultados.

- [ ] **Step 2: Borrar el archivo**

```bash
git rm src/components/UserBottomNav.js
```

- [ ] **Step 3: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: borrar UserBottomNav, reemplazado por Tab.Navigator nativo"
```

---

## Task 6: Crear el `TrainerTabs` navigator

**Files:**
- Create: `src/navigation/TrainerTabs.js`

**Interfaces:**
- Consumes: `SearchUserScreen` (`src/screens/buscar_usuario_trainer.js`), `UserDataScreen` (`src/screens/ver_datos_trainer.js`), `EditRoutineScreen` (`src/screens/editar_rutina_trainer.js`), `TrainerProfileScreen` (`src/screens/mi_cuenta_trainer.js`). Todas reciben `navigation` (las de drill-down también `route`, por el `{ user }` que les pasa `buscar_usuario_trainer`) como props estándar — no cambian de firma.
- Produces: `TrainerTabs` (default export), componente sin props que se monta como única `Stack.Screen` del grupo "Trainer" en `app/index.tsx` (Task 7).

- [ ] **Step 1: Crear el archivo del navigator**

```js
// src/navigation/TrainerTabs.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import SearchUserScreen from '../screens/buscar_usuario_trainer';
import UserDataScreen from '../screens/ver_datos_trainer';
import EditRoutineScreen from '../screens/editar_rutina_trainer';
import TrainerProfileScreen from '../screens/mi_cuenta_trainer';

const Tab = createBottomTabNavigator();
const SearchStack = createNativeStackNavigator();

// Mismos glifos que usaba TrainerBottomNav, para no cambiar el look del nav.
const TAB_ICONS = {
  search: '⌕',
  account: '♙',
};

function makeTabIcon(key) {
  return function TabIcon({ color }) {
    return <Text style={{ fontSize: 22, color }}>{TAB_ICONS[key]}</Text>;
  };
}

// El tab "Buscar Usuario" es el único con drill-down (ver datos / editar
// rutina de un usuario encontrado), por eso tiene su propio
// Stack.Navigator anidado en vez de ser una screen plana.
function SearchTabStack() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="buscar_usuario_trainer" component={SearchUserScreen} />
      <SearchStack.Screen name="ver_datos_trainer" component={UserDataScreen} />
      <SearchStack.Screen name="editar_rutina_trainer" component={EditRoutineScreen} />
    </SearchStack.Navigator>
  );
}

export default function TrainerTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#1D1D1D',
          borderTopWidth: 1,
          borderTopColor: '#292929',
        },
      }}
    >
      <Tab.Screen
        name="buscar_usuario_trainer"
        component={SearchTabStack}
        options={{ title: 'Buscar Usuario', tabBarIcon: makeTabIcon('search') }}
      />
      <Tab.Screen
        name="mi_cuenta_trainer"
        component={TrainerProfileScreen}
        options={{ title: 'Mi Cuenta', tabBarIcon: makeTabIcon('account') }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 2: Chequeo estático**

```bash
npx tsc --noEmit
```
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/TrainerTabs.js
git commit -m "feat: crear TrainerTabs con bottom tabs y stack anidado para Buscar Usuario"
```

---

## Task 7: Enchufar `TrainerTabs` en `app/index.tsx`

**Files:**
- Modify: `app/index.tsx` (bloque "Entrenador", antes `home_user` de la Task 3; los números de línea ya se movieron tras esa task, ubicar por el comentario `// Entrenador`)

**Interfaces:**
- Consumes: `TrainerTabs` default export (Task 6).
- Produces: el grupo "Trainer" del `Stack.Navigator` raíz pasa a tener una sola `Stack.Screen`.

- [ ] **Step 1: Reemplazar las 4 pantallas sueltas por una sola screen que renderiza `TrainerTabs`**

Reemplazar en `app/index.tsx`:

```tsx
) : user.isTrainer ? (
  // Entrenador
  <>
    <Stack.Screen name="buscar_usuario_trainer" component={SearchUserScreen} />
    <Stack.Screen name="editar_rutina_trainer" component={EditRoutineScreen} />
    <Stack.Screen name="mi_cuenta_trainer" component={TrainerProfileScreen} />
    <Stack.Screen name="ver_datos_trainer" component={UserDataScreen} />
  </>
) : (
```

por:

```tsx
) : user.isTrainer ? (
  // Entrenador: una sola screen que monta el Tab.Navigator (ver
  // src/navigation/TrainerTabs.js).
  <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
) : (
```

Y actualizar los imports: sacar `SearchUserScreen`, `EditRoutineScreen`, `TrainerProfileScreen`, `UserDataScreen` (ya no se usan directo en este archivo) y agregar:

```tsx
import TrainerTabs from '../src/navigation/TrainerTabs';
```

- [ ] **Step 2: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin errores, sin imports no usados.

- [ ] **Step 3: Verificación manual**

```bash
npx expo start
```
Entrar con una cuenta de trainer y confirmar que aparece el tab bar nativo con los 2 tabs, arrancando en Buscar Usuario.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: montar TrainerTabs como única screen del grupo trainer en el stack raíz"
```

---

## Task 8: Sacar `TrainerBottomNav` de las 4 pantallas de trainer

**Files:**
- Modify: `src/screens/buscar_usuario_trainer.js:12,159-163`
- Modify: `src/screens/ver_datos_trainer.js:10,24,165-169`
- Modify: `src/screens/editar_rutina_trainer.js:16,1357-1361`
- Modify: `src/screens/mi_cuenta_trainer.js:12,107-111`

**Interfaces:**
- Produces: pantallas sin dependencia de `TrainerBottomNav`, listas para que se borre el componente en la Task 9.

- [ ] **Step 1: En cada una de las 4 pantallas, sacar el import de `TrainerBottomNav` y el bloque `<TrainerBottomNav ... />`**

Patrón a remover (ejemplo tomado de `mi_cuenta_trainer.js`, es igual en las otras 3 con su `activeScreen` correspondiente):

```jsx
import TrainerBottomNav from '../components/TrainerBottomNav';
```

```jsx
      <TrainerBottomNav
        activeScreen="account"
        isLandscape={isLandscape}
        navigation={navigation}
      />
```

- [ ] **Step 2: En `ver_datos_trainer.js`, cambiar el botón atrás para que use `goBack()` en vez de navegar por nombre**

Reemplazar:
```jsx
<TouchableOpacity onPress={() => navigation.navigate('buscar_usuario_trainer')}>
```
por:
```jsx
<TouchableOpacity onPress={() => navigation.goBack()}>
```
(`editar_rutina_trainer.js` ya usa `navigation.goBack()` en su botón atrás — línea 595 — no hace falta tocarlo.)

- [ ] **Step 3: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin imports colgantes, sin errores.

- [ ] **Step 4: Verificación manual**

```bash
npx expo start
```
- Cambiar entre los 2 tabs de trainer y confirmar que no queda ningún bottom nav duplicado.
- Desde Buscar Usuario, entrar a `ver_datos_trainer` de un usuario, tocar `‹` y confirmar que vuelve a `buscar_usuario_trainer`. Repetir con `editar_rutina_trainer`.
- Desde el tab Buscar Usuario recién abierto, tocar el botón atrás físico (o `Backspace` en el emulador) y confirmar que la app se cierra.

- [ ] **Step 5: Commit**

```bash
git add src/screens/buscar_usuario_trainer.js src/screens/ver_datos_trainer.js src/screens/editar_rutina_trainer.js src/screens/mi_cuenta_trainer.js
git commit -m "refactor: sacar TrainerBottomNav de las pantallas, ahora lo dibuja el Tab.Navigator"
```

---

## Task 9: Borrar el componente `TrainerBottomNav`

**Files:**
- Delete: `src/components/TrainerBottomNav.js`

**Interfaces:**
- Consumes: confirmación de que ningún archivo lo importa más (resultado de la Task 8).

- [ ] **Step 1: Confirmar que no queda ninguna referencia**

```bash
grep -rn "TrainerBottomNav" src app
```
Expected: sin resultados.

- [ ] **Step 2: Borrar el archivo**

```bash
git rm src/components/TrainerBottomNav.js
```

- [ ] **Step 3: Chequeo estático**

```bash
npx tsc --noEmit
npx expo lint
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: borrar TrainerBottomNav, reemplazado por Tab.Navigator nativo"
```

---

## Task 10: Verificación final de la rama

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Smoke test manual completo**

```bash
npx expo start
```
Recorrer el checklist de la sección **Review Focus** completo, para usuario común y para trainer.

- [ ] **Step 2: Lint + typecheck de la rama completa**

```bash
npx expo lint
npx tsc --noEmit
```
Expected: ambos limpios.

- [ ] **Step 3: Revisar el diff completo contra `main` antes de pedir review**

```bash
git diff main...feature/bottom-tabs-navegacion --stat
```
