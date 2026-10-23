/*

Carga backend/.env antes de que nadie lea process.env.

Por qué es un archivo aparte: el orden importa. 

env.ts tiene que ejecutarse antes de que alguien lea process.env. 

Los archivos que lo necesitan lo importan en primera línea (import './env' en config.ts y import '../src/env' en seed.ts).

*/


try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables que ya tenga el sistema.
}
