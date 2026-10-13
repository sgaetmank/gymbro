// Carga backend/.env antes de que nadie lea process.env (Node 20.12+ lo trae incorporado).
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables que ya tenga el sistema.
}
