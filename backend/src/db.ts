import { PrismaClient } from '@prisma/client';


/*

PrismaClient abre la conexión con la base. 

Se crea una sola vez y todos los archivos importan esa misma instancia.

Es el único punto de acceso a la base: ningún otro archivo sabe dónde está ni cómo se conecta.

*/
export const prisma = new PrismaClient();
