import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { requireAuth, requireRole } from './auth';
import { alumnosRouter } from './routes/alumnos';
import { authRouter } from './routes/auth';
import { checkinsRouter } from './routes/checkins';
import { meRouter } from './routes/me';

export const app = express();

// Los middlewares van ANTES de las rutas y se ejecutan en el orden en que se registran.
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/me', requireAuth, meRouter);
app.use('/api/alumnos', requireAuth, requireRole('ENTRENADOR'), alumnosRouter);
app.use('/api/checkins', requireAuth, requireRole('ALUMNO'), checkinsRouter);

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
