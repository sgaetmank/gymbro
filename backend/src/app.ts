import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { requireAuth, requireRole } from './auth';
import { alumnosRouter } from './routes/alumnos';
import { authRouter } from './routes/auth';
import { checkinsRouter } from './routes/checkins';
import { meRouter } from './routes/me';

// Aplicacion de express
export const app = express();


/* 

MIDDLEWARES

Son funciones (req, res, next) que se ejecutan antes de la ruta y pueden modificar el pedido, cortarlo o dejarlo seguir con next(). 
Se ejecutan en el orden en que se registran.

*/

// Agrega cabeceras que permiten que una página web de otro origen llame a la API
app.use(cors()); // 

//  convierte el body JSON en un objeto en req.body. Sin esto, req.body llega vacío.
// Va antes de las rutas porque las rutas leen req.body, que solo existe después de que ese middleware interpretó el JSON.
app.use(express.json());


// prueba mínima del servidor. Si responde,Express está vivo aunque la base falle.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});


/*
app.use(prefijo, middleware1, middleware2, router) 

significa: "para todo pedido cuya ruta empiece con el prefijo, ejecutá estos en orden".
*/
app.use('/api/auth', authRouter); // entra cualquiera: es donde se obtiene el token
app.use('/api/me', requireAuth, meRouter); // entra cualquier usuario con sesión
app.use('/api/alumnos', requireAuth, requireRole('ENTRENADOR'), alumnosRouter); // Solo entrenadores
app.use('/api/checkins', requireAuth, requireRole('ALUMNO'), checkinsRouter); // Solo alumnos


/*
si el pedido llegó hasta acá, nadie lo atendió. Responde 404 en JSON (si no, Express respondería con una página HTML que la app no sabría leer).
*/
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {

  // Caso 1: express.json() marca el JSON roto con type: 'entity.parse.failed' → se responde 400 con un mensaje claro.
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({ error: 'El cuerpo del pedido no es un JSON válido' });
  }

  // Caso 2 (cualquier otro error): se registra el detalle en la consola del servidor (console.error) y al cliente solo se le dice un mensaje genérico con 500
  console.error(error);
  res.status(500).json({ error: 'Error inesperado del servidor' });
});
