# Integración del backend (Express + Prisma + SQLite) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los datos escritos a mano en la app (`src/data/*`) por un backend real (Express + Prisma + SQLite) y dejar la app Expo funcionando de punta a punta contra él: login con sesión recordada, rutinas, check-in con QR y estadísticas.

**Architecture:** La app ya no toca datos: pide todo a una API (`Expo → HTTP → Express → Prisma → SQLite`). El backend vive en `backend/` (proyecto propio, dentro del mismo repo). La app habla con él a través de una sola capa (`src/services/api.ts`) que traduce el formato del servidor (números) al que ya usan las pantallas (textos como `"75.5 kg"`), de modo que **casi ninguna pantalla cambia su interfaz**: solo pasan de leer arrays a pedir datos (con estados de carga y error).

**Tech Stack:** Node ≥ 20.12 (verificado con 24.14.1) · Express 5 · Prisma 6 + SQLite · TypeScript ~6.0.3 · Zod (validación) · bcryptjs + jsonwebtoken (login) · Expo SDK 57 · `expo-secure-store` (token).

**Spec:** No hay consigna escrita todavía (la cátedra la va a entregar en unos días). Este plan se apoya en: el PDF de la cátedra *"Práctica Prisma — Express + Prisma + SQLite + Expo"* (arquitectura, convenciones de rutas y códigos de estado) y el estudio de la app en `docs/estudio/` (en especial el bloque 9, "puente a la base de datos real", y los documentos 01 a 14). **Cuando llegue la consigna oficial, hay que revisar este plan contra ella** antes de seguir.

## Global Constraints

- **Fecha de entrega:** un jueves de octubre (el número no llegó completo). El cronograma de abajo **asume el jueves 29/10/2026**; confirmar y ajustar.
- **Stack de la cátedra:** Express + Prisma + SQLite + TypeScript + Expo. Prisma queda **fijado en 6.x** (`prisma@6` y `@prisma/client@6`): la versión 7 en adelante cambia la configuración (adaptadores de base obligatorios, `prisma.config.ts`) y ya no coincide con el PDF. No actualizar aunque `npx prisma` ofrezca "Update available".
- **Express 5:** una ruta `async` que lanza un error llega sola al manejador de errores (en Express 4 la petición quedaba colgada). Por eso solo se escribe `try/catch` donde se traduce un error concreto (por ejemplo `P2002` a 409).
- **TypeScript del backend `~6.0.3`**, igual que la app. En TypeScript 6 la opción `types` ya no se completa sola: el `tsconfig` del backend declara `"types": ["node"]`.
- **Códigos de estado** (los del PDF más tres): 200, 201, 204, 400 (datos inválidos), 404, 500, y además **401** (sin sesión o sesión vencida), **403** (sin permiso) y **409** (duplicado: email o DNI repetidos).
- **El rol nunca viene del cliente.** Un registro público siempre crea un `ALUMNO`.
- **Contraseñas:** se guardan hasheadas con `bcryptjs`; nunca viajan de vuelta al cliente. Token JWT de 7 días, guardado en el teléfono con `expo-secure-store` (no en AsyncStorage).
- **El servidor valida todo otra vez** (aunque la pantalla ya lo haga): el cliente se puede saltear.
- **La API habla con números; las pantallas muestran textos** (`"23 años"`, `"75.5 kg"`, `"160 cm"`). La conversión vive solo en `src/services/api.ts`.
- **No cambian** en esta integración: `ExercisesContext` y `exercisesApi.ts` (el catálogo sigue viniendo de la API externa), `ver_dia_x_user`, `reloj`, `mi_cuenta_user`, `mi_cuenta_trainer`, `ver_datos_trainer` y los componentes. Funcionan con los tipos actuales.
- **Mensajes al usuario en español rioplatense** (voseo: "Tenés que iniciar sesión").
- **Archivos `.env` no se suben al repositorio.** `backend/.gitignore` ya excluye `.env` y `*.db`; el `.gitignore` de la raíz excluye `.env*.local`.
- **Finales de línea:** los archivos de la app usan CRLF (Windows). Las ediciones a archivos existentes se hacen con la herramienta de edición por bloques (los diffs de este plan son la referencia: cada línea `-` es el texto actual y cada `+` el nuevo), no pegando archivos enteros.
- **Git:** todo el trabajo va en la rama `feature/backend-integracion`, nunca directo a `main`. Los mensajes de commit no llevan líneas de atribución a herramientas de IA (preferencia del usuario).

## Review Focus

Las cinco situaciones que el plan no pierde de vista y que más probablemente le pasen a quien use esto (la prueba de cada una está en la tarea que se indica):

1. **El celular no llega a la PC** (IP equivocada, otra red Wi-Fi, firewall de Windows): la app tiene que mostrar "No se pudo conectar con el servidor", no quedarse colgada. En esta PC hay **dos** direcciones IPv4 (`192.168.56.1`, un adaptador virtual, y `192.168.0.117`, la de la red); usar la de la red. → Tarea C1 (prueba desde el navegador del celular) y tabla de problemas frecuentes.
2. **El servidor está apagado o se cae mientras se usa la app:** cada pantalla muestra el error con "Tocá para reintentar", sin pantalla en blanco ni cierre. → Tareas C2 a C5 (prueba manual: apagar el servidor).
3. **La sesión venció o el token ya no es válido:** la app vuelve sola al login. → Tarea C2 (prueba manual: cambiar `JWT_SECRET` y reiniciar el servidor).
4. **Doble toque** en Iniciar sesión, Registrarme, Guardar o Confirmar día: se envía un solo pedido (el botón se deshabilita y cambia su texto). → Tareas C2, C4 y C5.
5. **El catálogo externo de ejercicios no responde** (jsDelivr caído) en el momento del check-in: el servidor responde 503 con un mensaje claro y la app lo muestra; no se guarda nada a medias. → Tarea B6 (código) y tarea C4 (prueba manual cambiando la URL del catálogo).

Quedan cubiertas por la prueba automática del backend (`npm run smoke`, 25 pruebas): permisos por rol, registro con datos inválidos, email y DNI repetidos, rol enviado por el cliente, rutina inválida (no guarda nada), reemplazo de rutina, check-in lejos del gimnasio, con QR incorrecto, de un día ajeno o de un día sin ejercicios, y los registros del mes.

---

## Cómo está verificado este plan

| Parte | Cómo se verificó | Resultado |
|---|---|---|
| **Backend** (tareas B1 a B6) | El código se escribió y se **reprodujo tarea por tarea en una carpeta limpia**, con los mismos comandos de este plan (instalación, `db:init`, seed, servidor y pruebas) | `tsc` sin errores en cada tarea; **25 de 25 pruebas** pasan; los comandos de PowerShell de las tareas B4 y B5 se ejecutaron contra el servidor |
| **Cliente** (tareas C1 a C6) | Los cambios se aplicaron **por tareas, en orden, sobre una copia de tu app** (con tus cambios de formato actuales) | `tsc --noEmit` sin errores después de cada tarea; ESLint sin advertencias nuevas (la de `confirmExitWithUnsavedChanges` en el editor ya existía) |
| **No verificado** | La app **no se ejecutó** en un celular ni en un emulador, `expo-secure-store` no estaba instalado en la copia de prueba (se usó una declaración temporal de tipos) y el catálogo externo se consultó solo desde el servidor | Las pruebas manuales de cada tarea (C1 a C5) son las que cierran esa brecha |

Todo el código de este plan es el que se probó: no está reescrito a mano.

## Decisiones que asume el plan

| # | Decisión | Qué asume el plan | Cuándo conviene cambiarla |
|---|---|---|---|
| D1 | Tecnología | Express + Prisma + SQLite (la de la cátedra) | Si la consigna exige otra |
| D2 | Guardar la rutina | Normalizada en tablas: `Routine → Day → Block → Item`, con una columna `position` (el orden de un array pasa a ser una columna) | — |
| D3 | ¿Qué alumnos ve cada entrenador? | **Todos** (hoy no existe relación entrenador-alumno) | Si la consigna pide "mis alumnos": agregar una relación y filtrar en el servidor |
| D4 | Catálogo de ejercicios | Sigue siendo la API externa. La app la consulta para mostrar; el **servidor** la consulta para saber el grupo muscular al registrar un entrenamiento | Si se quiere independencia de un tercero: copiarlo a una tabla |
| D5 | Edad | Se guarda `age` (entero), como hoy | Mejora: guardar fecha de nacimiento |
| D6 | Estadísticas | El servidor entrega los registros del mes y la app sigue calculando las barras (sin reescribir esa lógica) | Mejora: que el servidor entregue ya agregado |
| D7 | Check-in | QR fijo + GPS, validados en el cliente (para la experiencia) **y otra vez en el servidor** | Mejora: QR rotativo |
| D8 | Mejoras funcionales (editar ítems, renombrar días, etc.) | No se incluyen | Después, según la consigna |

## Mapa de archivos

**Backend (todo nuevo, en `backend/`):**

| Archivo | Responsabilidad |
|---|---|
| `package.json`, `tsconfig.json`, `.gitignore`, `.env.example` | Proyecto, scripts, qué se ignora |
| `prisma/schema.prisma` | Tablas (`User`, `Routine`, `Day`, `Block`, `Item`, `WorkoutLog`, `WorkoutLogExercise`) |
| `prisma/seed.ts` | Carga los datos de prueba (20 usuarios, 16 rutinas, 189 registros) |
| `src/env.ts`, `src/config.ts` | Lee `.env`; constantes del gimnasio |
| `src/db.ts` | Cliente de Prisma (uno solo) |
| `src/app.ts`, `src/index.ts` | Middlewares y rutas; arranque del servidor |
| `src/auth.ts` | Token JWT, `requireAuth`, `requireRole` |
| `src/validation.ts` | Esquemas Zod de todas las entradas |
| `src/serializers.ts` | Qué campos salen del servidor (lista blanca; nunca el hash) |
| `src/routes/auth.ts`, `me.ts`, `alumnos.ts`, `checkins.ts` | Los endpoints |
| `src/catalog.ts`, `src/geo.ts` | Grupos musculares desde el catálogo; distancia y fecha |
| `test/smoke.test.ts` | Prueba de punta a punta (25 pruebas) |

**App (`src/`):**

| Archivo | Cambio |
|---|---|
| `src/types/index.ts`, `src/services/api.ts`, `src/services/session.ts` | **Nuevos**: tipos, capa de API, almacenamiento del token |
| `src/context/AuthContext.tsx` | Reescrito: `login`/`register` asíncronos, token, sesión recordada |
| `app/index.tsx`, `src/components/PrimaryButton.tsx` | Pantalla de carga de sesión; botón `disabled` |
| `login`, `signup`, `home_user`, `mi_rutina_user`, `estadisticas_user`, `escanear_qr_user`, `buscar_usuario_trainer`, `editar_rutina_trainer`, `navigation/types.ts` | Piden los datos al servidor |
| `src/data/*` | Se mueven a `backend/prisma/seed-data/` al final |
| `tsconfig.json`, `eslint.config.ts` (raíz) | Ignoran la carpeta `backend/` |

## Cronograma (asumiendo entrega el jueves 29/10)

| Fechas | Tareas | Resultado |
|---|---|---|
| Lun 12 a Mié 14 | 0, B1 a B4 | Backend con login real |
| Jue 15 a Dom 18 | B5, B6, C1, C2 | Backend completo y probado; la app inicia sesión contra él y recuerda la sesión |
| Lun 19 a Jue 22 | C3, C4 | Flujo del alumno completo (rutina, check-in, estadísticas) |
| Vie 23 a Dom 25 | C5 | Flujo del entrenador completo (búsqueda y editor) |
| Lun 26 a Mié 28 | C6 + colchón | Limpieza, prueba completa en el celular, README, ensayo de la defensa |
| **Jue 29** | Entrega | |

**Si la fecha es antes** (el plan está ordenado por prioridad: cada bloque deja la app usable):
1. **Mínimo viable:** 0, B1 a B4, C1, C2. Login y registro reales con base persistente.
2. **+ Alumno:** B6, C3, C4.
3. **+ Entrenador:** B5, C5.
4. C6 (limpieza) siempre al final.

---

### Task 0: Preparación

**Files:** ninguno (solo Git y comprobaciones).

- [ ] **Step 1: Confirmar la fecha de entrega y la consigna.** Si la fecha o la consigna cambian algo (por ejemplo, otra base o la relación entrenador-alumno), ajustar *Decisiones* antes de seguir.

- [ ] **Step 2: Dejar el árbol de trabajo limpio.** Hoy hay cambios sin commitear (formato, `app.json`, PDFs de `fundamentos/` borrados, `docs/estudio/`). Revisarlos y commitearlos antes de empezar:

```bash
git status
git add -A
git commit -m "docs: material de estudio y ajustes de formato"
```

- [ ] **Step 3: Crear la rama de trabajo**

```bash
git switch -c feature/backend-integracion
```

- [ ] **Step 4: Comprobar Node**

```bash
node -v
```
Expected: `v20.12` o superior (verificado con `v24.14.1`).

- [ ] **Step 5: Anotar la IP de la PC en la red** (se usa en la tarea C1)

```powershell
ipconfig
```
Anotar la "Dirección IPv4" del adaptador de la red Wi-Fi o Ethernet. En esta PC aparecen `192.168.56.1` (adaptador virtual: **no** sirve para el celular) y `192.168.0.117` (la de la red: la que hay que usar; verificar que siga siendo la misma el día que se prueba).

---

### Task B1: Esqueleto del backend (Express + health)

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/.gitignore`, `backend/.env.example`, `backend/.env`
- Create: `backend/src/env.ts`, `backend/src/config.ts`, `backend/src/app.ts`, `backend/src/index.ts`
- Modify: `tsconfig.json` (raíz), `eslint.config.ts` (raíz)

**Interfaces:**
- Produces: `app` (aplicación Express exportada desde `src/app.ts`); `config.port` y `config.jwtSecret` (`src/config.ts`); la constante `GYM` (`src/config.ts`) que usará el check-in; scripts `dev`, `start`, `db:init`, `db:seed`, `typecheck`, `smoke`.

- [ ] **Step 1: Crear la carpeta del backend**

```powershell
mkdir backend
cd backend
```

- [ ] **Step 2: Crear `backend/package.json`** (sin dependencias todavía: las agrega el paso siguiente)

```json
{
  "name": "gymbro-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "db:init": "prisma generate && prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "typecheck": "tsc --noEmit",
    "smoke": "tsx --test test/smoke.test.ts"
  }
}
```

- [ ] **Step 3: Instalar las dependencias** (desde `backend/`)

```powershell
npm install express cors jsonwebtoken bcryptjs zod @prisma/client@6
npm install -D prisma@6 typescript@~6.0.3 tsx @types/node @types/express @types/cors @types/jsonwebtoken
```
Expected: termina con `found 0 vulnerabilities`.

- [ ] **Step 4: Crear `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 5: Crear `backend/.gitignore`**

```text
node_modules
.env
*.db
*.db-journal
```

- [ ] **Step 6: Crear `backend/.env.example`**

```text
DATABASE_URL="file:./dev.db"
PORT=3000
# Generar uno propio con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="cambiar-por-un-secreto-largo-y-aleatorio"
```

- [ ] **Step 7: Crear `backend/.env`** (no se sube al repositorio). Primero generar un secreto propio:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Después crear `backend/.env` con ese valor:

```text
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="<pegar acá el secreto generado>"
```

- [ ] **Step 8: Crear `backend/src/env.ts`**

```ts
// Carga backend/.env antes de que nadie lea process.env (Node 20.12+ lo trae incorporado).
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables que ya tenga el sistema.
}
```

- [ ] **Step 9: Crear `backend/src/config.ts`**

```ts
import './env';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? '',
};

if (!config.jwtSecret) {
  throw new Error('Falta JWT_SECRET en backend/.env (ver .env.example)');
}

// Datos del gimnasio para validar el check-in (los mismos que usaba la app).
export const GYM = {
  qr: 'GYMBRO_CHECKIN_V1',
  latitude: -34.6127955,
  longitude: -58.3661936,
  radiusMeters: 150,
  timeZone: 'America/Argentina/Buenos_Aires',
};
```

- [ ] **Step 10: Crear `backend/src/app.ts`** (por ahora solo salud, 404 y errores; las rutas se agregan en las tareas siguientes)

```ts
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

export const app = express();

// Los middlewares van ANTES de las rutas y se ejecutan en el orden en que se registran.
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores: en Express 5, lo que lance una ruta async llega acá solo.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({ error: 'El cuerpo del pedido no es un JSON válido' });
  }
  console.error(error);
  res.status(500).json({ error: 'Error inesperado del servidor' });
});
```

- [ ] **Step 11: Crear `backend/src/index.ts`**

```ts
import { app } from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Gymbro API escuchando en http://localhost:${config.port}`);
});
```

- [ ] **Step 12: Hacer que la app ignore la carpeta `backend/`.** Sin esto, el chequeo de tipos de la app analiza 19 archivos del backend. En `tsconfig.json` (raíz) agregar `exclude` al final:

```diff
   "include": [
     "**/*.ts",
     "**/*.tsx"
-  ]
+  ],
+  "exclude": ["backend", "node_modules"]
 }
```
Y en `eslint.config.ts` (raíz) ampliar `ignores`:

```diff
-    ignores: ['dist/*'],
+    ignores: ['dist/*', 'backend/**'],
```

- [ ] **Step 13: Verificar los tipos del backend y de la app**

```powershell
npm run typecheck
cd ..
npx tsc --noEmit
```
Expected: ambos sin salida (sin errores).

- [ ] **Step 14: Encender el servidor y probarlo** (desde `backend/`)

```powershell
npm run dev
```
Expected: `Gymbro API escuchando en http://localhost:3000`. En **otra terminal**:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```
Expected: `ok` con valor `True`. Y una ruta inexistente:

```powershell
try { Invoke-RestMethod http://localhost:3000/api/nada } catch { $_.ErrorDetails.Message }
```
Expected: `{"error":"Ruta no encontrada"}`.

- [ ] **Step 15: Commit**

```bash
git add backend tsconfig.json eslint.config.ts
git commit -m "feat(backend): esqueleto de Express con health check"
```

---

### Task B2: Base de datos (schema de Prisma)

**Files:**
- Create: `backend/prisma/schema.prisma`, `backend/src/db.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` de `backend/.env` (Task B1).
- Produces: `prisma` (cliente único, `src/db.ts`) y los modelos `User`, `Routine`, `Day`, `Block`, `Item`, `WorkoutLog`, `WorkoutLogExercise` con el enum `Role` (`ALUMNO` | `ENTRENADOR`). Los campos usan los mismos nombres que los tipos de la app (`firstName`, `emergencyPhone`...).

- [ ] **Step 1: Crear `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Role {
  ALUMNO
  ENTRENADOR
}

model User {
  id                Int          @id @default(autoincrement())
  role              Role         @default(ALUMNO)
  email             String       @unique
  dni               String       @unique
  passwordHash      String
  firstName         String
  lastName          String
  gender            String
  age               Int
  weight            Float
  height            Float
  phone             String
  emergencyPhone    String
  healthInsurance   String       @default("-")
  contraindications String       @default("Ninguna")
  goal              String
  routineId         Int?
  routine           Routine?     @relation(fields: [routineId], references: [id], onDelete: SetNull)
  workoutLogs       WorkoutLog[]
  createdAt         DateTime     @default(now())
}

model Routine {
  id    Int    @id @default(autoincrement())
  name  String @default("Mi Rutina")
  days  Day[]
  users User[]
}

model Day {
  id        Int     @id @default(autoincrement())
  routineId Int
  name      String
  position  Int
  routine   Routine @relation(fields: [routineId], references: [id], onDelete: Cascade)
  blocks    Block[]

  @@index([routineId])
}

model Block {
  id       Int    @id @default(autoincrement())
  dayId    Int
  position Int
  day      Day    @relation(fields: [dayId], references: [id], onDelete: Cascade)
  items    Item[]

  @@index([dayId])
}

// Un ítem es un ejercicio o un descanso. type decide qué columnas se usan:
//   "exercise": exerciseId, series, repetitions, weightKg, comments
//   "rest":     restTime, restUnit
model Item {
  id          Int     @id @default(autoincrement())
  blockId     Int
  position    Int
  type        String
  exerciseId  String?
  series      Int?
  repetitions Int?
  weightKg    Float?
  comments    String  @default("")
  restTime    Float?
  restUnit    String?
  block       Block   @relation(fields: [blockId], references: [id], onDelete: Cascade)

  @@index([blockId])
}

model WorkoutLog {
  id        Int                  @id @default(autoincrement())
  userId    Int
  date      String
  createdAt DateTime             @default(now())
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises WorkoutLogExercise[]

  @@index([userId, date])
}

// Copia (snapshot) de cada ejercicio hecho ese día, con su grupo muscular.
model WorkoutLogExercise {
  id          Int        @id @default(autoincrement())
  logId       Int
  exerciseId  String
  muscleGroup String
  log         WorkoutLog @relation(fields: [logId], references: [id], onDelete: Cascade)

  @@index([logId])
}
```

- [ ] **Step 2: Crear `backend/src/db.ts`**

```ts
import { PrismaClient } from '@prisma/client';

// Una sola instancia para todo el servidor.
export const prisma = new PrismaClient();
```

- [ ] **Step 3: Crear la base** (desde `backend/`): genera el cliente de Prisma y crea `prisma/dev.db`

```powershell
npm run db:init
```
Expected: `Generated Prisma Client (v6.x)` y `Your database is now in sync with your Prisma schema.` Si más adelante se cambia el schema, hay que volver a correr este comando (cambiar un campo y no regenerar es la causa más común de "esto antes andaba").

- [ ] **Step 4: Comprobar que existen las tablas** (abre una vista en el navegador; cerrarla con Ctrl+C)

```powershell
npx prisma studio
```
Expected: se ven los modelos `User`, `Routine`, `Day`, `Block`, `Item`, `WorkoutLog` y `WorkoutLogExercise`, todos vacíos.

- [ ] **Step 5: Verificar tipos y commit**

```powershell
npm run typecheck
git add backend/prisma/schema.prisma backend/src/db.ts
git commit -m "feat(backend): schema de Prisma con usuarios, rutinas y registros"
```
Expected: `typecheck` sin salida. El archivo `dev.db` no se sube (está en `backend/.gitignore`).

---

### Task B3: Datos de prueba (seed)

**Files:**
- Create: `backend/prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma` (Task B2) y los datos de `src/data/users.ts`, `routines.ts` y `workoutLogs.ts` de la app (se importan directo; se mueven recién en la tarea C6).
- Produces: la base cargada con 20 usuarios (2 entrenadores y 18 alumnos), 16 rutinas y 189 registros. Todos los usuarios de prueba tienen la contraseña `gymbro123`. Cuentas útiles: alumna `solgaetmank@gmail.com`, entrenador `entrenadormaniana@gmail.com`.

- [ ] **Step 1: Crear `backend/prisma/seed.ts`**

```ts
// Carga en la base los datos de prueba que antes estaban escritos en la app (src/data).
// Es seguro volver a correrlo: vacía las tablas y las vuelve a llenar.
import bcrypt from 'bcryptjs';

import '../src/env';
import { prisma } from '../src/db';
import { routines } from '../../src/data/routines';
import { users } from '../../src/data/users';
import { workoutLogs } from '../../src/data/workoutLogs';

async function main() {
  // Se vacía de los hijos hacia los padres.
  await prisma.workoutLogExercise.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.routine.deleteMany(); // borra en cascada días, bloques e ítems

  for (const routine of routines) {
    await prisma.routine.create({
      data: {
        id: routine.id,
        name: routine.name,
        days: {
          create: routine.days.map((day, dayIndex) => ({
            name: day.name,
            position: dayIndex,
            blocks: {
              create: day.blocks.map((block, blockIndex) => ({
                position: blockIndex,
                items: {
                  create: block.items.map((item, itemIndex) =>
                    item.type === 'exercise'
                      ? {
                          position: itemIndex,
                          type: 'exercise',
                          exerciseId: item.exerciseId,
                          series: Number.parseInt(item.series, 10),
                          repetitions: Number.parseInt(item.repetitions, 10),
                          weightKg: Number.parseFloat(item.weight), // '20 kg' -> 20
                          comments: item.comments,
                        }
                      : {
                          position: itemIndex,
                          type: 'rest',
                          restTime: Number.parseFloat(item.time),
                          restUnit: item.unit,
                        }
                  ),
                },
              })),
            },
          })),
        },
      },
    });
  }

  // Todos los usuarios de prueba comparten contraseña: se hashea una sola vez.
  const hashes = new Map<string, string>();
  for (const user of users) {
    if (!hashes.has(user.password)) {
      hashes.set(user.password, await bcrypt.hash(user.password, 10));
    }
    await prisma.user.create({
      data: {
        id: user.id,
        role: user.isTrainer ? 'ENTRENADOR' : 'ALUMNO',
        email: user.email.toLowerCase(),
        dni: user.dni,
        passwordHash: hashes.get(user.password) ?? '',
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        age: Number.parseInt(user.age, 10), // '23 años' -> 23
        weight: Number.parseFloat(user.weight), // '75.5 kg' -> 75.5
        height: Number.parseFloat(user.height), // '160 cm' -> 160
        phone: user.phone,
        emergencyPhone: user.emergencyPhone,
        healthInsurance: user.healthInsurance,
        contraindications: user.contraindications,
        goal: user.goal,
        routineId: user.id_rutina ?? null,
      },
    });
  }

  for (const log of workoutLogs) {
    await prisma.workoutLog.create({
      data: {
        id: log.id,
        userId: log.userId,
        date: log.date,
        exercises: {
          create: log.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            muscleGroup: exercise.muscleGroup,
          })),
        },
      },
    });
  }

  console.log(
    `Seed listo: ${users.length} usuarios, ${routines.length} rutinas, ${workoutLogs.length} registros.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Cargar los datos**

```powershell
npm run db:seed
```
Expected: `Seed listo: 20 usuarios, 16 rutinas, 189 registros.` Es seguro volver a correrlo: vacía las tablas y las llena de nuevo.

- [ ] **Step 3: Mirar los datos** con `npx prisma studio`: `User` tiene 20 filas y las contraseñas están hasheadas (`passwordHash` empieza con `$2`).

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat(backend): seed con los datos de prueba de la app"
```

---

### Task B4: Registro, login y perfil

**Files:**
- Create: `backend/src/auth.ts`, `backend/src/validation.ts`, `backend/src/serializers.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/me.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Consumes: `prisma` (B2), `config.jwtSecret` (B1).
- Produces:
  - `POST /api/auth/register` y `POST /api/auth/login` → `{ token, user }`.
  - `GET /api/me` → `{ user }`; `GET /api/me/rutina` → `{ routine }`; `GET /api/me/registros?year=&month=` → `{ logs }`; `GET /api/me/dias-entrenados?year=` → `{ days }`.
  - Middlewares `requireAuth` y `requireRole(role)`, helpers `signToken(userId, role)` y `getAuth(res)`; `toPublicUser`, `toApiRoutine`, `toApiLog`, `ROUTINE_INCLUDE`; los esquemas Zod (se usan completos más adelante) y `parseId`, `firstIssue`.

- [ ] **Step 1: Crear `backend/src/auth.ts`**

```ts
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from './config';

export type Role = 'ALUMNO' | 'ENTRENADOR';
export type AuthInfo = { userId: number; role: Role };

// El token guarda el id del usuario (subject) y su rol, y vence a los 7 días.
export function signToken(userId: number, role: Role): string {
  return jwt.sign({ role }, config.jwtSecret, {
    subject: String(userId),
    expiresIn: '7d',
  });
}

// Quién está haciendo el pedido (lo deja cargado requireAuth).
export function getAuth(res: Response): AuthInfo {
  return res.locals.auth as AuthInfo;
}

// Middleware: exige "Authorization: Bearer <token>" válido.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (
      typeof payload === 'string' ||
      !payload.sub ||
      (payload.role !== 'ALUMNO' && payload.role !== 'ENTRENADOR')
    ) {
      throw new Error('payload inválido');
    }
    res.locals.auth = { userId: Number(payload.sub), role: payload.role } satisfies AuthInfo;
    next();
  } catch {
    res.status(401).json({ error: 'La sesión expiró o no es válida' });
  }
}

// Middleware: exige un rol (se usa después de requireAuth).
export function requireRole(role: Role) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (getAuth(res).role !== role) {
      return res.status(403).json({ error: 'No tenés permiso para hacer esto' });
    }
    next();
  };
}
```

- [ ] **Step 2: Crear `backend/src/validation.ts`** (incluye también los esquemas de rutina, check-in y consultas que usan las tareas B5 y B6)

```ts
import { z } from 'zod';

// Convierte un parámetro de la URL en un id válido (o null si no lo es).
export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Primer problema de un esquema, con la ruta del campo (sirve para depurar).
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Datos inválidos';
  return issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
}

// ---------- Registro y login ----------

export const GENDERS = ['Femenino', 'Masculino'] as const;
export const GOALS = ['Salud', 'Bajar de peso', 'Fuerza', 'Tonificar', 'Otro'] as const;

const REQUIRED = 'Completa todos los campos obligatorios';
const NUMBERS = 'Edad, peso y altura deben ser números válidos';
const requiredText = z.string({ error: REQUIRED }).trim().min(1, REQUIRED);

export const registerSchema = z.object({
  firstName: requiredText,
  lastName: requiredText,
  email: z
    .string({ error: REQUIRED })
    .trim()
    .toLowerCase()
    .regex(/^\S+@\S+\.\S+$/, 'El email no es válido'),
  dni: z
    .string({ error: REQUIRED })
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 números, sin puntos'),
  password: z
    .string({ error: REQUIRED })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  gender: z.enum(GENDERS, { error: REQUIRED }),
  age: z.number({ error: NUMBERS }).int(NUMBERS).positive(NUMBERS).max(120, NUMBERS),
  weight: z.number({ error: NUMBERS }).positive(NUMBERS).max(500, NUMBERS),
  height: z.number({ error: NUMBERS }).positive(NUMBERS).max(300, NUMBERS),
  phone: requiredText,
  emergencyPhone: requiredText,
  healthInsurance: z.string().trim().optional(),
  contraindications: z.string().trim().optional(),
  goal: z.enum(GOALS, { error: REQUIRED }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// ---------- Rutina ----------

const exerciseItemSchema = z.object({
  type: z.literal('exercise'),
  exerciseId: z.string().trim().min(1),
  series: z.number().int().min(1).max(100),
  repetitions: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(1000), // en kg; 0 = peso corporal
  comments: z.string().max(500).default(''),
});

const restItemSchema = z.object({
  type: z.literal('rest'),
  time: z.number().min(0).max(1000),
  unit: z.enum(['minutos', 'segundos']),
});

const itemSchema = z.discriminatedUnion('type', [exerciseItemSchema, restItemSchema]);

export const routineSchema = z.object({
  days: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        blocks: z
          .array(z.object({ items: z.array(itemSchema).max(50) }))
          .max(30),
      })
    )
    .max(14),
});

export type RoutineInput = z.infer<typeof routineSchema>;
export type ItemInput = RoutineInput['days'][number]['blocks'][number]['items'][number];

// ---------- Check-in ----------

export const checkinSchema = z.object({
  dayId: z.number().int().positive(),
  qr: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ---------- Consultas ----------

export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
```

- [ ] **Step 3: Crear `backend/src/serializers.ts`**

```ts
import type { Prisma, User } from '@prisma/client';

// Qué se carga al leer una rutina completa, ya ordenada por posición.
export const ROUTINE_INCLUDE = {
  days: {
    orderBy: { position: 'asc' },
    include: {
      blocks: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { position: 'asc' } } },
      },
    },
  },
} satisfies Prisma.RoutineInclude;

type RoutineWithTree = Prisma.RoutineGetPayload<{ include: typeof ROUTINE_INCLUDE }>;

// Lista blanca: solo estos campos salen del servidor (nunca passwordHash).
export function toPublicUser(user: User) {
  return {
    id: user.id,
    role: user.role,
    routineId: user.routineId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dni: user.dni,
    gender: user.gender,
    age: user.age,
    weight: user.weight,
    height: user.height,
    phone: user.phone,
    emergencyPhone: user.emergencyPhone,
    healthInsurance: user.healthInsurance,
    contraindications: user.contraindications,
    goal: user.goal,
  };
}

export function toApiRoutine(routine: RoutineWithTree) {
  return {
    id: routine.id,
    name: routine.name,
    days: routine.days.map((day) => ({
      id: day.id,
      name: day.name,
      blocks: day.blocks.map((block) => ({
        id: block.id,
        items: block.items.map((item) =>
          item.type === 'exercise'
            ? {
                id: item.id,
                type: 'exercise' as const,
                exerciseId: item.exerciseId ?? '',
                series: item.series ?? 0,
                repetitions: item.repetitions ?? 0,
                weight: item.weightKg ?? 0,
                comments: item.comments,
              }
            : {
                id: item.id,
                type: 'rest' as const,
                time: item.restTime ?? 0,
                unit: item.restUnit === 'segundos' ? ('segundos' as const) : ('minutos' as const),
              }
        ),
      })),
    })),
  };
}

type LogWithExercises = Prisma.WorkoutLogGetPayload<{ include: { exercises: true } }>;

export function toApiLog(log: LogWithExercises) {
  return {
    id: log.id,
    userId: log.userId,
    date: log.date,
    exercises: log.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      muscleGroup: exercise.muscleGroup,
    })),
  };
}
```

- [ ] **Step 4: Crear `backend/src/routes/auth.ts`**

```ts
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { signToken } from '../auth';
import { prisma } from '../db';
import { toPublicUser } from '../serializers';
import { firstIssue, loginSchema, registerSchema } from '../validation';

export const authRouter = Router();

// Alta de un alumno. El rol NUNCA viene del cliente: siempre es ALUMNO.
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const data = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        role: 'ALUMNO',
        email: data.email,
        dni: data.dni,
        passwordHash: await bcrypt.hash(data.password, 10),
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        age: data.age,
        weight: data.weight,
        height: data.height,
        phone: data.phone,
        emergencyPhone: data.emergencyPhone,
        healthInsurance: data.healthInsurance || '-',
        contraindications: data.contraindications || 'Ninguna',
        goal: data.goal,
      },
    });
    res.status(201).json({ token: signToken(user.id, user.role), user: toPublicUser(user) });
  } catch (error) {
    // P2002 = violación de un campo único: la base es quien garantiza que no se repitan.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = String(error.meta?.target ?? '');
      return res.status(409).json({
        error: target.includes('dni')
          ? 'Ya existe una cuenta con ese DNI'
          : 'Ya existe una cuenta con ese email',
      });
    }
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Completa email y contraseña' });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

  // Mismo mensaje para "no existe" y "contraseña mal": no se revela cuál fue.
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  res.json({ token: signToken(user.id, user.role), user: toPublicUser(user) });
});
```

- [ ] **Step 5: Crear `backend/src/routes/me.ts`**

```ts
import { Router } from 'express';

import { getAuth } from '../auth';
import { prisma } from '../db';
import { ROUTINE_INCLUDE, toApiLog, toApiRoutine, toPublicUser } from '../serializers';
import { firstIssue, monthQuerySchema, yearQuerySchema } from '../validation';

export const meRouter = Router();

// Mi perfil (sirve para restaurar la sesión al abrir la app).
meRouter.get('/', async (_req, res) => {
  const user = await prisma.user.findUnique({ where: { id: getAuth(res).userId } });
  if (!user) {
    return res.status(401).json({ error: 'La cuenta ya no existe' });
  }
  res.json({ user: toPublicUser(user) });
});

// Mi rutina (null si todavía no tengo).
meRouter.get('/rutina', async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: getAuth(res).userId },
    select: { routineId: true },
  });
  const routine =
    user?.routineId != null
      ? await prisma.routine.findUnique({ where: { id: user.routineId }, include: ROUTINE_INCLUDE })
      : null;

  res.json({ routine: routine ? toApiRoutine(routine) : null });
});

// Mis registros de entrenamiento de un mes: GET /api/me/registros?year=2026&month=8
meRouter.get('/registros', async (req, res) => {
  const parsed = monthQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const { year, month } = parsed.data;
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;

  const logs = await prisma.workoutLog.findMany({
    where: { userId: getAuth(res).userId, date: { startsWith: prefix } },
    include: { exercises: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });

  res.json({ logs: logs.map(toApiLog) });
});

// Días distintos entrenados en un año: GET /api/me/dias-entrenados?year=2026
meRouter.get('/dias-entrenados', async (req, res) => {
  const parsed = yearQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }

  const dates = await prisma.workoutLog.findMany({
    where: { userId: getAuth(res).userId, date: { startsWith: `${parsed.data.year}-` } },
    select: { date: true },
    distinct: ['date'],
  });

  res.json({ days: dates.length });
});
```

- [ ] **Step 6: Conectar las rutas en `backend/src/app.ts`**

```diff
--- a/backend/src/app.ts
+++ b/backend/src/app.ts
@@ -1,6 +1,10 @@
 import cors from 'cors';
 import express, { type NextFunction, type Request, type Response } from 'express';
 
+import { requireAuth } from './auth';
+import { authRouter } from './routes/auth';
+import { meRouter } from './routes/me';
+
 export const app = express();
 
 // Los middlewares van ANTES de las rutas y se ejecutan en el orden en que se registran.
@@ -11,6 +15,9 @@
   res.json({ ok: true });
 });
 
+app.use('/api/auth', authRouter);
+app.use('/api/me', requireAuth, meRouter);
+
 app.use('/api', (_req, res) => {
   res.status(404).json({ error: 'Ruta no encontrada' });
 });
```

- [ ] **Step 7: Verificar tipos y probar** (servidor encendido con `npm run dev` en otra terminal)

```powershell
npm run typecheck
```
Expected: sin salida. Después, en PowerShell:

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"email":"solgaetmank@gmail.com","password":"gymbro123"}'
$r.user.email
$r.user.role
(Invoke-RestMethod http://localhost:3000/api/me -Headers @{ Authorization = "Bearer $($r.token)" }).user.firstName
```
Expected: `solgaetmank@gmail.com`, `ALUMNO` y `Sol`. Sin token:

```powershell
try { Invoke-RestMethod http://localhost:3000/api/me } catch { $_.Exception.Response.StatusCode.value__ }
```
Expected: `401`. Contraseña incorrecta:

```powershell
try { Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"email":"solgaetmank@gmail.com","password":"mal"}' } catch { $_.ErrorDetails.Message }
```
Expected: `{"error":"Email o contraseña incorrectos"}`.

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "feat(backend): registro, login con JWT y perfil"
```

---

### Task B5: Alumnos y rutinas (endpoints del entrenador)

**Files:**
- Create: `backend/src/routes/alumnos.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Consumes: `requireAuth`, `requireRole`, `routineSchema`, `ROUTINE_INCLUDE`, `toApiRoutine`, `toPublicUser`, `parseId`, `firstIssue` (B4).
- Produces: `GET /api/alumnos` → `{ users }` (solo alumnos, sin datos sensibles); `GET /api/alumnos/:id/rutina` → `{ routine }` (`null` si no tiene); `PUT /api/alumnos/:id/rutina` con `{ days }` → `{ routine }` con ids nuevos. El `PUT` reemplaza la rutina completa dentro de una **transacción** y, si el alumno no tenía, la crea y se la asigna. Solo para `ENTRENADOR`.

- [ ] **Step 1: Crear `backend/src/routes/alumnos.ts`**

```ts
import type { Prisma } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../db';
import { ROUTINE_INCLUDE, toApiRoutine, toPublicUser } from '../serializers';
import { firstIssue, parseId, routineSchema, type ItemInput } from '../validation';

// Todas estas rutas son solo para entrenadores (ver app.ts).
export const alumnosRouter = Router();

// Lista de alumnos (la pantalla de búsqueda filtra por texto en el cliente).
alumnosRouter.get('/', async (_req, res) => {
  const alumnos = await prisma.user.findMany({
    where: { role: 'ALUMNO' },
    orderBy: { id: 'asc' },
  });
  res.json({ users: alumnos.map(toPublicUser) });
});

// Rutina de un alumno (null si todavía no tiene).
alumnosRouter.get('/:id/rutina', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El id no es válido' });
  }

  const alumno = await prisma.user.findFirst({
    where: { id, role: 'ALUMNO' },
    select: { routineId: true },
  });
  if (!alumno) {
    return res.status(404).json({ error: 'No existe ese alumno' });
  }

  const routine =
    alumno.routineId !== null
      ? await prisma.routine.findUnique({ where: { id: alumno.routineId }, include: ROUTINE_INCLUDE })
      : null;

  res.json({ routine: routine ? toApiRoutine(routine) : null });
});

function toItemData(item: ItemInput, position: number): Prisma.ItemCreateWithoutBlockInput {
  return item.type === 'exercise'
    ? {
        position,
        type: 'exercise',
        exerciseId: item.exerciseId,
        series: item.series,
        repetitions: item.repetitions,
        weightKg: item.weight,
        comments: item.comments,
      }
    : { position, type: 'rest', restTime: item.time, restUnit: item.unit };
}

// Guarda la rutina completa de un alumno (la reemplaza). Si no tenía, la crea y se la asigna.
// Todo ocurre en una transacción: o se guarda entero, o no se guarda nada.
alumnosRouter.put('/:id/rutina', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El id no es válido' });
  }
  const parsed = routineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: `La rutina no es válida: ${firstIssue(parsed.error)}` });
  }
  const { days } = parsed.data;

  const routine = await prisma.$transaction(async (tx) => {
    const alumno = await tx.user.findFirst({
      where: { id, role: 'ALUMNO' },
      select: { routineId: true },
    });
    if (!alumno) {
      return null;
    }

    let routineId = alumno.routineId;
    if (routineId === null) {
      const created = await tx.routine.create({ data: {} });
      routineId = created.id;
      await tx.user.update({ where: { id }, data: { routineId } });
    }

    await tx.routine.update({
      where: { id: routineId },
      data: {
        days: {
          deleteMany: {}, // borra los días anteriores (y, en cascada, sus bloques e ítems)
          create: days.map((day, dayIndex) => ({
            name: day.name,
            position: dayIndex,
            blocks: {
              create: day.blocks.map((block, blockIndex) => ({
                position: blockIndex,
                items: { create: block.items.map((item, itemIndex) => toItemData(item, itemIndex)) },
              })),
            },
          })),
        },
      },
    });

    return tx.routine.findUniqueOrThrow({ where: { id: routineId }, include: ROUTINE_INCLUDE });
  });

  if (!routine) {
    return res.status(404).json({ error: 'No existe ese alumno' });
  }
  res.json({ routine: toApiRoutine(routine) });
});
```

- [ ] **Step 2: Conectar la ruta en `backend/src/app.ts`**

```diff
--- a/backend/src/app.ts
+++ b/backend/src/app.ts
@@ -1,7 +1,8 @@
 import cors from 'cors';
 import express, { type NextFunction, type Request, type Response } from 'express';
 
-import { requireAuth } from './auth';
+import { requireAuth, requireRole } from './auth';
+import { alumnosRouter } from './routes/alumnos';
 import { authRouter } from './routes/auth';
 import { meRouter } from './routes/me';
 
@@ -17,6 +18,7 @@
 
 app.use('/api/auth', authRouter);
 app.use('/api/me', requireAuth, meRouter);
+app.use('/api/alumnos', requireAuth, requireRole('ENTRENADOR'), alumnosRouter);
 
 app.use('/api', (_req, res) => {
   res.status(404).json({ error: 'Ruta no encontrada' });
```

- [ ] **Step 3: Verificar tipos y probar** (servidor reiniciado; `npm run dev` lo reinicia solo al guardar)

```powershell
npm run typecheck
$t = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"email":"entrenadormaniana@gmail.com","password":"gymbro123"}'
(Invoke-RestMethod http://localhost:3000/api/alumnos -Headers @{ Authorization = "Bearer $($t.token)" }).users.Count
```
Expected: `typecheck` sin salida y `18` (los 20 usuarios menos los 2 entrenadores). Una alumna no puede entrar:

```powershell
$a = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body '{"email":"solgaetmank@gmail.com","password":"gymbro123"}'
try { Invoke-RestMethod http://localhost:3000/api/alumnos -Headers @{ Authorization = "Bearer $($a.token)" } } catch { $_.Exception.Response.StatusCode.value__ }
```
Expected: `403`.

- [ ] **Step 4: Commit**

```bash
git add backend/src
git commit -m "feat(backend): alumnos y guardado de rutinas para entrenadores"
```

---

### Task B6: Check-in con QR y prueba de punta a punta

**Files:**
- Create: `backend/src/catalog.ts`, `backend/src/geo.ts`, `backend/src/routes/checkins.ts`, `backend/test/smoke.test.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Consumes: `GYM` (B1), `prisma` (B2), `checkinSchema`, `toApiLog`, `getAuth`, `firstIssue` (B4).
- Produces: `POST /api/checkins` con `{ dayId, qr, latitude, longitude }` → `201 { log }`. Valida el QR y la distancia (150 m), exige que el día sea de la rutina **de ese alumno**, y arma el registro con los ejercicios del día, sus grupos musculares (desde el catálogo externo, cacheado) y la fecha de hoy **en horario de Argentina**. Solo para `ALUMNO`. Responde 503 si el catálogo externo no responde.

- [ ] **Step 1: Crear `backend/src/geo.ts`**

```ts
type Coordinates = { latitude: number; longitude: number };

// Fórmula de Haversine: distancia en metros entre dos puntos sobre una esfera.
export function getDistanceInMeters(first: Coordinates, second: Coordinates): number {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fecha de hoy como 'YYYY-MM-DD' en la zona horaria dada (no en UTC).
export function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
```

- [ ] **Step 2: Crear `backend/src/catalog.ts`**

```ts
// El servidor consulta el mismo catálogo de ejercicios que la app para saber
// a qué grupo muscular pertenece cada ejercicio (así no se lo cree al cliente).
const CATALOG_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json';

// Misma tabla que src/services/exercisesApi.ts de la app.
const MUSCLE_GROUPS: Record<string, string> = {
  abs: 'Abdomen',
  pectorals: 'Pecho',
  'serratus-anterior': 'Pecho',
  lats: 'Espalda',
  'upper-back': 'Espalda',
  traps: 'Espalda',
  spine: 'Espalda',
  'levator-scapulae': 'Espalda',
  delts: 'Hombro',
  biceps: 'Bíceps',
  forearms: 'Bíceps',
  triceps: 'Tríceps',
  glutes: 'Glúteos',
  quads: 'Pierna',
  hamstrings: 'Pierna',
  calves: 'Pierna',
  adductors: 'Pierna',
  abductors: 'Pierna',
  cardio: 'Cardio',
};

type CatalogMap = Map<string, string>; // id del ejercicio -> grupo muscular

let cache: Promise<CatalogMap> | null = null;

async function loadCatalog(): Promise<CatalogMap> {
  const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Catálogo de ejercicios no disponible (${response.status})`);
  }
  const data = (await response.json()) as { exercises: { id: string; muscle: string }[] };
  return new Map(
    data.exercises.map((exercise) => [exercise.id, MUSCLE_GROUPS[exercise.muscle] ?? exercise.muscle])
  );
}

// Se descarga una sola vez; si falla, el próximo pedido vuelve a intentarlo.
export function getCatalog(): Promise<CatalogMap> {
  if (!cache) {
    cache = loadCatalog().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
```

- [ ] **Step 3: Crear `backend/src/routes/checkins.ts`**

```ts
import { Router } from 'express';

import { getAuth } from '../auth';
import { getCatalog } from '../catalog';
import { GYM } from '../config';
import { prisma } from '../db';
import { getDistanceInMeters, todayInTimeZone } from '../geo';
import { toApiLog } from '../serializers';
import { checkinSchema, firstIssue } from '../validation';

// Solo alumnos (ver app.ts).
export const checkinsRouter = Router();

// Registra un entrenamiento. El cliente manda solo QUÉ día hizo y DÓNDE está;
// los ejercicios, los grupos musculares y la fecha los decide el servidor.
checkinsRouter.post('/', async (req, res) => {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const { dayId, qr, latitude, longitude } = parsed.data;

  if (qr !== GYM.qr) {
    return res.status(400).json({ error: 'Este código no corresponde a Gymbro' });
  }

  const distance = getDistanceInMeters({ latitude, longitude }, GYM);
  if (distance > GYM.radiusMeters) {
    return res.status(400).json({
      error: `Estás lejos del gimnasio (a ${Math.round(distance)} m). Acercate para registrar.`,
    });
  }

  const { userId } = getAuth(res);

  // El día tiene que pertenecer a la rutina de ESTE alumno.
  const day = await prisma.day.findFirst({
    where: { id: dayId, routine: { users: { some: { id: userId } } } },
    include: {
      blocks: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!day) {
    return res.status(404).json({ error: 'No encontramos ese día en tu rutina' });
  }

  const exerciseIds = day.blocks
    .flatMap((block) => block.items)
    .filter((item) => item.type === 'exercise')
    .map((item) => item.exerciseId)
    .filter((exerciseId): exerciseId is string => exerciseId !== null);

  if (exerciseIds.length === 0) {
    return res.status(400).json({ error: 'Ese día no tiene ejercicios para registrar' });
  }

  let catalog;
  try {
    catalog = await getCatalog();
  } catch {
    return res
      .status(503)
      .json({ error: 'No se pudo consultar el catálogo de ejercicios. Probá de nuevo en un rato.' });
  }

  if (exerciseIds.some((exerciseId) => !catalog.has(exerciseId))) {
    return res.status(422).json({ error: 'Hay ejercicios del día que no están en el catálogo' });
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId,
      date: todayInTimeZone(GYM.timeZone),
      exercises: {
        create: exerciseIds.map((exerciseId) => ({
          exerciseId,
          muscleGroup: catalog.get(exerciseId) ?? '',
        })),
      },
    },
    include: { exercises: true },
  });

  res.status(201).json({ log: toApiLog(log) });
});
```

- [ ] **Step 4: Conectar la ruta en `backend/src/app.ts`**

```diff
--- a/backend/src/app.ts
+++ b/backend/src/app.ts
@@ -4,6 +4,7 @@
 import { requireAuth, requireRole } from './auth';
 import { alumnosRouter } from './routes/alumnos';
 import { authRouter } from './routes/auth';
+import { checkinsRouter } from './routes/checkins';
 import { meRouter } from './routes/me';
 
 export const app = express();
@@ -19,6 +20,7 @@
 app.use('/api/auth', authRouter);
 app.use('/api/me', requireAuth, meRouter);
 app.use('/api/alumnos', requireAuth, requireRole('ENTRENADOR'), alumnosRouter);
+app.use('/api/checkins', requireAuth, requireRole('ALUMNO'), checkinsRouter);
 
 app.use('/api', (_req, res) => {
   res.status(404).json({ error: 'Ruta no encontrada' });
```

- [ ] **Step 5: Crear la prueba de punta a punta `backend/test/smoke.test.ts`**

```ts
// Prueba de humo de punta a punta contra el servidor YA ENCENDIDO.
// Antes: npm run db:seed (deja la base en un estado conocido) y npm run dev (en otra terminal).
// Después: npm run smoke
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const BASE = process.env.API_URL ?? 'http://localhost:3000';
const GYM = { latitude: -34.6127955, longitude: -58.3661936 };
const PASSWORD = 'gymbro123';

type ApiResult = { status: number; body: any };

async function api(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResult> {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function login(email: string, password = PASSWORD): Promise<ApiResult> {
  return api('/api/auth/login', { method: 'POST', body: { email, password } });
}

const unique = String(Date.now());
const newStudent = {
  firstName: 'Prueba',
  lastName: 'Humo',
  email: `humo.${unique}@example.com`,
  dni: unique.slice(-8),
  password: 'secreta123',
  gender: 'Femenino',
  age: 30,
  weight: 62.5,
  height: 165,
  phone: '3794000000',
  emergencyPhone: '3794000001',
  healthInsurance: '',
  contraindications: '',
  goal: 'Salud',
};

const routineBody = {
  days: [
    {
      name: 'Día 1',
      blocks: [
        {
          items: [
            { type: 'exercise', exerciseId: 'abs/45-side-bend', series: 4, repetitions: 10, weight: 0, comments: '' },
            { type: 'rest', time: 1.5, unit: 'minutos' },
            { type: 'exercise', exerciseId: 'glutes/dumbbell-lunge', series: 3, repetitions: 12, weight: 6.5, comments: 'Por pierna' },
          ],
        },
      ],
    },
  ],
};

describe('API de Gymbro', () => {
  let studentToken = '';
  let studentId = 0;
  let trainerToken = '';
  let dayId = 0;
  let emptyDayId = 0;

  it('responde /api/health', async () => {
    const res = await api('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
  });

  describe('autenticación', () => {
    it('rechaza una contraseña incorrecta con 401', async () => {
      const res = await login('solgaetmank@gmail.com', 'incorrecta');
      assert.equal(res.status, 401);
    });

    it('inicia sesión como alumna de prueba y no devuelve el hash', async () => {
      const res = await login('solgaetmank@gmail.com');
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, 'ALUMNO');
      assert.ok(res.body.token);
      assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
    });

    it('exige token en /api/me', async () => {
      assert.equal((await api('/api/me')).status, 401);
      const { body } = await login('solgaetmank@gmail.com');
      const me = await api('/api/me', { token: body.token });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.email, 'solgaetmank@gmail.com');
    });

    it('registra un alumno nuevo (201) con valores por defecto', async () => {
      const res = await api('/api/auth/register', { method: 'POST', body: newStudent });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.role, 'ALUMNO');
      assert.equal(res.body.user.healthInsurance, '-');
      assert.equal(res.body.user.contraindications, 'Ninguna');
      assert.equal(res.body.user.routineId, null);
      studentToken = res.body.token;
      studentId = res.body.user.id;
    });

    it('rechaza email y DNI repetidos con 409', async () => {
      const sameEmail = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, dni: '11111111' },
      });
      assert.equal(sameEmail.status, 409);
      assert.match(sameEmail.body.error, /email/);

      const sameDni = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, email: `otro.${unique}@example.com` },
      });
      assert.equal(sameDni.status, 409);
      assert.match(sameDni.body.error, /DNI/);
    });

    it('valida los datos del registro con 400', async () => {
      const badDni = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, dni: '12.345.678' },
      });
      assert.equal(badDni.status, 400);
      assert.match(badDni.body.error, /DNI/);

      const noBody = await api('/api/auth/register', { method: 'POST', body: {} });
      assert.equal(noBody.status, 400);
    });

    it('ignora un rol enviado por el cliente (siempre ALUMNO)', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, email: `rol.${unique}@example.com`, dni: String(Number(unique.slice(-8)) + 1).padStart(8, '1'), role: 'ENTRENADOR' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.role, 'ALUMNO');
    });
  });

  describe('permisos', () => {
    it('un alumno no puede ver la lista de alumnos (403)', async () => {
      const res = await api('/api/alumnos', { token: studentToken });
      assert.equal(res.status, 403);
    });

    it('el entrenador lista alumnos sin datos sensibles', async () => {
      const res = await login('entrenadormaniana@gmail.com');
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, 'ENTRENADOR');
      trainerToken = res.body.token;

      const list = await api('/api/alumnos', { token: trainerToken });
      assert.equal(list.status, 200);
      assert.ok(list.body.users.some((u: any) => u.email === 'solgaetmank@gmail.com'));
      assert.ok(list.body.users.every((u: any) => u.role === 'ALUMNO'));
      assert.ok(!JSON.stringify(list.body).includes('passwordHash'));
    });

    it('el entrenador no puede hacer check-in (403)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: trainerToken,
        body: { dayId: 1, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 403);
    });
  });

  describe('rutinas', () => {
    it('el alumno nuevo todavía no tiene rutina', async () => {
      const res = await api('/api/me/rutina', { token: studentToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.routine, null);
    });

    it('el entrenador lee la rutina de un alumno de prueba', async () => {
      const res = await api('/api/alumnos/2/rutina', { token: trainerToken });
      assert.equal(res.status, 200);
      assert.ok(res.body.routine.days.length > 0);
      const firstItem = res.body.routine.days[0].blocks[0].items[0];
      assert.equal(typeof firstItem.id, 'number');
    });

    it('rechaza una rutina inválida con 400 y no guarda nada', async () => {
      const bad = structuredClone(routineBody);
      (bad.days[0].blocks[0].items[0] as any).series = 0;
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: bad,
      });
      assert.equal(res.status, 400);
      const after = await api('/api/me/rutina', { token: studentToken });
      assert.equal(after.body.routine, null);
    });

    it('crea la rutina del alumno nuevo (la asigna) y la devuelve ordenada', async () => {
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: routineBody,
      });
      assert.equal(res.status, 200);
      const items = res.body.routine.days[0].blocks[0].items;
      assert.deepEqual(
        items.map((i: any) => i.type),
        ['exercise', 'rest', 'exercise']
      );
      assert.equal(items[1].time, 1.5);
      assert.equal(items[2].weight, 6.5);
      dayId = res.body.routine.days[0].id;

      const mine = await api('/api/me/rutina', { token: studentToken });
      assert.equal(mine.body.routine.days[0].id, dayId);
    });

    it('al guardar de nuevo reemplaza los días anteriores', async () => {
      const twoDays = { days: [routineBody.days[0], { name: 'Día 2', blocks: [] }] };
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: twoDays,
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.routine.days.length, 2);
      assert.notEqual(res.body.routine.days[0].id, dayId); // los ids se regeneran
      dayId = res.body.routine.days[0].id;
      emptyDayId = res.body.routine.days[1].id;
    });

    it('devuelve 404 para un alumno inexistente y 400 para un id inválido', async () => {
      assert.equal((await api('/api/alumnos/99999/rutina', { token: trainerToken })).status, 404);
      assert.equal((await api('/api/alumnos/abc/rutina', { token: trainerToken })).status, 400);
    });
  });

  describe('check-in y estadísticas', () => {
    it('rechaza un QR que no es de Gymbro (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'OTRO_QR', ...GYM },
      });
      assert.equal(res.status, 400);
    });

    it('rechaza estar lejos del gimnasio (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'GYMBRO_CHECKIN_V1', latitude: -34.7, longitude: -58.5 },
      });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /lejos/);
    });

    it('rechaza registrar un día sin ejercicios (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId: emptyDayId, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /sin ejercicios|no tiene ejercicios/);
    });

    it('no deja registrar un día de la rutina de otro alumno (404)', async () => {
      const sols = await api('/api/alumnos/2/rutina', { token: trainerToken });
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId: sols.body.routine.days[0].id, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 404);
    });

    it('registra el entrenamiento (201) con ejercicios y grupos del servidor', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      assert.deepEqual(
        res.body.log.exercises.map((e: any) => e.exerciseId),
        ['abs/45-side-bend', 'glutes/dumbbell-lunge']
      );
      assert.deepEqual(
        res.body.log.exercises.map((e: any) => e.muscleGroup),
        ['Abdomen', 'Glúteos']
      );
      assert.match(res.body.log.date, /^\d{4}-\d{2}-\d{2}$/);
    });

    it('lista los registros del mes y cuenta los días entrenados', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const logs = await api(`/api/me/registros?year=${year}&month=${month}`, { token: studentToken });
      assert.equal(logs.status, 200);
      assert.equal(logs.body.logs.length, 1);

      const days = await api(`/api/me/dias-entrenados?year=${year}`, { token: studentToken });
      assert.equal(days.status, 200);
      assert.equal(days.body.days, 1);

      const invalid = await api('/api/me/registros?year=abc&month=13', { token: studentToken });
      assert.equal(invalid.status, 400);
    });

    it('los datos de prueba tienen historial (alumna de prueba)', async () => {
      const { body } = await login('solgaetmank@gmail.com');
      const res = await api('/api/me/registros?year=2026&month=8', { token: body.token });
      assert.equal(res.status, 200);
      assert.ok(res.body.logs.length > 0);
    });
  });

  it('devuelve JSON en rutas inexistentes y en JSON inválido', async () => {
    const missing = await api('/api/nada');
    assert.equal(missing.status, 404);

    const broken = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ no es json',
    });
    assert.equal(broken.status, 400);
    assert.ok((await broken.json()).error);
  });
});
```

- [ ] **Step 6: Correr todo.** Primero verificar los tipos y dejar la base en un estado conocido; después encender el servidor **en otra terminal** (necesita internet: consulta el catálogo de ejercicios) y recién entonces correr la prueba:

```powershell
npm run typecheck
npm run db:seed
# en otra terminal, y dejarlo encendido:
npm run dev
# de vuelta en esta terminal:
npm run smoke
```
Expected: `typecheck` sin salida y, al final de `smoke`: `ℹ tests 25`, `ℹ pass 25`, `ℹ fail 0`. Cada corrida crea 2 o 3 alumnos nuevos de prueba; `npm run db:seed` deja la base limpia otra vez.

- [ ] **Step 7: Commit**

```bash
git add backend
git commit -m "feat(backend): check-in con QR y prueba de punta a punta"
```

---

### Task C1: Cliente, capa de API y conexión con el celular

**Files:**
- Create: `src/types/index.ts`, `src/services/api.ts`, `src/services/session.ts`, `.env.local`
- Modify: `package.json` (lo hace el comando de instalación)

**Interfaces:**
- Consumes: la API del backend (B4 a B6) y `EXPO_PUBLIC_API_URL`.
- Produces: los tipos `User`, `RegistrationData`, `Routine*`, `WorkoutLog` (`src/types`); la clase `ApiError` (`status`, `message`; `status 0` = sin conexión); `setAuthToken(token)`, `setUnauthorizedHandler(fn)`; y las funciones `login`, `register`, `getMe`, `getMyRoutine`, `getMyLogs(year, month /*1-12*/)`, `getTrainedDays(year)`, `createCheckin({ dayId, qr, latitude, longitude })`, `getAlumnos`, `getAlumnoRoutine(userId)`, `saveAlumnoRoutine(userId, days)`; y `loadToken`, `saveToken`, `clearToken` (`src/services/session.ts`).

- [ ] **Step 1: Instalar el almacenamiento seguro** (desde la raíz del proyecto, con `expo install` para que elija la versión compatible con el SDK 57)

```powershell
npx expo install expo-secure-store
```
Expected: se agrega `expo-secure-store` a `package.json`.

- [ ] **Step 2: Crear `src/types/index.ts`**

```ts
// Tipos que comparten las pantallas. Reflejan lo que devuelve el servidor
// una vez pasado por los adaptadores de src/services/api.ts.

export type User = {
  id: number;
  isTrainer: boolean;
  id_rutina?: number | null;
  name: string;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  gender: string;
  age: string;
  weight: string;
  height: string;
  phone: string;
  emergencyPhone: string;
  healthInsurance: string;
  contraindications: string;
  goal: string;
};

// Lo que completa el formulario de registro (la contraseña viaja solo al registrarse).
export type RegistrationData = Omit<
  User,
  'id' | 'isTrainer' | 'id_rutina' | 'name' | 'initials'
> & {
  password: string;
  confirmPassword?: string;
};

export type ExerciseRoutineItem = {
  id: number;
  type: 'exercise';
  exerciseId: string;
  series: string;
  repetitions: string;
  weight: string;
  comments: string;
};

export type RestRoutineItem = {
  id: number;
  type: 'rest';
  time: string;
  unit: 'minutos' | 'segundos';
};

export type RoutineItem = ExerciseRoutineItem | RestRoutineItem;

export type RoutineBlock = {
  id: number;
  items: RoutineItem[];
};

export type RoutineDay = {
  id: number;
  name: string;
  blocks: RoutineBlock[];
};

export type Routine = {
  id: number;
  name: string;
  days: RoutineDay[];
};

export type WorkoutExercise = {
  exerciseId: string;
  muscleGroup: string;
};

export type WorkoutLog = {
  id: number;
  userId: number;
  date: string;
  exercises: WorkoutExercise[];
};
```

- [ ] **Step 3: Crear `src/services/session.ts`**

```ts
// Guarda el token de la sesión en el almacenamiento seguro del teléfono
// (Keychain en iOS, Keystore en Android). En la versión web no está disponible:
// ahí la sesión simplemente no se recuerda al cerrar la pestaña.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gymbro_token';

export async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento seguro: la sesión dura hasta cerrar la app.
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nada que borrar.
  }
}
```

- [ ] **Step 4: Crear `src/services/api.ts`**

```ts
// Conexión con el servidor de Gymbro (backend/). Las pantallas no llaman a fetch:
// usan estas funciones, que devuelven los mismos tipos que ya usaba la app.
import type {
  RegistrationData,
  Routine,
  RoutineDay,
  User,
  WorkoutLog,
} from '../types';

// En un celular real hay que usar la IP de la PC (ver .env.local), no "localhost".
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number; // 0 = no hubo respuesta (sin conexión o timeout)

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// El token de la sesión y el aviso de "sesión vencida" los maneja AuthContext.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisá tu conexión.', 0);
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Con token y 401: la sesión venció o ya no es válida.
    if (response.status === 401 && authToken) {
      onUnauthorized?.();
    }
    throw new ApiError(data?.error ?? `Error del servidor (${response.status})`, response.status);
  }

  return data as T;
}

// ---------- Adaptadores: del formato del servidor al que usan las pantallas ----------

type ApiUser = {
  id: number;
  role: 'ALUMNO' | 'ENTRENADOR';
  routineId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  phone: string;
  emergencyPhone: string;
  healthInsurance: string;
  contraindications: string;
  goal: string;
};

type ApiItem =
  | {
      id: number;
      type: 'exercise';
      exerciseId: string;
      series: number;
      repetitions: number;
      weight: number;
      comments: string;
    }
  | { id: number; type: 'rest'; time: number; unit: 'minutos' | 'segundos' };

type ApiRoutine = {
  id: number;
  name: string;
  days: { id: number; name: string; blocks: { id: number; items: ApiItem[] }[] }[];
};

// El servidor guarda números; las pantallas muestran "23 años", "75.5 kg", "160 cm".
function adaptUser(user: ApiUser): User {
  return {
    id: user.id,
    isTrainer: user.role === 'ENTRENADOR',
    id_rutina: user.routineId,
    name: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dni: user.dni,
    gender: user.gender,
    age: `${user.age} años`,
    weight: `${user.weight} kg`,
    height: `${user.height} cm`,
    phone: user.phone,
    emergencyPhone: user.emergencyPhone,
    healthInsurance: user.healthInsurance,
    contraindications: user.contraindications,
    goal: user.goal,
  };
}

function adaptRoutine(routine: ApiRoutine): Routine {
  return {
    id: routine.id,
    name: routine.name,
    days: routine.days.map((day) => ({
      id: day.id,
      name: day.name,
      blocks: day.blocks.map((block) => ({
        id: block.id,
        items: block.items.map((item) =>
          item.type === 'exercise'
            ? {
                id: item.id,
                type: 'exercise' as const,
                exerciseId: item.exerciseId,
                series: String(item.series),
                repetitions: String(item.repetitions),
                weight: `${item.weight} kg`,
                comments: item.comments,
              }
            : {
                id: item.id,
                type: 'rest' as const,
                time: String(item.time),
                unit: item.unit,
              }
        ),
      })),
    })),
  };
}

// Al guardar: de los textos de las pantallas a los números que valida el servidor.
function toApiDays(days: RoutineDay[]) {
  return days.map((day) => ({
    name: day.name,
    blocks: day.blocks.map((block) => ({
      items: block.items.map((item) =>
        item.type === 'exercise'
          ? {
              type: 'exercise' as const,
              exerciseId: item.exerciseId,
              series: Number(item.series),
              repetitions: Number(item.repetitions),
              weight: Number.parseFloat(item.weight), // '20 kg' -> 20
              comments: item.comments,
            }
          : {
              type: 'rest' as const,
              time: Number(item.time),
              unit: item.unit,
            }
      ),
    })),
  }));
}

// ---------- Sesión ----------

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { token: data.token, user: adaptUser(data.user) };
}

export async function register(form: RegistrationData) {
  const data = await request<{ token: string; user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      dni: form.dni,
      password: form.password,
      gender: form.gender,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
      phone: form.phone,
      emergencyPhone: form.emergencyPhone,
      healthInsurance: form.healthInsurance,
      contraindications: form.contraindications,
      goal: form.goal,
    },
  });
  return { token: data.token, user: adaptUser(data.user) };
}

export async function getMe(): Promise<User> {
  const data = await request<{ user: ApiUser }>('/api/me');
  return adaptUser(data.user);
}

// ---------- Alumno ----------

export async function getMyRoutine(): Promise<Routine | null> {
  const data = await request<{ routine: ApiRoutine | null }>('/api/me/rutina');
  return data.routine ? adaptRoutine(data.routine) : null;
}

// month: 1 a 12
export async function getMyLogs(year: number, month: number): Promise<WorkoutLog[]> {
  const data = await request<{ logs: WorkoutLog[] }>(
    `/api/me/registros?year=${year}&month=${month}`
  );
  return data.logs;
}

export async function getTrainedDays(year: number): Promise<number> {
  const data = await request<{ days: number }>(`/api/me/dias-entrenados?year=${year}`);
  return data.days;
}

export async function createCheckin(input: {
  dayId: number;
  qr: string;
  latitude: number;
  longitude: number;
}): Promise<WorkoutLog> {
  const data = await request<{ log: WorkoutLog }>('/api/checkins', {
    method: 'POST',
    body: input,
  });
  return data.log;
}

// ---------- Entrenador ----------

export async function getAlumnos(): Promise<User[]> {
  const data = await request<{ users: ApiUser[] }>('/api/alumnos');
  return data.users.map(adaptUser);
}

export async function getAlumnoRoutine(userId: number): Promise<Routine | null> {
  const data = await request<{ routine: ApiRoutine | null }>(`/api/alumnos/${userId}/rutina`);
  return data.routine ? adaptRoutine(data.routine) : null;
}

export async function saveAlumnoRoutine(userId: number, days: RoutineDay[]): Promise<Routine> {
  const data = await request<{ routine: ApiRoutine }>(`/api/alumnos/${userId}/rutina`, {
    method: 'PUT',
    body: { days: toApiDays(days) },
  });
  return adaptRoutine(data.routine);
}
```

- [ ] **Step 5: Crear `.env.local` en la raíz** con la dirección del servidor (Expo la expone a la app porque empieza con `EXPO_PUBLIC_`; el `.gitignore` ya ignora `.env*.local`). Elegir **una** según dónde se prueba:

```text
# Celular real (misma red Wi-Fi que la PC): la IP de la PC en la red, no localhost
EXPO_PUBLIC_API_URL=http://192.168.0.117:3000

# Emulador de Android:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# Simulador de iOS o web:
# EXPO_PUBLIC_API_URL=http://localhost:3000
```
Después de cambiar este archivo hay que reiniciar Expo limpiando la caché: `npx expo start -c`.

- [ ] **Step 6: Verificar los tipos**

```powershell
npx tsc --noEmit
```
Expected: sin salida (sin errores).

- [ ] **Step 7: Probar que el celular llega al servidor** (Review Focus 1). Con el backend encendido (`npm run dev`), abrir en el **navegador del celular**, conectado a la misma red Wi-Fi: `http://192.168.0.117:3000/api/health`.
Expected: `{"ok":true}`. Si no responde, ver la tabla de problemas frecuentes al final de este plan (firewall y dirección IP son las causas más comunes).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/types src/services
git commit -m "feat(app): capa de API, tipos y almacenamiento del token"
```
(`.env.local` no se agrega: está ignorado.)

---

### Task C2: Sesión real (login, registro y sesión recordada)

**Files:**
- Modify (reescribir): `src/context/AuthContext.tsx`
- Modify: `app/index.tsx`, `src/components/PrimaryButton.tsx`, `src/screens/login.tsx`, `src/screens/signup.tsx`

**Interfaces:**
- Consumes: `login`, `register`, `getMe`, `setAuthToken`, `setUnauthorizedHandler`, `ApiError` (C1); `loadToken`, `saveToken`, `clearToken` (C1).
- Produces: `useAuth()` devuelve `{ user, loading, login, register, logout }`. `login` y `register` son **asíncronos** y devuelven `{ ok, error? }`. `loading` es `true` hasta que se intentó recuperar la sesión guardada. Si el servidor responde 401 con una sesión abierta, la sesión se cierra sola. `PrimaryButton` acepta `disabled`.

- [ ] **Step 1: Reemplazar el contenido de `src/context/AuthContext.tsx`** por:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ApiError,
  getMe,
  login as apiLogin,
  register as apiRegister,
  setAuthToken,
  setUnauthorizedHandler,
} from '../services/api';
import { clearToken, loadToken, saveToken } from '../services/session';
import type { RegistrationData, User } from '../types';

// Guarda al usuario logueado y ofrece login/register/logout a toda la app
type AuthResult = { ok: boolean; error?: string };
type AuthContextValue = {
  user: User | null;
  loading: boolean; // true mientras se recupera la sesión guardada al abrir la app
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegistrationData) => Promise<AuthResult>;
  logout: () => void;
};

// Crea un contexto para la autenticación, que contiene el usuario actual y funciones de login/register/logout.
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: '' }),
  register: async () => ({ ok: false, error: '' }),
  logout: () => {},
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

// Proveedor de autenticación que envuelve la aplicación y proporciona el contexto de autenticación a sus hijos.
export function AuthProvider({ children }: PropsWithChildren) {
  // Usuario de la sesión actual (null = nadie logueado)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cierra la sesión: olvida el token y vuelve al login (AppNavigator cambia solo).
  const logout = useCallback(() => {
    setAuthToken(null);
    clearToken();
    setUser(null);
  }, []);

  // Si el servidor responde 401 con una sesión abierta (token vencido), se cierra sola.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Al abrir la app: si quedó un token guardado, se pide el perfil para restaurar la sesión.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const token = await loadToken();
        if (!token) return;
        setAuthToken(token);
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch (error) {
        setAuthToken(null);
        // Token vencido o inválido: se descarta. Si solo falló la red, se conserva para el próximo intento.
        if (error instanceof ApiError && error.status === 401) await clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pide al servidor validar email + contraseña. Guarda el token y deja la sesión abierta.
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await apiLogin(email.trim(), password);
      setAuthToken(result.token);
      await saveToken(result.token);
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, 'No se pudo iniciar sesión') };
    }
  };

  // Crea un alumno nuevo en el servidor (que valida email y DNI repetidos) y lo deja logueado.
  const register = async (data: RegistrationData): Promise<AuthResult> => {
    try {
      const result = await apiRegister(data);
      setAuthToken(result.token);
      await saveToken(result.token);
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, 'No se pudo crear la cuenta') };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Acceso rápido: const { user, loading, login, register, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Editar `src/components/PrimaryButton.tsx`** (agrega la prop `disabled`)

```diff
--- a/src/components/PrimaryButton.tsx
+++ b/src/components/PrimaryButton.tsx
@@ -2,15 +2,21 @@
 
 // title: el texto que se muestra dentro del botón (string). Ej: "Iniciar Sesión", "Registrarme".
 // onPress: la función que se ejecuta cuando el usuario toca el botón
+// disabled: bloquea el toque y atenúa el botón (ej: mientras se espera la respuesta del servidor)
 
 type PrimaryButtonProps = {
   title: string;
   onPress: () => void;
+  disabled?: boolean;
 };
 
-export default function PrimaryButton({ title, onPress }: PrimaryButtonProps) {
+export default function PrimaryButton({ title, onPress, disabled = false }: PrimaryButtonProps) {
   return (
-    <TouchableOpacity style={styles.button} onPress={onPress}>
+    <TouchableOpacity
+      style={[styles.button, disabled && styles.buttonDisabled]}
+      onPress={onPress}
+      disabled={disabled}
+    >
       <Text style={styles.text}>{title}</Text>
     </TouchableOpacity>
   );
@@ -27,6 +33,10 @@
     marginTop: 10,
   },
 
+  buttonDisabled: {
+    opacity: 0.6,
+  },
+
   text: {
     color: '#111111',
     fontSize: 17,
```

- [ ] **Step 3: Editar `app/index.tsx`** (muestra un indicador mientras se recupera la sesión)

```diff
--- a/app/index.tsx
+++ b/app/index.tsx
@@ -1,5 +1,6 @@
 import { NavigationContainer } from '@react-navigation/native';
 import { createNativeStackNavigator } from '@react-navigation/native-stack';
+import { ActivityIndicator, View } from 'react-native';
 import { SafeAreaProvider } from 'react-native-safe-area-context';
 
 import { AuthProvider, useAuth } from '../src/context/AuthContext';
@@ -17,7 +18,23 @@
 function AppNavigator() {
   // useAuth() lee el AuthContext. Cuando login()/logout() cambian "user" con
   // setUser, este componente se re-renderiza solo, sin llamarlo manualmente.
-  const { user } = useAuth(); // guarda quien esta logueado
+  const { user, loading } = useAuth(); // guarda quien esta logueado
+
+  // Mientras se recupera la sesión guardada no se sabe si mostrar login o tabs.
+  if (loading) {
+    return (
+      <View
+        style={{
+          flex: 1,
+          alignItems: 'center',
+          justifyContent: 'center',
+          backgroundColor: '#101010',
+        }}
+      >
+        <ActivityIndicator size="large" color="#FFC107" />
+      </View>
+    );
+  }
 
   return (
     <Stack.Navigator screenOptions={{ headerShown: false }}>
```

- [ ] **Step 4: Editar `src/screens/login.tsx`**

```diff
--- a/src/screens/login.tsx
+++ b/src/screens/login.tsx
@@ -26,16 +26,19 @@
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
+  const [submitting, setSubmitting] = useState(false); // true mientras se espera al servidor
 
-  // Valida que no haya campos vacíos y luego las credenciales.
+  // Valida que no haya campos vacíos y luego pide al servidor validar las credenciales.
   // Si son correctas, el navegador cambia de pantalla solo.
-  const handleLogin = () => {
+  const handleLogin = async () => {
     if (!email.trim() || !password) {
       setError('Completa email y contraseña');
       return;
     }
 
-    const result = login(email, password);
+    setSubmitting(true);
+    const result = await login(email, password);
+    setSubmitting(false);
     if (!result.ok) setError(result.error ?? '');
   };
 
@@ -106,7 +109,11 @@
         {error !== '' && <Text style={styles.error}>{error}</Text>}
 
         {/* Botón */}
-        <PrimaryButton title="Iniciar Sesión" onPress={handleLogin} />
+        <PrimaryButton
+          title={submitting ? 'Ingresando…' : 'Iniciar Sesión'}
+          onPress={handleLogin}
+          disabled={submitting}
+        />
 
         {/* Registro */}
         <View style={styles.registerContainer}>
```

- [ ] **Step 5: Editar `src/screens/signup.tsx`**

```diff
--- a/src/screens/signup.tsx
+++ b/src/screens/signup.tsx
@@ -92,6 +92,7 @@
   // Lo que el usuario escribe y el mensaje de error a mostrar
   const [form, setForm] = useState(EMPTY_FORM);
   const [error, setError] = useState('');
+  const [submitting, setSubmitting] = useState(false); // true mientras se espera al servidor
 
   // Devuelve la función que actualiza un campo y borra el error anterior
   const setField = (field: keyof RegistrationForm) => (value: string) => {
@@ -101,7 +102,7 @@
 
   // Valida el formulario y luego crea el usuario.
   // Si se crea bien, queda logueado y el navegador cambia de pantalla solo.
-  const handleRegister = () => {
+  const handleRegister = async () => {
     if (REQUIRED_FIELDS.some((field) => !form[field].trim())) {
       setError('Completa todos los campos obligatorios');
       return;
@@ -137,13 +138,16 @@
       return;
     }
 
-    // register es la función del AuthContext que hace las validaciones de email/DNI duplicado y llama addUser + setUser.
-    const result = register({
+    // register es la función del AuthContext: le pide al servidor crear la cuenta (el servidor
+    // valida email/DNI duplicado) y, si sale bien, deja la sesión abierta.
+    setSubmitting(true);
+    const result = await register({
       ...form,
       age: String(age),
       weight: String(weight),
       height: String(height),
     });
+    setSubmitting(false);
     if (!result.ok) setError(result.error ?? '');
   };
 
@@ -339,7 +343,11 @@
           {error !== '' && <Text style={styles.error}>{error}</Text>}
 
           {/* Botón */}
-          <PrimaryButton title="Registrarme" onPress={handleRegister} />
+          <PrimaryButton
+            title={submitting ? 'Registrando…' : 'Registrarme'}
+            onPress={handleRegister}
+            disabled={submitting}
+          />
 
         </View>
 
```

- [ ] **Step 6: Verificar tipos y lint**

```powershell
npx tsc --noEmit
npx eslint app src
```
Expected: `tsc` sin salida. ESLint solo muestra la advertencia que ya existía en `editar_rutina_trainer.tsx` (`confirmExitWithUnsavedChanges`).

- [ ] **Step 7: Prueba manual en el celular** (backend encendido, `npx expo start -c`)
  - Iniciar sesión con `solgaetmank@gmail.com` y contraseña `gymbro123`: entra a las pestañas del alumno.
  - Cerrar la app por completo y volver a abrirla: **entra sin pedir login** (sesión recordada).
  - Cerrar sesión desde Mi Cuenta y volver a entrar con el entrenador `entrenadormaniana@gmail.com`: ve las pestañas del entrenador.
  - Contraseña incorrecta: aparece "Email o contraseña incorrectos".
  - Registrar un alumno nuevo: queda con sesión abierta. Intentar registrar el mismo email otra vez: "Ya existe una cuenta con ese email".
  - **Doble toque** (Review Focus 4): tocar "Registrarme" dos veces rápido: el botón pasa a "Registrando…" y se crea **una sola** cuenta.
  - **Servidor apagado** (Review Focus 2): apagar el backend e intentar iniciar sesión: aparece "No se pudo conectar con el servidor. Revisá tu conexión.", sin cerrarse ni quedar en blanco.
  - **Sesión vencida** (Review Focus 3): con la app abierta y con sesión iniciada, cambiar `JWT_SECRET` en `backend/.env`, reiniciar el backend y navegar a otra pestaña que pida datos o cerrar y reabrir la app: vuelve al login solo.

- [ ] **Step 8: Commit**

```bash
git add app src
git commit -m "feat(app): login y registro contra el servidor con sesión recordada"
```

---

### Task C3: Rutina del alumno y contador de inicio

**Files:**
- Modify: `src/screens/mi_rutina_user.tsx`, `src/screens/home_user.tsx`

**Interfaces:**
- Consumes: `getMyRoutine`, `getTrainedDays`, `ApiError` (C1); `useFocusEffect` de React Navigation.
- Produces: ambas pantallas piden los datos al servidor **cada vez que recuperan el foco** (así reflejan cambios hechos por el entrenador o un check-in nuevo) y muestran carga y error con reintento.

- [ ] **Step 1: Editar `src/screens/mi_rutina_user.tsx`**

```diff
--- a/src/screens/mi_rutina_user.tsx
+++ b/src/screens/mi_rutina_user.tsx
@@ -1,3 +1,5 @@
+import { useFocusEffect } from '@react-navigation/native';
+import { useCallback, useState } from 'react';
 import {
   ScrollView,
   StyleSheet,
@@ -10,9 +12,10 @@
 import { SafeAreaView } from 'react-native-safe-area-context';
 import { useAuth } from '../context/AuthContext';
 import { useExercises } from '../context/ExercisesContext';
-import { getRoutineById } from '../data/routines';
 import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
 import type { UserRoutineStackParamList } from '../navigation/types';
+import { ApiError, getMyRoutine } from '../services/api';
+import type { Routine } from '../types';
 
 export default function UserRoutineScreen({
   navigation,
@@ -22,12 +25,32 @@
   // Ejercicios traídos de la API (ver ExercisesContext)
   const { getExerciseById, loading } = useExercises();
 
+  // Rutina asignada al usuario logueado, pedida al servidor (puede no tener)
+  const [routine, setRoutine] = useState<Routine | null>(null);
+  const [loadingRoutine, setLoadingRoutine] = useState(true);
+  const [routineError, setRoutineError] = useState('');
+
+  const loadRoutine = useCallback(async () => {
+    setRoutineError('');
+    try {
+      setRoutine(await getMyRoutine());
+    } catch (e) {
+      setRoutineError(e instanceof ApiError ? e.message : 'No se pudo cargar tu rutina.');
+    } finally {
+      setLoadingRoutine(false);
+    }
+  }, []);
+
+  // Se vuelve a pedir cada vez que la pantalla recupera el foco (el entrenador pudo cambiarla)
+  useFocusEffect(
+    useCallback(() => {
+      loadRoutine();
+    }, [loadRoutine])
+  );
+
   // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
   if (!user) return null;
 
-  // Rutina asignada al usuario logueado (puede no tener)
-  const routine = getRoutineById(user.id_rutina);
-
   const formatRestUnit = (time: string, unit: string) =>
     Number(time) === 1 ? unit.slice(0, -1) : unit;
 
@@ -60,9 +83,19 @@
       >
 
         <Text style={styles.screenTitle}>
-          {routine ? routine.name : 'Todavía no tenés una rutina asignada'}
+          {routine
+            ? routine.name
+            : loadingRoutine
+              ? 'Cargando tu rutina…'
+              : routineError || 'Todavía no tenés una rutina asignada'}
         </Text>
 
+        {routineError !== '' && (
+          <TouchableOpacity onPress={loadRoutine}>
+            <Text style={styles.retryText}>Tocá para reintentar</Text>
+          </TouchableOpacity>
+        )}
+
 
         {/* ======================================================
             DÍAS
@@ -225,6 +258,13 @@
 
   /* TÍTULO */
 
+  retryText: {
+    color: '#FFC107',
+    fontSize: 15,
+    fontWeight: '600',
+    marginBottom: 12,
+  },
+
   screenTitle: {
     color: '#FFFFFF',
     fontSize: 26,
```

- [ ] **Step 2: Editar `src/screens/home_user.tsx`**

```diff
--- a/src/screens/home_user.tsx
+++ b/src/screens/home_user.tsx
@@ -12,7 +12,7 @@
 
 import { SafeAreaView } from 'react-native-safe-area-context';
 import { useAuth } from '../context/AuthContext';
-import { getWorkoutDaysThisYear } from '../data/workoutLogs';
+import { getTrainedDays } from '../services/api';
 import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
 import type { CompositeScreenProps } from '@react-navigation/native';
 import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
@@ -43,11 +43,23 @@
     }
   };
 
+  // Cada vez que la pantalla recupera el foco se vuelve a pedir el contador al servidor
   useFocusEffect(
     useCallback(() => {
-      setWorkoutDaysThisYear(
-        userId != null ? getWorkoutDaysThisYear(userId) : 0
-      );
+      if (userId == null) return undefined;
+
+      let cancelled = false; // evita actualizar el estado si ya se salió de la pantalla
+      getTrainedDays(new Date().getFullYear())
+        .then((days) => {
+          if (!cancelled) setWorkoutDaysThisYear(days);
+        })
+        .catch(() => {
+          // Si falla la red se deja el último valor mostrado.
+        });
+
+      return () => {
+        cancelled = true;
+      };
     }, [userId])
   );
 
```

- [ ] **Step 3: Verificar tipos y lint**

```powershell
npx tsc --noEmit
npx eslint app src
```
Expected: sin errores nuevos.

- [ ] **Step 4: Prueba manual** (alumna `solgaetmank@gmail.com`)
  - Pestaña "Rutinas": aparecen sus días y bloques (los mismos que antes). Tocar "Ver día" abre el detalle como siempre.
  - Pestaña "Inicio": el contador de "Días entrenados este año" muestra un número (los datos de prueba están en agosto, así que dependerá del año actual del teléfono).
  - Alumno recién registrado (sin rutina): "Rutinas" dice "Todavía no tenés una rutina asignada".
  - **Servidor apagado** (Review Focus 2): en "Rutinas" aparece el error con "Tocá para reintentar"; al encender el servidor y tocarlo, carga.

- [ ] **Step 5: Commit**

```bash
git add src/screens/mi_rutina_user.tsx src/screens/home_user.tsx
git commit -m "feat(app): rutina y contador del alumno desde el servidor"
```

---

### Task C4: Check-in con QR y estadísticas

**Files:**
- Modify: `src/screens/escanear_qr_user.tsx`, `src/screens/estadisticas_user.tsx`

**Interfaces:**
- Consumes: `createCheckin`, `getMyRoutine`, `getMyLogs`, `ApiError` (C1); `POST /api/checkins` y `GET /api/me/registros` (B4, B6).
- Produces: el QR ya **no calcula** ejercicios, grupos musculares ni fecha: manda `{ dayId, qr, latitude, longitude }` y el servidor decide. Estadísticas pide los registros del mes elegido (y se vuelve a pedir al cambiar de mes y al recuperar el foco, lo que además resuelve que no se vean datos viejos).

- [ ] **Step 1: Editar `src/screens/escanear_qr_user.tsx`**

```diff
--- a/src/screens/escanear_qr_user.tsx
+++ b/src/screens/escanear_qr_user.tsx
@@ -1,6 +1,6 @@
 import { CameraView, useCameraPermissions } from 'expo-camera';
 import * as Location from 'expo-location';
-import { useRef, useState } from 'react';
+import { useEffect, useRef, useState } from 'react';
 import {
   Alert,
   Linking,
@@ -16,12 +16,11 @@
 
 import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 import PrimaryButton from '../components/PrimaryButton';
-import { useAuth } from '../context/AuthContext';
 import { useExercises } from '../context/ExercisesContext';
-import { getRoutineById, type RoutineDay } from '../data/routines';
-import { addWorkoutLog, type WorkoutExercise } from '../data/workoutLogs';
 import type { AppStackParamList } from '../navigation/types';
+import { ApiError, createCheckin, getMyRoutine } from '../services/api';
 import type { Exercise } from '../services/exercisesApi';
+import type { Routine, RoutineDay } from '../types';
 
 const QR_GYMBRO = 'GYMBRO_CHECKIN_V1';
 const GYM_LOCATION = {
@@ -84,11 +83,35 @@
   const [dayPickerVisible, setDayPickerVisible] = useState(false);
   const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
   const scanProcessed = useRef(false);
-  const { user } = useAuth();
   const { getExerciseById, loading, error } = useExercises();
-  const routine = user ? getRoutineById(user.id_rutina) : null;
+  // Posición validada al escanear: se manda al servidor, que la vuelve a validar.
+  const [coords, setCoords] = useState<Coordinates | null>(null);
+  const [submitting, setSubmitting] = useState(false);
+  // Rutina del alumno, pedida al servidor al abrir la pantalla
+  const [routine, setRoutine] = useState<Routine | null>(null);
+  const [routineLoading, setRoutineLoading] = useState(true);
+  const [routineError, setRoutineError] = useState('');
   const selectedDay = routine?.days.find((day) => day.id === selectedDayId);
 
+  useEffect(() => {
+    let cancelled = false;
+    getMyRoutine()
+      .then((result) => {
+        if (!cancelled) setRoutine(result);
+      })
+      .catch((e) => {
+        if (!cancelled) {
+          setRoutineError(e instanceof ApiError ? e.message : 'No se pudo cargar tu rutina.');
+        }
+      })
+      .finally(() => {
+        if (!cancelled) setRoutineLoading(false);
+      });
+    return () => {
+      cancelled = true;
+    };
+  }, []);
+
   const pedirPermiso = () => {
     if (!permission) return;
 
@@ -158,6 +181,7 @@
           return;
         }
 
+        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
         setQrValid(true);
       } catch {
         Alert.alert(
@@ -181,53 +205,31 @@
     );
   };
 
-  const handleSubmit = () => {
-    if (!user || !selectedDay) {
+  // Registra el entrenamiento en el servidor. Se manda solo QUÉ día se hizo y DÓNDE está el alumno:
+  // el servidor valida el QR y la distancia, y decide los ejercicios, los grupos musculares y la fecha.
+  const handleSubmit = async () => {
+    if (!selectedDay || !coords) {
       Alert.alert('Elegí un día', 'Seleccioná el día de la rutina que realizaste.');
       return;
     }
 
-    if (loading || error) {
-      Alert.alert(
-        'Ejercicios no disponibles',
-        'No se pudieron cargar los ejercicios para guardar el entrenamiento.'
-      );
-      return;
-    }
-
-    const exercises = selectedDay.blocks
-      .flatMap((block) => block.items)
-      .filter((item) => item.type === 'exercise')
-      .map((item) => {
-        const exercise = getExerciseById(item.exerciseId);
-        return exercise
-          ? { exerciseId: item.exerciseId, muscleGroup: exercise.muscleGroup }
-          : null;
+    setSubmitting(true);
+    try {
+      await createCheckin({
+        dayId: selectedDay.id,
+        qr: QR_GYMBRO,
+        latitude: coords.latitude,
+        longitude: coords.longitude,
       });
-
-    if (exercises.some((exercise) => !exercise)) {
+    } catch (e) {
+      setSubmitting(false);
       Alert.alert(
-        'Ejercicios no disponibles',
-        'No se pudieron encontrar todos los ejercicios de este día.'
+        'No se pudo registrar',
+        e instanceof ApiError ? e.message : 'Intentá nuevamente.'
       );
       return;
     }
 
-    const today = new Date();
-    const date = [
-      today.getFullYear(),
-      String(today.getMonth() + 1).padStart(2, '0'),
-      String(today.getDate()).padStart(2, '0'),
-    ].join('-');
-
-    addWorkoutLog({
-      userId: user.id,
-      date,
-      exercises: exercises.filter(
-        (exercise): exercise is WorkoutExercise => exercise !== null
-      ),
-    });
-
     navigation.replace('UserTabs', {
       screen: 'mi_rutina_user',
       params: {
@@ -287,7 +289,11 @@
                   </Text>
                 )}
 
-                <PrimaryButton title="Confirmar día" onPress={handleSubmit} />
+                <PrimaryButton
+                  title={submitting ? 'Registrando…' : 'Confirmar día'}
+                  onPress={handleSubmit}
+                  disabled={submitting}
+                />
 
                 <Modal
                   visible={dayPickerVisible}
@@ -331,7 +337,9 @@
               </>
             ) : (
               <Text style={styles.messageText}>
-                No tenés una rutina asignada para elegir un día.
+                {routineLoading
+                  ? 'Cargando tu rutina…'
+                  : routineError || 'No tenés una rutina asignada para elegir un día.'}
               </Text>
             )}
           </ScrollView>
```

- [ ] **Step 2: Editar `src/screens/estadisticas_user.tsx`**

```diff
--- a/src/screens/estadisticas_user.tsx
+++ b/src/screens/estadisticas_user.tsx
@@ -1,4 +1,5 @@
-import { useState } from 'react';
+import { useFocusEffect } from '@react-navigation/native';
+import { useCallback, useState } from 'react';
 import {
   ScrollView,
   StyleSheet,
@@ -9,8 +10,9 @@
 
 import { SafeAreaView } from 'react-native-safe-area-context';
 import { useAuth } from '../context/AuthContext';
-import { getWorkoutLogsByUser, type WorkoutLog } from '../data/workoutLogs';
 import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
+import { ApiError, getMyLogs } from '../services/api';
+import type { WorkoutLog } from '../types';
 
 const MONTH_NAMES = [
   'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
@@ -82,13 +84,41 @@
     month: today.getMonth(),
   });
 
-  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
-  if (!user) return null;
+  // Registros del mes elegido, pedidos al servidor
+  const [monthLogs, setMonthLogs] = useState<WorkoutLog[]>([]);
+  const [loadingLogs, setLoadingLogs] = useState(true);
+  const [loadError, setLoadError] = useState('');
+
+  // Devuelve la función que cancela el pedido (useFocusEffect la usa al salir de la pantalla).
+  const loadLogs = useCallback(() => {
+    let cancelled = false;
+    setLoadingLogs(true);
+    setLoadError('');
+    setMonthLogs([]);
+
+    getMyLogs(selected.year, selected.month + 1) // la API usa meses de 1 a 12
+      .then((logs) => {
+        if (!cancelled) setMonthLogs(logs);
+      })
+      .catch((e) => {
+        if (!cancelled) {
+          setLoadError(e instanceof ApiError ? e.message : 'No se pudieron cargar los registros.');
+        }
+      })
+      .finally(() => {
+        if (!cancelled) setLoadingLogs(false);
+      });
+
+    return () => {
+      cancelled = true;
+    };
+  }, [selected.year, selected.month]);
 
-  const monthPrefix = toDateKey(selected.year, selected.month, 1).slice(0, 7); // 'YYYY-MM'
+  // Se vuelve a pedir al cambiar de mes y cada vez que la pestaña recupera el foco
+  useFocusEffect(loadLogs);
 
-  const userLogs = getWorkoutLogsByUser(user.id);
-  const monthLogs = userLogs.filter((log) => log.date.startsWith(monthPrefix));
+  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
+  if (!user) return null;
 
   function changeMonth(delta: number) {
     const date = new Date(selected.year, selected.month + delta, 1);
@@ -186,11 +216,17 @@
 
         {monthLogs.length === 0 ? (
 
-          // Mes sin registros: en vez de gráficos vacíos, un mensaje
+          // Mes sin registros (o todavía cargando): en vez de gráficos vacíos, un mensaje
           <View style={styles.sectionBox}>
-            <Text style={styles.emptyText}>
-              No hay entrenamientos registrados en este mes.
-            </Text>
+            {loadError !== '' ? (
+              <TouchableOpacity onPress={() => { loadLogs(); }}>
+                <Text style={styles.emptyText}>{loadError} Tocá para reintentar.</Text>
+              </TouchableOpacity>
+            ) : (
+              <Text style={styles.emptyText}>
+                {loadingLogs ? 'Cargando…' : 'No hay entrenamientos registrados en este mes.'}
+              </Text>
+            )}
           </View>
 
         ) : (
```

- [ ] **Step 3: Verificar tipos y lint**

```powershell
npx tsc --noEmit
npx eslint app src
```
Expected: sin errores nuevos.

- [ ] **Step 4: Prueba manual** (alumna con rutina, en el gimnasio o con la ubicación simulada cerca)
  - Escanear un QR con el texto `GYMBRO_CHECKIN_V1` (se puede generar con cualquier sitio que cree códigos QR de texto), elegir un día y confirmar: abre el detalle de ese día.
  - "Inicio": el contador subió. "Estadísticas": el mes actual muestra el entrenamiento y los grupos musculares. **Esto también confirma que Estadísticas ya no muestra datos viejos** (era una duda del estudio).
  - Estando lejos del gimnasio: el servidor responde "Estás lejos del gimnasio (a N m)" y la app lo muestra en una alerta.
  - **Doble toque** (Review Focus 4): tocar "Confirmar día" dos veces rápido: el botón pasa a "Registrando…" y se crea **un solo** registro.
  - **Catálogo caído** (Review Focus 5): cambiar temporalmente la constante `CATALOG_URL` de `backend/src/catalog.ts` por una dirección inválida, reiniciar el backend e intentar un check-in: la app muestra "No se pudo consultar el catálogo de ejercicios. Probá de nuevo en un rato." y no se guarda nada. **Volver a poner la URL original.**

- [ ] **Step 5: Commit**

```bash
git add src/screens/escanear_qr_user.tsx src/screens/estadisticas_user.tsx
git commit -m "feat(app): check-in y estadísticas contra el servidor"
```

---

### Task C5: Entrenador (búsqueda y editor de rutina)

**Files:**
- Modify: `src/navigation/types.ts`, `src/screens/buscar_usuario_trainer.tsx`, `src/screens/editar_rutina_trainer.tsx`

**Interfaces:**
- Consumes: `getAlumnos`, `getAlumnoRoutine`, `saveAlumnoRoutine`, `ApiError` (C1); tipos de `src/types` (C1).
- Produces: la búsqueda trae los alumnos del servidor (y los vuelve a pedir al recuperar el foco). El editor se divide en una pantalla "contenedora" que pide la rutina del alumno y el editor propiamente dicho (`EditRoutineForm`), que arranca con esos días como borrador. **Guardar es asíncrono:** el botón muestra "Guardando…", el borrador pasa a ser lo que el servidor devolvió (ids nuevos) y "Guardar y salir" solo sale si el servidor confirmó.

- [ ] **Step 1: Editar `src/navigation/types.ts`** (los tipos pasan a `src/types`)

```diff
--- a/src/navigation/types.ts
+++ b/src/navigation/types.ts
@@ -1,7 +1,6 @@
 import type { NavigatorScreenParams } from '@react-navigation/native';
 
-import type { RoutineDay } from '../data/routines';
-import type { User } from '../data/users';
+import type { RoutineDay, User } from '../types';
 
 // Cada navigator tiene un tipo ParamList: un diccionario nombreDePantalla → parámetros que recibe.
 
```

- [ ] **Step 2: Editar `src/screens/buscar_usuario_trainer.tsx`**

```diff
--- a/src/screens/buscar_usuario_trainer.tsx
+++ b/src/screens/buscar_usuario_trainer.tsx
@@ -1,4 +1,5 @@
-import { useState } from 'react';
+import { useFocusEffect } from '@react-navigation/native';
+import { useCallback, useState } from 'react';
 import {
   ScrollView,
   StyleSheet,
@@ -9,7 +10,8 @@
 } from 'react-native';
 
 import { SafeAreaView } from 'react-native-safe-area-context';
-import { users } from '../data/users';
+import { ApiError, getAlumnos } from '../services/api';
+import type { User } from '../types';
 import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
 import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 import type { TrainerStackParamList } from '../navigation/types';
@@ -32,10 +34,31 @@
   // Texto escrito en el buscador
   const [filtro, setFiltro] = useState('');
 
+  // Alumnos pedidos al servidor (se vuelven a pedir cada vez que la pantalla recupera el foco)
+  const [alumnos, setAlumnos] = useState<User[]>([]);
+  const [loadingAlumnos, setLoadingAlumnos] = useState(true);
+  const [loadError, setLoadError] = useState('');
+
+  const loadAlumnos = useCallback(async () => {
+    setLoadError('');
+    try {
+      setAlumnos(await getAlumnos());
+    } catch (e) {
+      setLoadError(e instanceof ApiError ? e.message : 'No se pudieron cargar los alumnos.');
+    } finally {
+      setLoadingAlumnos(false);
+    }
+  }, []);
+
+  useFocusEffect(
+    useCallback(() => {
+      loadAlumnos();
+    }, [loadAlumnos])
+  );
+
   // Usuarios que coinciden con lo escrito (nombre, apellido o email), sin importar tildes.
-  // Se excluyen los entrenadores: esta pantalla es solo para buscar usuarios.
-  const usuariosFiltrados = users
-    .filter((user) => !user.isTrainer)
+  // El servidor ya devuelve solo alumnos (los entrenadores no aparecen en esta lista).
+  const usuariosFiltrados = alumnos
     .filter((user) =>
       normalizar(`${user.firstName} ${user.lastName} ${user.email}`).includes(
         normalizar(filtro)
@@ -80,6 +103,18 @@
           contentContainerStyle={styles.list}
         >
 
+          {loadingAlumnos && <Text style={styles.stateText}>Cargando alumnos…</Text>}
+
+          {!loadingAlumnos && loadError !== '' && (
+            <TouchableOpacity onPress={loadAlumnos}>
+              <Text style={styles.stateText}>{loadError} Tocá para reintentar.</Text>
+            </TouchableOpacity>
+          )}
+
+          {!loadingAlumnos && loadError === '' && usuariosFiltrados.length === 0 && (
+            <Text style={styles.stateText}>No se encontraron usuarios.</Text>
+          )}
+
           {usuariosFiltrados.map((user) => {
 
             const isSelected = selectedUser === user.id;
@@ -165,6 +200,15 @@
 
 const styles = StyleSheet.create({
 
+  /* MENSAJES DE ESTADO (cargando, error, sin resultados) */
+
+  stateText: {
+    color: '#999999',
+    fontSize: 15,
+    textAlign: 'center',
+    marginTop: 24,
+  },
+
   /* CONTENEDOR PRINCIPAL */
 
   container: {
```

- [ ] **Step 3: Editar `src/screens/editar_rutina_trainer.tsx`**

```diff
--- a/src/screens/editar_rutina_trainer.tsx
+++ b/src/screens/editar_rutina_trainer.tsx
@@ -1,5 +1,6 @@
 import { useEffect, useRef, useState } from 'react';
 import {
+  ActivityIndicator,
   Alert,
   KeyboardAvoidingView,
   Modal,
@@ -15,16 +16,9 @@
 import { SafeAreaView } from 'react-native-safe-area-context';
 import MoveArrows from '../components/MoveArrows';
 import { useExercises } from '../context/ExercisesContext';
-import {
-  createRoutine,
-  getRoutineById,
-  updateRoutineDays,
-  type ExerciseRoutineItem,
-  type RestRoutineItem,
-  type RoutineDay,
-} from '../data/routines';
-import { setUserRoutine } from '../data/users';
 import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
+import { ApiError, getAlumnoRoutine, saveAlumnoRoutine } from '../services/api';
+import type { ExerciseRoutineItem, RestRoutineItem, RoutineDay } from '../types';
 import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
 import type {
@@ -34,19 +28,75 @@
 
 type MovementDirection = 'up' | 'down';
 
-export default function EditRoutineScreen({
+type EditRoutineProps = NativeStackScreenProps<TrainerStackParamList, 'editar_rutina_trainer'>;
+
+// Pantalla "contenedora": pide la rutina del alumno al servidor y recién cuando llega
+// dibuja el editor, que arranca con esos días como borrador.
+// Un alumno recién registrado todavía no tiene rutina: el servidor la crea al guardar por primera vez.
+export default function EditRoutineScreen(props: EditRoutineProps) {
+  const editedUserId = props.route.params.user.id;
+  const [initialDays, setInitialDays] = useState<RoutineDay[] | null>(null);
+  const [loadError, setLoadError] = useState('');
+  const [attempt, setAttempt] = useState(0); // cambiarlo vuelve a pedir la rutina (botón "Reintentar")
+
+  useEffect(() => {
+    let cancelled = false;
+
+    getAlumnoRoutine(editedUserId)
+      .then((routine) => {
+        if (!cancelled) setInitialDays(routine?.days ?? []);
+      })
+      .catch((e) => {
+        if (!cancelled) {
+          setLoadError(e instanceof ApiError ? e.message : 'No se pudo cargar la rutina.');
+        }
+      });
+
+    return () => {
+      cancelled = true;
+    };
+  }, [editedUserId, attempt]);
+
+  if (initialDays === null) {
+    return (
+      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
+        <View style={styles.loadingBox}>
+          {loadError === '' ? (
+            <ActivityIndicator size="large" color="#FFC107" />
+          ) : (
+            <>
+              <Text style={styles.loadingText}>{loadError}</Text>
+              <TouchableOpacity
+                onPress={() => {
+                  setLoadError('');
+                  setAttempt((n) => n + 1);
+                }}
+              >
+                <Text style={styles.loadingRetry}>Reintentar</Text>
+              </TouchableOpacity>
+            </>
+          )}
+          <TouchableOpacity onPress={() => props.navigation.goBack()}>
+            <Text style={styles.loadingBack}>Volver</Text>
+          </TouchableOpacity>
+        </View>
+      </SafeAreaView>
+    );
+  }
+
+  return <EditRoutineForm {...props} initialDays={initialDays} />;
+}
+
+function EditRoutineForm({
   navigation,
   route,
-}: NativeStackScreenProps<TrainerStackParamList, 'editar_rutina_trainer'>) {
+  initialDays,
+}: EditRoutineProps & { initialDays: RoutineDay[] }) {
   const { isLandscape } = useResponsiveLayout();
   // Ejercicios traídos de la API (ver ExercisesContext)
   const { exercises, getExerciseById, loading, error, retry } = useExercises();
   // Usuario al que se le está editando la rutina (viene de la pantalla de búsqueda)
-  const editedUser = route?.params?.user;
-  // Un alumno recién registrado todavía no tiene rutina: se crea al guardar por primera vez
-  const routine = getRoutineById(editedUser?.id_rutina);
-  // Id de la rutina del alumno (null hasta que se cree), para no crearla dos veces
-  const routineId = useRef(routine?.id ?? null);
+  const editedUser = route.params.user;
 
   // Saca tildes/acentos para que la búsqueda no dependa de escribirlos bien
   const normalizar = (texto: string) =>
@@ -65,12 +115,11 @@
   // DATOS INICIALES DE EJEMPLO
   // ============================================================
 
-  const [days, setDays] = useState<RoutineDay[]>(routine?.days ?? []);
+  const [days, setDays] = useState<RoutineDay[]>(initialDays);
 
   // Foto de lo último guardado, para detectar cambios pendientes
-  const [savedSnapshot, setSavedSnapshot] = useState(() =>
-    JSON.stringify(routine?.days ?? [])
-  );
+  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialDays));
+  const [saving, setSaving] = useState(false); // true mientras se espera la respuesta del servidor
   const hasUnsavedChanges = JSON.stringify(days) !== savedSnapshot;
 
   // Se activa justo antes de salir para que el aviso no se repita
@@ -535,20 +584,31 @@
   // GUARDAR Y AVISO AL SALIR
   // ============================================================
 
-  // Pasa el borrador a datos guardados. Si el alumno no tenía rutina, la crea y se la asigna.
-  const persistRoutine = () => {
-    if (routineId.current === null) {
-      const created = createRoutine(days);
-      setUserRoutine(editedUser.id, created.id);
-      routineId.current = created.id;
-    } else {
-      updateRoutineDays(routineId.current, days);
+  // Envía el borrador al servidor (que lo guarda de una sola vez; si el alumno no tenía rutina,
+  // la crea y se la asigna). Devuelve true si salió bien.
+  const persistRoutine = async (): Promise<boolean> => {
+    if (saving) return false;
+
+    setSaving(true);
+    try {
+      const saved = await saveAlumnoRoutine(editedUser.id, days);
+      // El servidor genera ids nuevos: el borrador pasa a ser exactamente lo guardado.
+      setDays(saved.days);
+      setSavedSnapshot(JSON.stringify(saved.days)); // anota "esto es lo último guardado"
+      return true;
+    } catch (e) {
+      Alert.alert(
+        'No se pudo guardar',
+        e instanceof ApiError ? e.message : 'Intentá nuevamente.'
+      );
+      return false;
+    } finally {
+      setSaving(false);
     }
   };
 
   const saveChanges = () => {
     persistRoutine();
-    setSavedSnapshot(JSON.stringify(days)); // anota "esto es lo último guardado"
   };
 
   // Pregunta qué hacer con los cambios sin guardar antes de confirmar la salida.
@@ -565,9 +625,9 @@
         },
         {
           text: 'Guardar y salir',
-          onPress: () => {
-            persistRoutine();
-            leave();
+          onPress: async () => {
+            // Solo se sale si el servidor confirmó el guardado
+            if (await persistRoutine()) leave();
           },
         },
       ],
@@ -646,13 +706,13 @@
         <TouchableOpacity
           style={[
             styles.saveButton,
-            !hasUnsavedChanges && styles.saveButtonDisabled,
+            (!hasUnsavedChanges || saving) && styles.saveButtonDisabled,
           ]}
-          disabled={!hasUnsavedChanges}
+          disabled={!hasUnsavedChanges || saving}
           onPress={saveChanges}
         >
           <Text style={styles.saveText}>
-            {hasUnsavedChanges ? 'Guardar' : 'Guardado ✓'}
+            {saving ? 'Guardando…' : hasUnsavedChanges ? 'Guardar' : 'Guardado ✓'}
           </Text>
         </TouchableOpacity>
 
@@ -1264,6 +1324,33 @@
     backgroundColor: '#101010',
   },
 
+  loadingBox: {
+    flex: 1,
+    alignItems: 'center',
+    justifyContent: 'center',
+    padding: 24,
+  },
+
+  loadingText: {
+    color: '#999999',
+    fontSize: 16,
+    textAlign: 'center',
+    marginBottom: 12,
+  },
+
+  loadingRetry: {
+    color: '#FFC107',
+    fontSize: 16,
+    fontWeight: '700',
+    marginBottom: 20,
+  },
+
+  loadingBack: {
+    color: '#FFFFFF',
+    fontSize: 16,
+    marginTop: 16,
+  },
+
   scroll: {
     flex: 1,
   },
```

- [ ] **Step 4: Verificar tipos y lint**

```powershell
npx tsc --noEmit
npx eslint app src
```
Expected: `tsc` sin salida; ESLint solo con la advertencia que ya existía en el editor.

- [ ] **Step 5: Prueba manual** (entrenador `entrenadormaniana@gmail.com`)
  - "Buscar Usuario": aparecen los 18 alumnos; la búsqueda por nombre, apellido o email funciona igual que antes. Escribir algo que no existe: "No se encontraron usuarios."
  - "Ver datos": muestra el perfil completo del alumno.
  - "Editar rutina" de una alumna con rutina: aparece cargada. Agregar un ejercicio y un descanso, tocar **Guardar**: el botón pasa a "Guardando…" y luego a "Guardado ✓". Cerrar sesión, entrar como esa alumna: **ve los cambios** en "Rutinas".
  - **Alumno nuevo sin rutina:** registrar un alumno, entrar como entrenador, editar su rutina (empieza vacía), agregar un día, un bloque y un ejercicio, guardar. Entrar como ese alumno: ve su rutina.
  - Hacer un cambio y volver con el botón atrás: aparece el aviso de cambios sin guardar; "Guardar y salir" guarda y sale.
  - **Doble toque en Guardar** (Review Focus 4): se envía un solo pedido.
  - **Servidor apagado** (Review Focus 2): abrir "Editar rutina" muestra "No se pudo conectar..." con "Reintentar" y "Volver"; con cambios hechos, tocar Guardar muestra la alerta "No se pudo guardar" y **el borrador se conserva**.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/types.ts src/screens/buscar_usuario_trainer.tsx src/screens/editar_rutina_trainer.tsx
git commit -m "feat(app): búsqueda de alumnos y editor de rutina contra el servidor"
```

---

### Task C6: Limpieza y entrega

**Files:**
- Move: `src/data/routines.ts`, `src/data/users.ts`, `src/data/workoutLogs.ts` → `backend/prisma/seed-data/`
- Modify: `backend/prisma/seed.ts`
- Create: `backend/README.md`

**Interfaces:**
- Consumes: todo lo anterior. Antes de empezar, **ningún archivo de la app debe importar de `src/data`** (se comprueba en el paso 1).
- Produces: la app sin datos escritos a mano (el bundle deja de cargar ~5.800 líneas de datos de prueba); los datos de prueba pasan a ser exclusivamente de uso del seed; un README para levantar todo desde cero.

- [ ] **Step 1: Comprobar que nada de la app usa `src/data`**

```powershell
git grep -n "/data/" -- app src ":!src/data"
```
Expected: sin resultados. Si aparece alguno, volver a la tarea que corresponde antes de seguir (antes de empezar la integración este comando lista 11 imports de `src/data` que hay que reemplazar).

- [ ] **Step 2: Mover los datos de prueba al backend** (conservan su historial de Git)

```powershell
mkdir backend\prisma\seed-data
git mv src/data/routines.ts backend/prisma/seed-data/routines.ts
git mv src/data/users.ts backend/prisma/seed-data/users.ts
git mv src/data/workoutLogs.ts backend/prisma/seed-data/workoutLogs.ts
```
Las funciones de ayuda que traen esos archivos (`addUser`, `getRoutineById`...) quedan sin uso: no se tocan, porque ahora solo importan los arrays.

- [ ] **Step 3: Actualizar los imports del seed** en `backend/prisma/seed.ts`

```diff
--- a/backend/prisma/seed.ts
+++ b/backend/prisma/seed.ts
@@ -4,9 +4,9 @@
 
 import '../src/env';
 import { prisma } from '../src/db';
-import { routines } from '../../src/data/routines';
-import { users } from '../../src/data/users';
-import { workoutLogs } from '../../src/data/workoutLogs';
+import { routines } from './seed-data/routines';
+import { users } from './seed-data/users';
+import { workoutLogs } from './seed-data/workoutLogs';
 
 async function main() {
   // Se vacía de los hijos hacia los padres.
```

- [ ] **Step 4: Verificar que todo sigue funcionando**

```powershell
npx tsc --noEmit
npx eslint app src
cd backend
npm run typecheck
npm run db:seed
```
Expected: `tsc` y `typecheck` sin salida; ESLint solo con la advertencia que ya existía; `Seed listo: 20 usuarios, 16 rutinas, 189 registros.`

- [ ] **Step 5: Crear `backend/README.md`** (cómo levantar todo desde cero; sirve para la entrega)

````markdown
# Backend de Gymbro

API REST (Express + Prisma + SQLite) de la app Gymbro.

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env        # y completar JWT_SECRET con un valor propio
npm run db:init             # crea la base (prisma/dev.db) y el cliente de Prisma
npm run db:seed             # carga los datos de prueba
npm run dev                 # http://localhost:3000
```

Prueba de punta a punta (con el servidor encendido): `npm run smoke`.

## Cuentas de prueba (contraseña `gymbro123`)

| Rol | Email |
|---|---|
| Alumna | `solgaetmank@gmail.com` |
| Entrenador | `entrenadormaniana@gmail.com` |

## Endpoints

| Método y ruta | Rol | Qué hace |
|---|---|---|
| `GET /api/health` | — | Comprueba que el servidor responde |
| `POST /api/auth/register` | — | Crea un alumno y devuelve `{ token, user }` |
| `POST /api/auth/login` | — | Inicia sesión y devuelve `{ token, user }` |
| `GET /api/me` | cualquiera | Perfil de quien tiene la sesión |
| `GET /api/me/rutina` | cualquiera | Rutina propia (`null` si no tiene) |
| `GET /api/me/registros?year=&month=` | cualquiera | Registros de entrenamiento del mes (mes de 1 a 12) |
| `GET /api/me/dias-entrenados?year=` | cualquiera | Días distintos entrenados en el año |
| `GET /api/alumnos` | entrenador | Lista de alumnos |
| `GET /api/alumnos/:id/rutina` | entrenador | Rutina de un alumno |
| `PUT /api/alumnos/:id/rutina` | entrenador | Guarda (reemplaza) la rutina completa de un alumno |
| `POST /api/checkins` | alumno | Registra un entrenamiento (valida QR, distancia y día) |

Todas, salvo las dos primeras, exigen `Authorization: Bearer <token>`.
````

- [ ] **Step 6: Prueba completa de punta a punta en el celular.** Reiniciar todo desde cero (`npm run db:seed`, `npm run dev` y `npx expo start -c`) y recorrer una vez los dos flujos completos: alumna (login → rutina → día → QR → estadísticas → cerrar sesión) y entrenador (login → buscar → ver datos → editar rutina → guardar → cerrar sesión), más un alumno nuevo (registro → sin rutina → el entrenador le arma una → la ve).

- [ ] **Step 7: Commit y cierre**

```bash
git add -A
git commit -m "chore: mover datos de prueba al backend y agregar README"
```
Cuando la prueba completa pase, integrar la rama en `main` (`git switch main`, `git merge feature/backend-integracion`).

---

## Problemas frecuentes

| Síntoma | Causa habitual | Qué hacer |
|---|---|---|
| `EADDRINUSE :3000` | ya hay otro servidor usando ese puerto | cerrar la otra terminal, o cambiar `PORT` en `backend/.env` (y la URL de `.env.local`) |
| `Falta JWT_SECRET en backend/.env` | no se creó el `.env` | crearlo a partir de `.env.example` (Task B1, paso 7) |
| `Environment variable not found: DATABASE_URL` | falta `backend/.env` | crearlo con `DATABASE_URL="file:./dev.db"` |
| `@prisma/client did not initialize` | no se generó el cliente después de instalar o de tocar el schema | `npm run db:init` |
| La app dice "No se pudo conectar con el servidor" | `EXPO_PUBLIC_API_URL` apunta a `localhost` desde un celular, o a la IP equivocada, o hay otra red Wi-Fi | usar la IP de la PC en la red (`ipconfig`; en esta PC **no** la `192.168.56.1`), misma red en ambos, y reiniciar con `npx expo start -c` |
| El navegador del celular tampoco abre `http://IP:3000/api/health` | el firewall de Windows bloquea el puerto | permitir Node.js en redes privadas, o (PowerShell como administrador): `New-NetFirewallRule -DisplayName "Gymbro API 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private` |
| Cambié `.env.local` y no pasa nada | Expo guarda las variables en caché | `npx expo start -c` |
| `blocked by CORS policy` (solo en la versión web) | `cors()` falta o se registró después de las rutas | debe estar antes de las rutas en `src/app.ts` |
| `Update available prisma 6.x -> 8.x` | aviso de Prisma | **ignorarlo** (el plan usa Prisma 6, como el PDF) |
| `npm run smoke` falla en el check-in con 503 | el servidor no tiene internet para consultar el catálogo | verificar la conexión de la PC |
| Antes de tocar nada | — | probar `/api/health`: si responde, el problema no está en Express |

## Para después (no forma parte de este plan)

Cosas que **no** son necesarias para que todo funcione y que conviene encarar recién con lo anterior terminado y la consigna oficial a la vista. Cada una sale del estudio (bloque 9):

| Tema | Idea | Tamaño |
|---|---|---|
| Aviso de cambios sin guardar del editor | El listener `tabPress` solo cubre la pestaña "Buscar Usuario", no "Mi Cuenta" (documento 13). Probar primero en el celular si realmente pasa y, si es así, avisar también al cambiar de pestaña | chico |
| Temporizador de descanso | Basarlo en la hora de fin (`Date.now()`) y no en contar ticks; mover los efectos fuera del updater | chico |
| Edad | Guardar fecha de nacimiento en vez de edad | mediano |
| Parámetros de navegación | Pasar `userId`/`dayId` y que la pantalla destino cargue (hoy viaja el objeto completo) | mediano |
| Estadísticas | Que el servidor entregue ya agregado el resumen del mes | mediano |
| Entrenador-alumno | Si la consigna pide "mis alumnos": relación y filtro en el servidor | mediano |
| QR rotativo | Código que cambia cada pocos minutos, validado por el servidor | mediano |
| Seguridad | Límite de intentos de login, cabeceras de seguridad, contraseña con más requisitos | chico |
| Edición de ítems y renombrado de días/bloques | Hoy solo se puede borrar y volver a agregar | mediano |
| Confirmación al borrar días/bloques | Aviso o "deshacer" | chico |
| Unificar código repetido | `formatRestUnit`, `normalizar`, nombre del ejercicio, pantallas de cuenta | chico |
| Pasar de SQLite a Postgres | Cambiar `provider` y `DATABASE_URL` en `schema.prisma` | chico |
| Grupos musculares | Los registros de prueba usan el grupo `'Movilidad'` (p. ej. para estiramientos) que el catálogo nunca produce (los nuevos registros los clasifican como `'Pierna'`): decidir si existe `Movilidad` y unificar (documentos 06 y 09) | chico |
| Check-in: ubicación | Mostrar un indicador mientras se obtiene el GPS (hoy la pantalla queda quieta varios segundos) y ponerle un tiempo máximo | chico |
| Defensa oral | Preparar el "viaje del dato" con la tabla de cuatro capas del PDF: "el entrenador guarda una rutina" y "el alumno registra un entrenamiento" | chico |
