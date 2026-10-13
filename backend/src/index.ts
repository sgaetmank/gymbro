import { app } from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Gymbro API escuchando en http://localhost:${config.port}`);
});
