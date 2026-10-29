# Backend de Gymbro

API REST (Express + Prisma + SQLite) de la app Gymbro. La app nunca toca la base: todo pasa por esta API.

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env        # y completar JWT_SECRET con un valor propio
npm run db:init             # crea la base (prisma/dev.db) y el cliente de Prisma
npm run db:seed             # carga los datos de prueba
npm run dev                 # http://localhost:3000
```

Para generar un `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

> **Cuidado:** `npm run db:seed` **borra todos los datos** (incluidas las cuentas creadas desde la app) y vuelve a cargar los de prueba.

## Probar desde el celular

1. La PC y el celular tienen que estar en la misma red Wi-Fi.
2. Levantar el servidor (`npm run dev`) y la app (`npx expo start`, en la raíz del proyecto).
3. La app detecta sola la IP de la PC. Solo si hace falta forzarla, definir `EXPO_PUBLIC_API_URL` en `.env.local` y reiniciar con `npx expo start -c`.
4. Si el celular no llega al servidor, probar `http://<IP de la PC>:3000/api/health` en el navegador del celular. Si no abre, el firewall de Windows está bloqueando el puerto 3000.

## Pruebas

Con el servidor encendido y la base recién cargada (`npm run db:seed`): `npm run smoke`.
Chequeo de tipos: `npm run typecheck`.

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
| `GET /api/alumnos/activos` | entrenador | Alumnos con una entrada abierta en el gimnasio |
| `GET /api/alumnos/:id/rutina` | entrenador | Rutina de un alumno |
| `PUT /api/alumnos/:id/rutina` | entrenador | Guarda (reemplaza) la rutina completa de un alumno |
| `POST /api/checkins/entrada` | alumno | Registra la entrada con `GYMBRO_CHECKIN_V1` |
| `POST /api/checkins/salida` | alumno | Registra la salida con `GYMBRO_CHECKOUT_V1` |
| `POST /api/checkins` | alumno | Registra un entrenamiento (valida QR, distancia y día) |

Todas, salvo `health`, `register` y `login`, exigen `Authorization: Bearer <token>`.

## Seguridad en pocas líneas

- Las contraseñas se guardan con hash (bcrypt), nunca en texto.
- El token (JWT, 7 días) lleva el rol, y el servidor lo verifica en cada pedido: el rol nunca lo decide la app.
- Las entradas y salidas se guardan como visitas al gimnasio, separadas de los registros de entrenamiento. Se rechazan las entradas duplicadas y las salidas sin entrada abierta.
- El servidor vuelve a validar el check-in (QR, distancia al gimnasio, que el día sea de la rutina del alumno) y calcula él mismo los ejercicios y la fecha.
