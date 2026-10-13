# Bloque 8c: `mi_cuenta_trainer`

Archivo: `src/screens/mi_cuenta_trainer.tsx` (210 líneas, de las cuales ~100 son lógica y JSX). Es la pantalla de perfil del entrenador y es casi una copia de `mi_cuenta_user` (documento 09).

## 1. Qué hace

Muestra `user.initials`, `user.name` y `user.email`, dos `ProfileDataCard` (Datos Personales y Contacto y Salud) y el botón de cerrar sesión con confirmación (`confirmLogout`). Es de solo lectura.

Todo lo que se explicó en `mi_cuenta_user` aplica igual:
- `if (!user) return null` después de los hooks, por la animación de salida del logout.
- `Alert.alert` con `onPress: logout` (la función, no su ejecución).
- `logout` hace `setUser(null)` y `AppNavigator` desmonta `TrainerTabs`.
- Al cerrar sesión se pierde cualquier borrador del editor (documento 13).

## 2. Diferencias con `mi_cuenta_user`

| | `mi_cuenta_user` | `mi_cuenta_trainer` |
|---|---|---|
| Tarjeta "Objetivos" | Sí (`user.goal`) | **No** |
| Resto (perfil, dos `ProfileDataCard`, logout) | igual | igual |

La única diferencia funcional es la tarjeta de objetivo.

## 3. Cosas a notar
1. **Código duplicado.** `confirmLogout`, el encabezado, el bloque de perfil y las dos tarjetas están escritos dos veces, con las mismas filas y los mismos íconos. Se podría extraer un componente `ProfileScreen` (con una prop como `showGoal`) o, como mínimo, un hook `useConfirmLogout()`. Es el mismo patrón de duplicación que `formatRestUnit`, `normalizar` y el nombre del ejercicio.
2. **Se muestran campos poco pertinentes para un entrenador** (peso, altura, contraindicaciones) porque el modelo usa una única tabla `User` para ambos roles.
3. **No hay forma de crear un entrenador desde la app.** `signup` solo crea alumnos (`addUser` fija `isTrainer: false`); los entrenadores existen únicamente en los datos de prueba.
4. No hay edición de perfil ni de contraseña.

## 4. Lista para el bloque 9 (continúa la del documento 13)
68. Modelo de usuarios: decidir si alumnos y entrenadores comparten tabla (con columnas opcionales para el entrenador) o si el entrenador tiene su propia tabla con menos campos.
69. Alta de entrenadores: como `signup` solo crea alumnos, hace falta una vía para crearlos (script de carga inicial, panel de administración o un campo de rol asignado por un administrador). Nunca debe poder elegirse el rol desde la app pública.
70. Unificar las dos pantallas de cuenta en un componente compartido.

## 5. Preguntas de verificación, con respuestas

### 1. ¿Qué diferencia hay entre `mi_cuenta_user` y `mi_cuenta_trainer`?
Solo la tarjeta "Objetivos" (`user.goal`), que aparece en la del alumno y no en la del entrenador. Todo lo demás (estructura, `ProfileDataCard`, confirmación y cierre de sesión) es idéntico.

### 2. ¿Qué parte es candidata a extraerse y cómo?
Casi todo el archivo. Opciones, de menor a mayor esfuerzo:
- Un hook `useConfirmLogout()` que devuelva la función que abre el `Alert` (elimina las ~12 líneas de `confirmLogout` repetidas).
- Un componente `ProfileScreen` que reciba `user`, un título y una prop booleana (`showGoal`), usado por ambas pantallas.

Beneficio: un cambio (por ejemplo, agregar edición de perfil) se hace en un solo lugar.

### 3. ¿Cómo se crea hoy una cuenta de entrenador y qué implica para la BD?
Hoy no se puede crear desde la app: `addUser` siempre fija `isTrainer: false`, y los dos entrenadores (`Entrenador Mañana`, `Entrenador Tarde`) están escritos directamente en el array `users`. Con una BD hay que decidir cómo se dan de alta: un script de carga inicial, un panel o un administrador. Además, el rol **nunca debe venir del cliente**: el servidor lo asigna. Si el registro público aceptara un campo `isTrainer`, cualquiera podría registrarse como entrenador y acceder a los datos de todos los alumnos.
