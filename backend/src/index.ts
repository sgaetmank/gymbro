/*

enciende el servidor 

Importa la aplicación ya armada y le dice que escuche en el puerto de config.ts

*/

import { app } from './app'; // la aplicacion
import { config } from './config'; // el puerto

app.listen(config.port, () => {
  console.log(`Gymbro API escuchando en http://localhost:${config.port}`);
});
