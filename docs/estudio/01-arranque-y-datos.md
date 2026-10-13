# Bloques 1 y 2: arranque, arquitectura y modelo de datos

## Bloque 1: cómo arranca la app

**Cadena de arranque:**
```
package.json  "main": "index.ts"
   └─ index.ts   registerRootComponent(App)
        └─ app/index.tsx   (componente App)
```
- `registerRootComponent` es de Expo. Registra el componente raíz en React Native y hace que funcione igual en Expo Go, en un build nativo y en web.
- **La carpeta `app/` no es Expo Router.** En `package.json` no está `expo-router`. Acá `app/index.tsx` es solo un archivo que se importa a mano desde `index.ts`. La navegación se arma con React Navigation de forma manual.

**Árbol de proveedores** (`app/index.tsx`), de afuera hacia adentro:
```
SafeAreaProvider        → da los márgenes seguros (notch, barra inferior)
  AuthProvider          → quién está logueado
    ExercisesProvider   → catálogo de ejercicios
      NavigationContainer → estado de navegación
        AppNavigator    → decide qué pantallas existen
```
El orden importa: `AppNavigator` llama a `useAuth()`, así que tiene que estar dentro de `AuthProvider`. Los proveedores que todos necesitan van por fuera.

**`AppNavigator` y la sesión.** En vez de navegar a mano con `navigate('home')` después del login, el stack **cambia qué pantallas existen según `user`**:
- Sin `user`: solo existen `login` y `signup`.
- `user.isTrainer`: solo existe `TrainerTabs`.
- Usuario común: existen `UserTabs` y `escanear_qr_user`.

Cuando `login()` hace `setUser(...)`, el componente se re-renderiza, las pantallas de login desaparecen y aparecen las del rol correspondiente. Con `logout()` pasa lo mismo al revés.

Consecuencia de seguridad: un usuario común no puede navegar a pantallas de trainer porque esas rutas no están registradas para él. **Es una protección de UI, no de datos.** La protección real tiene que hacerla el backend.

**Configuración:**
- `app.json`:
  - `scheme: "gymbroapp"` es el esquema de deep links.
  - `userInterfaceStyle: "automatic"` sigue el tema claro u oscuro del sistema.
  - Los plugins `expo-camera` y `expo-location` declaran los textos de permisos (QR del gimnasio y validación de ubicación).
  - `reactCompiler: true` activa el React Compiler, que memoiza automáticamente (por eso hay pocos `useMemo`/`useCallback`).
- `tsconfig.json`: `strict: true` y alias `@/*` apuntando a `src/*`. Hoy el código usa rutas relativas y no el alias.
- Todas las dependencias de Expo son `~57.x`, con React 19.2 y React Native 0.86.

Detalle menor: el componente de login se importa como `LooginScreen` (tres "o") en `app/index.tsx`. Funciona, pero es un typo.

## Bloque 2: el modelo de datos

Hay tres módulos en `src/data/`. Funcionan como una base de datos en memoria: un array por "tabla" y funciones que simulan consultas.

### `users.ts` (tabla `usuarios`)
Una sola tabla para alumnos y entrenadores, distinguidos por `isTrainer`.

| Campo | Observación importante |
|---|---|
| `id` | numérico, se genera con `max(id)+1` |
| `id_rutina` | clave foránea a `routines`. `null` si aún no tiene rutina |
| `name`, `initials` | **derivados** de `firstName` y `lastName` |
| `age`, `weight`, `height` | **strings con unidad**: `"23 años"`, `"75.5 kg"`, `"160 cm"` |
| `password` | **texto plano** |

Funciones:
- `getUserById`: equivale a `SELECT ... WHERE id = ?`.
- `addUser`: equivale a `INSERT`. Nace con `id_rutina: null`, normaliza el email a minúsculas y concatena las unidades.
- `setUserRoutine`: equivale a `UPDATE`.

### `routines.ts` (rutinas, anidadas)
Árbol de cuatro niveles:
```
Routine ─ id, name
  └ days: RoutineDay[]      ─ id, name ("Día 1")
      └ blocks: RoutineBlock[]   ─ id
          └ items: RoutineItem[]  → uno de dos tipos:
               • exercise: exerciseId, series, repetitions, weight, comments
               • rest:     time, unit ('minutos' | 'segundos')
```
- `RoutineItem` es una **unión discriminada**: el campo `type` (`'exercise'` o `'rest'`) le dice a TypeScript qué otros campos existen.
- `exerciseId` es un string tipo `'abs/45-side-bend'` que apunta al catálogo de ejercicios de la API externa.
- Funciones: `getRoutineById`, `createRoutine` (INSERT) y `updateRoutineDays` (UPDATE). Las dos últimas hacen `JSON.parse(JSON.stringify(days))`, una **copia profunda**, para que la rutina guardada no comparta referencias con el estado editable de la pantalla.

### `workoutLogs.ts` (historial de entrenamientos)
Simula dos tablas con el JOIN ya resuelto:
```
registros_entrenamiento (id, id_usuario, fecha)
registro_ejercicios     (id_registro, id_ejercicio, grupo_muscular)
```
Decisión de diseño: cada log guarda **una copia (snapshot)** de los ejercicios de ese día con su grupo muscular. Si el entrenador edita la rutina después, las estadísticas pasadas no cambian. Es un patrón correcto que hay que conservar en la BD real.
- Un usuario puede tener varios logs el mismo día. `getWorkoutDaysThisYear` cuenta fechas únicas con un `Set`.
- Las fechas son strings `'YYYY-MM-DD'`.
- Lo usan `escanear_qr_user`, `estadisticas_user` y `home_user`.

## Lista para el bloque 9 (puente a la BD real)
1. **Contraseñas en texto plano.** Hay que hashearlas (bcrypt/argon2) o delegar en un servicio de auth.
2. **Ids con `max+1`.** Con concurrencia pueden duplicarse. En la BD pasan a `AUTO_INCREMENT`/UUID.
3. **Strings con unidad** (`"23 años"`). Guardar números (`age`, `weight_kg`, `height_cm`) y formatear en la UI. La edad se desactualiza: lo correcto es guardar fecha de nacimiento.
4. **Campos derivados** (`name`, `initials`). No se guardan, se calculan.
5. **Funciones síncronas.** Con BD serán asíncronas; cada pantalla necesitará estados de carga y error.
6. **Rutina anidada.** Decidir entre JSON o normalizar en 4 tablas (`rutinas`, `dias`, `bloques`, `items`).
7. **`id_rutina` en `usuarios`.** Confirmar si una rutina se comparte entre usuarios o es 1 a 1.
