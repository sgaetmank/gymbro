# Backend y conexión con la app: cómo funciona y cómo explicarlo

Este documento resume todo lo que se construyó al pasar de los datos escritos a mano (`src/data`) a un servidor real: el backend (`backend/`) y la forma en que la app se conecta con él. Está pensado para **entender la lógica** y para **defenderla oralmente**. Al final hay preguntas probables de los profesores con respuestas cortas.

---

## 1. La idea central en una frase

> La app ya no guarda ni inventa datos: **pide y manda todo a un servidor**, y el servidor es el único que habla con la base de datos y el único que decide qué es válido.

Antes, la "base de datos" eran arrays en `src/data` que viajaban dentro de la app y se perdían al reiniciarla. Ahora hay cuatro capas, la arquitectura que pide la cátedra (Expo → Express → Prisma → SQLite):

```
CELULAR (Expo / React Native)
  pantallas ──► src/services/api.ts          ← único lugar de la app que habla con el servidor
                    │  HTTP + JSON  (fetch)
                    ▼
SERVIDOR (Node + Express)    backend/src/app.ts
  cors → express.json → requireAuth → requireRole → ruta
                    │  Zod valida la entrada
                    ▼
  Prisma (backend/src/db.ts)  ← traduce objetos de TypeScript a consultas SQL
                    ▼
BASE DE DATOS (SQLite)       backend/prisma/dev.db
```

| Capa | Qué hace | Qué NO hace |
|---|---|---|
| **Pantallas** | Dibujan, piden datos a `api.ts`, muestran carga/error | No usan `fetch` ni conocen URLs, tokens ni SQL |
| **Express** | Recibe pedidos, **autentica**, **autoriza**, **valida**, decide | No guarda nada por sí mismo |
| **Prisma** | Lee y escribe en la base con tipos seguros | No tiene reglas de negocio |
| **SQLite** | Guarda los datos de forma persistente | No sabe nada de HTTP |

**Por qué la app no toca la base:** si la app tuviera acceso directo, cualquiera con la app (o el APK) podría leer o modificar los datos de todos. Con un servidor en el medio, cada pedido pasa por reglas que el cliente no puede saltear.

---

## 2. Qué se usó y por qué

| Pieza | Para qué | Idea clave |
|---|---|---|
| **Express 5** | Servidor HTTP: recibe pedidos y devuelve JSON | Una cadena de *middlewares* que se ejecutan **en el orden en que se registran**. En Express 5, el error de una ruta `async` llega solo al manejador de errores |
| **Prisma 6** (ORM) | Define las tablas en `schema.prisma` y las consulta con código TypeScript | `prisma db push` crea las tablas; `prisma generate` crea el cliente tipado |
| **SQLite** | Base en un archivo (`dev.db`) | Sin instalar nada. Cambiar a Postgres solo requiere cambiar `provider` y `DATABASE_URL` |
| **Zod 4** | Valida y convierte cada entrada del cliente | "Nunca confiar en lo que manda el cliente" |
| **bcryptjs** | Guarda contraseñas como hash | No se puede "des-hashear": se compara |
| **jsonwebtoken (JWT)** | Token de sesión firmado | El servidor no guarda sesiones; verifica la firma |
| **expo-secure-store** | Guarda el token en el teléfono | Keychain (iOS) / Keystore (Android) |
| **tsx** | Corre TypeScript directo en Node | `npm run dev` lo reinicia al cambiar un archivo |

---

## 3. Modelo de datos (`prisma/schema.prisma`)

```
User ──(routineId)──► Routine ──► Day ──► Block ──► Item
 │
 └──► WorkoutLog ──► WorkoutLogExercise
```

| Tabla | Contenido | Detalle importante |
|---|---|---|
| `User` | Datos del usuario, `role` (`ALUMNO` / `ENTRENADOR`), `passwordHash`, `routineId` | `email` y `dni` son `@unique`: **la base** impide duplicados |
| `Routine` | Una rutina (`name`) | Una rutina tiene varios usuarios posibles (`users User[]`) |
| `Day` → `Block` → `Item` | La rutina "normalizada" en tablas | Cada nivel tiene `position` |
| `Item` | Ejercicio **o** descanso | `type` decide qué columnas se usan (`exerciseId, series, repetitions, weightKg, comments` o `restTime, restUnit`) |
| `WorkoutLog` | Un entrenamiento registrado (`userId`, `date`) | `date` es texto `'YYYY-MM-DD'` |
| `WorkoutLogExercise` | Copia ("snapshot") de cada ejercicio hecho, con su `muscleGroup` | Se copia para que la estadística no cambie si la rutina se edita después |

**Decisiones que conviene saber justificar**
- **`position`:** en un array JS el orden es implícito (el índice). En una tabla no existe orden: hay que guardarlo en una columna. Al leer se pide `orderBy: { position: 'asc' }`.
- **`onDelete: Cascade`:** borrar una rutina borra sus días, bloques e ítems; borrar un usuario borra sus registros. Sin esto quedarían filas huérfanas.
- **`onDelete: SetNull` en `User.routine`:** si se borra una rutina, el usuario queda sin rutina en vez de borrarse.
- **El servidor guarda números** (`age: 23`, `weightKg: 75.5`), la app muestra textos (`"23 años"`, `"75.5 kg"`). La conversión la hacen los *adaptadores* de `api.ts`.
- **Los ids cambian al guardar una rutina:** el PUT reemplaza todo el árbol (borra y recrea), así que el servidor devuelve ids nuevos y la app reemplaza su borrador con la respuesta.

---

## 4. Seguridad: la parte que más se pregunta

### 4.1 Autenticación vs autorización
- **Autenticación = "¿quién sos?"** → login con email + contraseña → el servidor devuelve un **JWT**.
- **Autorización = "¿qué podés hacer?"** → según el **rol**, y según de **quién** son los datos.

### 4.2 Contraseñas
- Se guardan con `bcrypt.hash(password, 10)` (hash lento y con *sal* automática). Nunca se guarda ni se devuelve la contraseña.
- Login: `bcrypt.compare`. Si el email no existe **o** la contraseña está mal, el mensaje es el mismo (*"Email o contraseña incorrectos"*): no se revela cuál de los dos falló.

### 4.3 JWT
- Contiene `sub` (id del usuario) y `role`, **firmado** con `JWT_SECRET` (solo lo conoce el servidor, vive en `backend/.env`, que no se sube a Git). Vence a los **7 días**.
- La app lo manda en cada pedido: `Authorization: Bearer <token>`.
- Si alguien modifica el token, la firma deja de coincidir y `jwt.verify` falla → 401.
- El **rol sale del token firmado, nunca del cliente**: `register` siempre crea `ALUMNO`, no existe forma de pedir ser entrenador.

### 4.4 Los middlewares (en `app.ts`)
```ts
app.use('/api/me',       requireAuth, meRouter);
app.use('/api/alumnos',  requireAuth, requireRole('ENTRENADOR'), alumnosRouter);
app.use('/api/checkins', requireAuth, requireRole('ALUMNO'),     checkinsRouter);
```
`requireAuth` verifica el token y deja `{ userId, role }` en `res.locals.auth`. `requireRole` compara el rol. La protección está **en el servidor**: aunque alguien manipule la app, el servidor responde 403.

### 4.5 Códigos de estado (y cuándo se usa cada uno)
| Código | Significado | Ejemplo en Gymbro |
|---|---|---|
| **400** | El pedido está mal | Falta un campo, QR que no es de Gymbro, estás lejos del gimnasio |
| **401** | No estás autenticado | Sin token, token vencido o inválido |
| **403** | Estás autenticado, pero **no tenés permiso** | Un alumno intenta `PUT /alumnos/:id/rutina` |
| **404** | No existe (para vos) | Día que no pertenece a tu rutina; alumno inexistente |
| **409** | Conflicto | Email o DNI ya registrados |
| **422** | Entendí el pedido, pero el contenido no es procesable | Ejercicio que no está en el catálogo |
| **503** | Dependencia externa caída | No se pudo consultar el catálogo de ejercicios |
| **500** | Error inesperado | Se loguea en el servidor y al cliente solo le llega un mensaje genérico |

**401 vs 403** es la distinción que más preguntan: 401 = "no sé quién sos"; 403 = "sé quién sos y no podés".

### 4.6 Otras defensas
- **Lista blanca de salida** (`toPublicUser`): el servidor arma explícitamente qué campos salen, así `passwordHash` nunca viaja aunque se agregue una columna.
- **Validación de entrada con Zod** en cada ruta (tipos, rangos, formatos; `age` entero, `dni` de 7 u 8 dígitos, etc.).
- **Transacción** al guardar una rutina (`prisma.$transaction`): o se guarda completa o no se guarda nada. Si la validación o la base fallan a mitad, la rutina anterior queda intacta (se probó).
- **Chequeo de pertenencia** en el check-in: el día debe ser de la rutina **de ese alumno** (`routine: { users: { some: { id: userId } } }`). Si no, 404: no se confirma ni que ese día exista.
- **Errores controlados:** JSON inválido → 400; ruta inexistente → 404 en JSON; excepción → 500 genérico.

---

## 5. Los endpoints

| Ruta | Rol | Qué hace |
|---|---|---|
| `GET /api/health` | — | Responde `{ ok: true }` (para probar que el servidor vive) |
| `POST /api/auth/register` | — | Crea un **alumno**, devuelve `{ token, user }` |
| `POST /api/auth/login` | — | Devuelve `{ token, user }` |
| `GET /api/me` | cualquiera | Mi perfil (para restaurar sesión) |
| `GET /api/me/rutina` | cualquiera | Mi rutina o `null` |
| `GET /api/me/registros?year=&month=` | cualquiera | Mis entrenamientos del mes |
| `GET /api/me/dias-entrenados?year=` | cualquiera | Cantidad de días distintos entrenados en el año |
| `GET /api/alumnos` | entrenador | Lista de alumnos |
| `GET /api/alumnos/:id/rutina` | entrenador | Rutina de un alumno |
| `PUT /api/alumnos/:id/rutina` | entrenador | Reemplaza la rutina completa (la crea si no tenía) |
| `POST /api/checkins` | alumno | Registra un entrenamiento |

Los métodos siguen la convención REST: **GET** lee, **POST** crea, **PUT** reemplaza.

---

## 6. La conexión desde la app

### 6.1 `src/services/api.ts`: la única puerta
- Una función interna `request()` hace el `fetch`: arma la URL, agrega `Authorization`, serializa el cuerpo y procesa la respuesta.
- Las pantallas usan funciones con nombre (`getMyRoutine`, `createCheckin`, `saveAlumnoRoutine`...) que **devuelven los mismos tipos que ya usaba la app**. Por eso migrar fue cambiar *de dónde vienen* los datos sin reescribir las pantallas.
- **`ApiError`** con `status`: `0` significa "no hubo respuesta" (sin conexión o timeout). Las pantallas muestran `error.message`, que ya viene en español desde el servidor.
- **Timeout de 6 s** con `AbortController`: si el servidor no responde, el pedido se corta y la pantalla muestra el error con "Tocá para reintentar".
- **Adaptadores** (`adaptUser`, `adaptRoutine`, `toApiDays`): traducen entre el formato del servidor (números) y el de las pantallas (textos con unidad).

### 6.2 La dirección del servidor (`apiUrl.ts`)
Un celular no puede usar `localhost` (sería él mismo). `buildApiUrl` decide:
1. Si existe `EXPO_PUBLIC_API_URL` (en `.env.local`), esa gana.
2. Si no, usa la misma IP desde la que Expo cargó la app (`hostUri`) con el puerto 3000. Así no hay que tocar nada cuando la PC cambia de red.
3. Sin ninguna (web, simulador iOS): `localhost`.

### 6.3 La sesión (`AuthContext` + `session.ts`)
- **Login/registro:** se llama al servidor; si responde bien, se guarda el token (en memoria con `setAuthToken` y en `expo-secure-store`) y el usuario en el estado.
- **Al abrir la app:** `loading = true` y un efecto lee el token guardado → `GET /api/me` → restaura el usuario. Mientras tanto se muestra un indicador de carga (así no parpadea el login).
- **Token vencido (401 con sesión abierta):** `api.ts` avisa por un *handler* y el contexto cierra la sesión solo.
- **Error de red al restaurar:** el token **se conserva** (solo se borra ante un 401), así que sin internet no te desloguea.
- **Logout:** borra el token en memoria y del almacenamiento seguro, y `AppNavigator` cambia solo al login.

### 6.4 El patrón de cada pantalla que pide datos
```
useState: datos, cargando, error
useFocusEffect (o useEffect): pide los datos al enfocar la pantalla
  - cancelled flag: si la pantalla se desmonta o llega una respuesta vieja, se ignora
Render: "Cargando…" / mensaje de error + "Tocá para reintentar" / datos / estado vacío
```
`useFocusEffect` vuelve a pedir los datos cada vez que la pantalla recupera el foco: por eso el alumno ve la rutina nueva que armó el entrenador, y las estadísticas incluyen el entrenamiento recién registrado.

**Dónde se aplicó:** login, registro, Mi Rutina, Inicio (contador), Estadísticas, Escanear QR, búsqueda de alumnos y editor de rutinas.

---

## 7. Tres "viajes del dato" (el formato ideal para defender)

### 7.1 Iniciar sesión
1. **Pantalla** `login`: llama `login(email, password)` del contexto.
2. **`api.ts`:** `POST /api/auth/login` con `{ email, password }`.
3. **Express:** Zod valida; Prisma busca el usuario por email; `bcrypt.compare`; si coincide, `signToken(id, role)`.
4. **Base:** una lectura de `User`.
5. **Vuelta:** `{ token, user }` → `adaptUser` → el contexto guarda token (memoria + SecureStore) y usuario → el navegador muestra las tabs según `isTrainer`.

### 7.2 El entrenador guarda una rutina
1. **Pantalla** `editar_rutina_trainer`: al abrir, pide `GET /api/alumnos/:id/rutina`. Al tocar "Guardar", `saveAlumnoRoutine(userId, days)`.
2. **`api.ts`:** `toApiDays` convierte textos en números y hace `PUT /api/alumnos/:id/rutina`.
3. **Express:** `requireAuth` (¿hay token válido?) → `requireRole('ENTRENADOR')` (¿es entrenador?) → Zod valida el árbol completo.
4. **Prisma, en una transacción:** busca al alumno; si no tiene rutina, la crea y se la asigna; `deleteMany` de los días viejos (cascada) y crea los nuevos con sus `position`.
5. **Vuelta:** el servidor devuelve la rutina con ids reales → la app reemplaza el borrador, actualiza "lo último guardado" y el botón pasa a verde. Si falla: Alert y **no** sale de la pantalla.
6. **Efecto:** cuando el alumno abre "Mi rutina", `useFocusEffect` la vuelve a pedir y la ve.

### 7.3 El alumno registra un entrenamiento (check-in)
1. **Pantalla** `escanear_qr_user`: escanea el QR, pide la ubicación (GPS), valida **localmente** QR y distancia (para dar respuesta rápida) y guarda las coordenadas. El alumno elige un día de su rutina (traída del servidor) y confirma.
2. **`api.ts`:** `POST /api/checkins` con **solo** `{ dayId, qr, latitude, longitude }`.
3. **Express:** `requireAuth` + `requireRole('ALUMNO')` + Zod. Luego **revalida todo**: QR correcto, distancia ≤ 150 m (fórmula de Haversine), que el día sea de la rutina de ese alumno.
4. **El servidor decide el resto:** saca los ejercicios del día (en orden, sin descansos), consulta el catálogo externo para obtener el **grupo muscular** de cada uno (se descarga una vez y queda en caché) y calcula **la fecha de hoy** en la zona horaria de Buenos Aires.
5. **Base:** crea `WorkoutLog` + `WorkoutLogExercise` en una sola escritura.
6. **Vuelta:** el registro creado. La app navega al día. Al volver a Estadísticas e Inicio, `useFocusEffect` refresca y aparece el entrenamiento.

**Por qué el cliente manda tan poco:** el cliente no es de fiar. Si mandara los ejercicios, la fecha o el grupo muscular, alguien podría inventar entrenamientos. Al mandar solo "qué día" y "dónde estoy", el servidor puede comprobar todo.

**Por qué se valida dos veces (cliente y servidor):** en el cliente, para dar feedback inmediato sin viajar a la red; en el servidor, porque es lo único que **no se puede saltear**.

---

## 8. Decisiones de diseño: "¿por qué X y no Y?"

| Decisión | Alternativa | Por qué elegimos esto |
|---|---|---|
| Express + Prisma + SQLite | Firebase, Supabase, etc. | Es la arquitectura de la cátedra; SQLite no requiere instalar nada; Prisma da tipos y migrar a Postgres es cambiar una línea |
| Rutina normalizada en 4 tablas | Guardar el árbol como un JSON en una columna | Se puede consultar y validar por partes, respeta integridad referencial y es lo que se espera de una base relacional. El costo: más código para guardar y leer |
| JWT | Sesiones en el servidor | El servidor no guarda estado; el token lleva el rol firmado |
| El servidor recalcula ejercicios, grupo y fecha | Confiar en lo que manda la app | Seguridad e integridad de las estadísticas |
| `position` + guardar y reemplazar todo el árbol | Actualizar ítem por ítem | Mucho más simple: la pantalla ya trabaja con un borrador completo; con la transacción es seguro |
| Los adaptadores en `api.ts` | Cambiar todas las pantallas | Se migró sin reescribir pantallas y los cambios del formato quedan en un solo archivo |
| Estadísticas: el servidor entrega los registros del mes y la app calcula las barras | El servidor agrega todo | Se reutilizó la lógica ya probada de la pantalla (queda como mejora) |
| Todos los entrenadores ven todos los alumnos | Relación entrenador–alumno | Hoy no existe esa relación en el producto; se puede agregar con una columna y un filtro en el servidor |
| `db push` en vez de `migrate` | Migraciones versionadas | Más simple para un proyecto que se arma desde cero con un seed |
| Seed (`db:seed`) que vacía y recarga | Subir `dev.db` a Git | La base es un binario con datos personales; el seed es reproducible y revisable. Ojo: **borra todo** lo creado a mano |

---

## 9. Cómo se verificó

- **25 pruebas automáticas** (`npm run smoke`): registro, login, permisos por rol, check-in, estadísticas, errores. Además, una vez se **rompió `requireRole` a propósito** (prueba de mutación, manual y fuera de las 25) para comprobar que los tests lo detectan, y lo detectaron.
- **Pruebas por tarea** contra el servidor real, con un cliente que usa el mismo código de `api.ts`: equivalencia de las estadísticas (lo que mostraba la pantalla antes con datos locales = lo que muestra ahora), el flujo del QR y del editor.
- **`tsc --noEmit`, ESLint y export de Metro** después de cada cambio.
- **Pruebas manuales en el celular** de cada pantalla (incluido el caso con el servidor apagado) y un recorrido completo de los tres flujos: alumna, entrenador y alumno nuevo.

---

## 10. Limitaciones conocidas (conviene decirlas vos antes de que pregunten)

| Limitación | Qué implica | Mejora posible |
|---|---|---|
| El QR es fijo (`GYMBRO_CHECKIN_V1`) | Alguien podría sacarle una foto y usarlo desde lejos (la distancia igual se valida) | QR que rota cada pocos minutos, validado por el servidor |
| La ubicación la manda el cliente | Un celular modificado podría falsear el GPS | No tiene solución completa con GPS; se mitiga con QR rotativo |
| El tráfico va por HTTP en red local | El token viaja sin cifrar en la red | HTTPS en producción |
| JWT sin revocación | "Cerrar sesión" borra el token en el celular, pero un token robado sirve hasta que vence (7 días). El rol queda fijo hasta entonces | Vencimiento más corto + *refresh tokens*, o lista de tokens revocados |
| Sin límite de intentos de login | Se puede probar contraseñas sin freno | Rate limiting |
| Todos los entrenadores ven a todos los alumnos | No hay "mis alumnos" | Relación entrenador–alumno y filtro en el servidor |
| Edad guardada como número | Envejece sola | Guardar fecha de nacimiento |
| El grupo muscular `Movilidad` aparece solo en datos de prueba | El catálogo clasifica esos ejercicios como `Pierna` | Unificar |
| Depende de un catálogo externo | Sin internet en el servidor, el check-in devuelve 503 | Copiar el catálogo a una tabla |
| El aviso de "cambios sin guardar" del editor | Cubre la pestaña "Buscar Usuario", no "Mi Cuenta" | Escuchar el cambio de pestaña |

---

## 11. Cómo se levanta (para la demo)

```bash
cd backend
npm install
cp .env.example .env     # completar JWT_SECRET
npm run db:init          # crea tablas y cliente de Prisma
npm run db:seed          # datos de prueba (¡borra todo lo anterior!)
npm run dev              # http://localhost:3000   (probar /api/health)
# en otra terminal, en la raíz del proyecto:
npx expo start
```
Cuentas de prueba (contraseña `gymbro123`): alumna `solgaetmank@gmail.com`, entrenador `entrenadormaniana@gmail.com`.
Para el check-in hay que estar a menos de 150 m del gimnasio y escanear un QR con el texto `GYMBRO_CHECKIN_V1`.

---

## 12. Preguntas probables y respuestas cortas

**¿Por qué la app no se conecta directo a la base de datos?**
Porque el cliente no es de fiar: cualquiera podría leer o modificar los datos de todos. El servidor es el único con acceso a la base y aplica las reglas.

**¿Qué diferencia hay entre autenticación y autorización?**
Autenticación: demostrar quién sos (login → token). Autorización: qué podés hacer según tu rol y de quién son los datos (`requireRole` y el chequeo de pertenencia).

**¿Qué hay dentro del token y quién lo puede modificar?**
El id del usuario, su rol y la fecha de vencimiento, firmados con un secreto que solo conoce el servidor. Si alguien lo modifica, la firma no coincide y el servidor lo rechaza.

**¿Cómo se guardan las contraseñas?**
Como hash bcrypt con sal. Nunca en texto plano y nunca se devuelven al cliente.

**¿Qué pasa si un alumno intenta guardar una rutina?**
`requireRole('ENTRENADOR')` responde 403. Está probado en las pruebas automáticas.

**¿Por qué 401 y 403 son distintos?**
401: no está autenticado (sin token o vencido). 403: está autenticado pero no tiene permiso.

**¿Qué es el ORM y qué aporta Prisma?**
Un ORM traduce objetos del lenguaje a consultas SQL. Prisma define las tablas en un archivo, genera un cliente con tipos (el editor avisa si un campo no existe) y evita escribir SQL a mano.

**¿Qué es una transacción y dónde la usan?**
Un grupo de operaciones que se aplican todas o ninguna. Al guardar una rutina se borran los días viejos y se crean los nuevos: si algo falla a mitad, no queda una rutina a medio guardar.

**¿Qué hace la cascada (`onDelete: Cascade`)?**
Al borrar un padre se borran sus hijos (rutina → días → bloques → ítems), para no dejar filas huérfanas.

**¿Por qué el servidor recalcula los ejercicios y la fecha del check-in?**
Para que no se puedan falsear entrenamientos. El cliente solo dice qué día hizo y dónde está.

**¿Cómo se valida que estás en el gimnasio?**
Con la fórmula de Haversine (distancia entre dos coordenadas sobre una esfera). La app lo comprueba para dar respuesta rápida y el servidor lo vuelve a comprobar.

**¿Qué pasa si se cae el servidor mientras usás la app?**
Cada pedido tiene un límite de 6 segundos. La pantalla muestra el error con "Tocá para reintentar" y la sesión no se pierde (el token se conserva ante errores de red).

**¿Cómo sabe la app a qué IP conectarse?**
Usa la misma IP desde la que Expo cargó la app, con el puerto 3000. Se puede forzar con `EXPO_PUBLIC_API_URL`.

**¿Cómo se restaura la sesión al reabrir la app?**
Se lee el token de `expo-secure-store`, se pide `GET /api/me` y, si es válido, se restaura el usuario. Si el servidor responde 401, se descarta el token.

**¿Por qué las estadísticas no cambian si después se edita la rutina?**
Porque cada registro guarda una copia (snapshot) de los ejercicios hechos y su grupo muscular.

**¿Qué mejorarías primero?**
Un QR que rote cada pocos minutos, HTTPS, límite de intentos de login y la relación entrenador–alumno.

---

## 13. Glosario mínimo

- **API REST:** servicio web con rutas y métodos HTTP (GET/POST/PUT) que intercambia JSON.
- **Middleware:** función que se ejecuta antes de la ruta (autenticar, validar, registrar...).
- **ORM:** capa que traduce objetos del lenguaje a SQL.
- **Seed:** script que carga datos de prueba.
- **JWT:** token firmado con la identidad y el rol.
- **Hash:** huella irreversible de un texto (se compara, no se "descifra").
- **Transacción:** operaciones que se aplican todas o ninguna.
- **CORS:** regla del navegador sobre qué orígenes pueden llamar a una API (`cors()` la habilita para la versión web).
- **Snapshot:** copia de un dato en un momento dado.
