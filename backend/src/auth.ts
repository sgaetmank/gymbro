import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from './config';

export type Role = 'ALUMNO' | 'ENTRENADOR';
export type AuthInfo = { userId: number; role: Role };

// Crea el token guarda el id del usuario (subject) y su rol, y vence a los 7 días.
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

  // Lee la cabecera Authorization: Bearer <token> y se queda con el token
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  // Si no hay token, no hay sesión iniciada.
  if (!token) {
    return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  }

  try {
    // jwt.verify recalcula la firma y comprueba el vencimiento. Si falla, lanza un error.
    const payload = jwt.verify(token, config.jwtSecret);
    if (
      typeof payload === 'string' ||
      !payload.sub ||
      (payload.role !== 'ALUMNO' && payload.role !== 'ENTRENADOR')
    ) {
      throw new Error('payload inválido');
    }

    // Se guarda { userId, role } en res.locals.auth y se llama a next() (el pedido sigue).
    res.locals.auth = { userId: Number(payload.sub), role: payload.role } satisfies AuthInfo;
    next();


  } catch {
    // Cualquier fallo (firma mala, vencido, mal formado) cae en el catch → 401 "La sesión expiró o no es válida". 
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
