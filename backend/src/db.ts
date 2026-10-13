import { PrismaClient } from '@prisma/client';

// Una sola instancia para todo el servidor.
export const prisma = new PrismaClient();
