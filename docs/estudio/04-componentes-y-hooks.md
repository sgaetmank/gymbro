# Bloque 5: componentes y hooks compartidos

Archivos: `src/components/PrimaryButton.tsx`, `CustomInput.tsx`, `ProfileDataCard.tsx`, `MoveArrows.tsx`, `ExerciseGif.tsx` y `src/hooks/useResponsiveLayout.ts`.

## 0. Ideas base

- **Componente = función que recibe props y devuelve JSX.** Las props se declaran con un `type` de TypeScript: si falta una obligatoria o tiene el tipo equivocado, no compila.
- **Reutilizar, no repetir.** Cada componente existe porque ese bloque de UI aparece en varias pantallas. Cambiás el estilo en un solo lugar y cambia en todas.
- **Los componentes no saben de datos ni de navegación.** Reciben todo por props, por eso sirven en cualquier pantalla.
- **`StyleSheet.create`** agrupa los estilos fuera del componente, con sintaxis parecida a CSS pero en objetos JS (`backgroundColor`, no `background-color`).

## 1. `PrimaryButton`

```tsx
<PrimaryButton title="Iniciar Sesión" onPress={handleLogin} />
```
- Un `TouchableOpacity` (se atenúa al tocarlo) con un `Text`.
- Dos props: `title` y `onPress`. El botón no sabe qué hace al tocarlo: la pantalla le pasa la función (*inversión de control*).
- Se usa en `login`, `signup` y `escanear_qr_user` (2 veces).
- **Limitación:** no tiene estado deshabilitado ni de carga. Con backend hará falta (evitar doble toque mientras espera la respuesta).

## 2. `CustomInput`

Etiqueta arriba, input abajo y, si es contraseña, un ojito para mostrar u ocultar el texto.

1. **Componente controlado.** El input no guarda lo que se escribe; lo guarda la pantalla padre.
   ```tsx
   value={value}               // lo que muestra: lo manda el padre
   onChangeText={onChangeText} // avisa al padre cada vez que cambia
   ```
   Flujo: escribís → `onChangeText` → el padre hace `setEmail(...)` → re-render → llega el nuevo `value`. El padre siempre conoce el valor (para validar o enviar).
2. **Estado local propio.** `visible` (¿se ve la contraseña?) es un detalle interno, vive en el componente con `useState`.
3. **Renderizado condicional:** `{secureTextEntry && (<TouchableOpacity .../>)}`. El ojito solo existe en campos de contraseña.
4. **`secureTextEntry && !visible`:** el texto se oculta solo si es contraseña **y** el usuario no tocó el ojito.
5. **Tipado reutilizado:** `TextInputProps['autoCapitalize']` toma el tipo directo de React Native.
6. **Valores por defecto** en la desestructuración (`secureTextEntry = false`, `autoCapitalize = 'none'`): por eso son props opcionales (`?`).
7. **Estilos:** `style={[styles.input, secureTextEntry && styles.inputWithIcon]}` (array: los de la derecha se aplican encima; un `false` se ignora). El ojito usa `position: 'absolute'` con `right: 0` y el input agrega `paddingRight: 46` para que el texto no quede debajo.

Se usa en `login` (2 campos) y en `signup` (13 campos).

## 3. `ProfileDataCard`

Recibe un título y una lista de filas `{ icon, label, value }` y las dibuja todas igual.
- **`rows.map(...)`** transforma un array de datos en un array de elementos JSX (patrón estándar para listas).
- **`key={row.label}`:** React necesita una `key` única y estable por elemento para saber cuál cambió, se agregó o se movió. Acá funciona porque las etiquetas no se repiten dentro de una tarjeta; con datos repetibles se usaría un `id`.
- **Padding y márgenes en porcentaje** (`'5.5%'`): relativos al ancho del contenedor.
- Se usa en `mi_cuenta_user` y `mi_cuenta_trainer`. Los valores son los strings del `User` tal cual (`"23 años"`, `"75.5 kg"`); si en la BD se guardan como números, el formateo pasará a hacerse en la pantalla.

## 4. `MoveArrows`

Dos botones (subir/bajar) para reordenar días, bloques y ejercicios en `editar_rutina_trainer`.
- **Props de comportamiento:** `canMoveUp`/`canMoveDown` (¿habilitado?) y `onMoveUp`/`onMoveDown`. El componente solo dibuja y avisa; la lógica de mover vive en la pantalla.
- **`SIZES: Record<'day'|'block'|'item', {...}>`:** una pieza sirve para tres niveles de la jerarquía, cada uno más chico. `Record` obliga a definir todas las claves.
- **`renderButton`:** función interna que evita repetir el JSX para arriba y abajo.
- **Deshabilitado:** `disabled={!enabled}` bloquea el toque; color gris (`#444444`) y fondo distinto lo muestran.
- **Relieve 3D:** cada borde con un color distinto y el inferior más grueso (3px).
- Se usa 3 veces en el editor.

## 5. `ExerciseGif`

Envuelve `expo-image`: `contentFit="contain"` (se ve entero), `transition={200}` (fundido), `aspectRatio: 1` (cuadrado), fondo blanco porque los GIFs de la API lo tienen. Lo usa `ver_dia_x_user`. `expo-image` reproduce GIFs animados en todas las plataformas y los cachea.

## 6. `useResponsiveLayout`

```ts
const { width, height } = useWindowDimensions();
return { width, height, isLandscape: width > height, isWideScreen: width >= 700 };
```
- Un **custom hook** es una función que empieza con `use` y puede llamar a otros hooks; sirve para compartir **lógica** (no UI) entre componentes.
- `useWindowDimensions` se actualiza solo al rotar y re-renderiza el componente con los valores nuevos.
- Las pantallas lo usan como `isLandscape && styles.contentLandscape`.
- Verificado: **`isWideScreen` no lo usa ninguna pantalla**. 11 pantallas usan solo `isLandscape` y una usa `width` e `isLandscape`.

## 7. Observaciones transversales
1. **Colores repetidos a mano:** `#FFC107` aparece 54 veces, además de `#1D1D1D`, `#292929`, etc. No hay archivo de tema/constantes. Mejora de mantenimiento, no de funcionalidad.
2. **Accesibilidad:** los botones no tienen `accessibilityLabel`; un lector de pantalla leería solo "⌂" en los íconos de las tabs.
3. **No hay componente compartido de carga/error:** cada pantalla que depende del catálogo maneja `loading`/`error` por su cuenta.

## 8. Lista para el bloque 9 (continúa la del documento 03)
16. `PrimaryButton`: agregar `disabled`/`loading` para las llamadas de red (login, registro, guardar rutina).
17. Formateo de unidades (`años`, `kg`, `cm`) pasa a la capa de presentación cuando la BD guarde números.
18. Un componente de carga/error compartido simplificaría las pantallas que dependan de la red.

## 9. Preguntas de verificación, con respuestas

### 1. ¿Qué significa que `CustomInput` sea "controlado" y por qué importa?
El valor del campo vive en el **estado de la pantalla padre**, no en el input. El input recibe `value` y avisa cada cambio con `onChangeText`; el padre actualiza su estado y vuelve a pasar el valor nuevo. El input solo muestra lo que el padre le dice.

Importa porque el padre tiene **una única fuente de verdad**: puede validar, limpiar, rellenar, deshabilitar el botón según lo escrito o enviarlo al servidor sin tener que "preguntarle" al input. Si el input guardara su propio texto (no controlado), habría que leerlo a mano y los dos podrían desincronizarse.

### 2. ¿Por qué `PrimaryButton` recibe `onPress` en vez de decidir él qué hacer?
Porque el botón es visual y sirve en lugares distintos: en `login` valida credenciales, en `signup` registra, en el QR confirma el día. Si decidiera él, tendría que conocer todos los casos. Al recibir la función por props, es **reutilizable y desacoplado**: la pantalla (que sabe el contexto) decide qué pasa, y el botón solo cumple el contrato "cuando me toquen, llamo a esta función". Es el mismo principio que `onChangeText` y `onMoveUp`.

### 3. ¿Para qué sirve `key` en `rows.map(...)` y qué pasaría si faltara o se repitiera?
React compara la lista anterior con la nueva y usa la `key` para identificar a cada elemento entre renders: saber cuál es el mismo, cuál es nuevo y cuál ya no está.
- **Si falta:** React avisa con una advertencia y usa el índice como identidad por defecto. Si la lista se reordena o se inserta algo al medio, puede reutilizar el componente equivocado y mezclar estado interno (por ejemplo, un texto escrito que "salta" a otra fila).
- **Si se repite:** dos elementos con la misma identidad; React avisa y puede duplicar u omitir elementos al actualizar.

Debe ser única entre hermanos y estable (no `Math.random()` ni el índice si la lista cambia de orden).

Explicación completa con ejemplo en la sección 10.

### 4. ¿Diferencia entre componente y custom hook? ¿Por qué `useResponsiveLayout` es hook?
- **Componente:** devuelve JSX (algo que se dibuja).
- **Custom hook:** función que empieza con `use`, usa otros hooks y devuelve **datos o funciones**, sin dibujar nada.

`useResponsiveLayout` devuelve `width`, `height`, `isLandscape`, no UI. Lo que comparte es una **lógica** (leer la ventana y derivar la orientación), que cada pantalla usa a su manera. Debe llamarse `use...` porque React aplica las reglas de hooks (solo en el nivel superior de un componente u otro hook, nunca en `if` ni bucles) y las herramientas (ESLint) lo reconocen por el prefijo. Si fuera un componente, cada pantalla tendría que dibujarlo, y no hay nada que dibujar.

### 5. ¿Qué ventaja tiene `style={[a, cond && b]}`?
Permite **combinar un estilo base con uno condicional** sin crear un estilo nuevo para cada combinación. Los estilos de la derecha pisan a los de la izquierda; si la condición es `false`, `cond && b` vale `false` y React Native lo ignora. En `CustomInput`: `[styles.input, secureTextEntry && styles.inputWithIcon]` mantiene un único estilo base y agrega el padding extra solo para contraseñas. La alternativa sería duplicar los estilos o armar objetos a mano con `if`, más largo y más propenso a errores.

## 10. Teoría: las `key` en `.map()`

### El problema que resuelven
Cuando un componente se vuelve a renderizar, React tiene dos listas: la **anterior** y la **nueva**. Tiene que decidir, para cada elemento, si es el mismo de antes, si es nuevo o si desapareció. En una lista los elementos pueden agregarse, borrarse o cambiar de orden, así que no alcanza con mirar la posición. La `key` es la **etiqueta de identidad** que permite reconocer "este elemento es el mismo, aunque se haya movido".

Analogía: un profesor que toma lista identificando a los alumnos por número de asiento se confunde si cambian de lugar; si los identifica por nombre, no.

### Qué se reutiliza realmente
Cada elemento de la lista puede tener **estado interno** (un `useState`, el texto de un input, la posición de scroll). React lo guarda ligado a la identidad del elemento:
- Si decide que "es el mismo", **conserva su estado**.
- Si decide que es otro, lo destruye y crea uno nuevo desde cero.

La `key` determina **a quién le pertenece cada estado**.

### Ejemplo: qué pasa con la key equivocada
Lista de ejercicios, cada fila con un input de comentarios:
```
Fila A: "Press banca"  → comentario escrito: "agarre ancho"
Fila B: "Sentadilla"   → comentario escrito: "pausa abajo"
Fila C: "Remo"         → comentario escrito: ""
```
El entrenador **borra la fila A**.

**Con `key={index}`** (posición):
```
Antes:   [0: Press banca][1: Sentadilla][2: Remo]
Después: [0: Sentadilla ][1: Remo      ]
```
React compara por posición. En la posición 0 "antes había algo, ahora también": lo considera el mismo elemento, actualiza sus datos y **conserva su estado**. El input queda con "agarre ancho", pero la fila ahora muestra "Sentadilla". La posición 2 ya no existe y se destruye. Resultado: **"Sentadilla" aparece con el comentario de "Press banca"**.

**Con `key={item.id}`:** React ve que el id 1 desapareció y que los ids 2 y 3 siguen. Destruye solo la fila 1 y deja las otras con sus propios comentarios.

### Si falta o se repite
- **Falta:** React avisa ("Each child in a list should have a unique key") y usa el índice por defecto, o sea el caso anterior. Funciona mientras la lista no cambie de orden y falla en cuanto cambia.
- **Se repite:** dos hermanos con la misma identidad. React no sabe cuál es cuál y puede duplicar, omitir o confundir elementos al actualizar.

### Reglas para elegir una buena key
1. **Única entre hermanos** del mismo `.map()` (no hace falta que lo sea en toda la app).
2. **Estable:** el mismo elemento debe tener la misma key en cada render. Nunca `Math.random()`: sería una identidad nueva en cada render y React destruiría y recrearía todo cada vez.
3. **Preferentemente un id propio de los datos** (`user.id`, `day.id`).
4. **El índice solo es aceptable** si la lista es estática: nunca se reordena, no se agregan ni quitan elementos y los elementos no tienen estado propio.
5. **Va en el elemento más externo** que se devuelve dentro del `.map()`, no en un hijo.
6. **La `key` no se pasa como prop:** React la usa internamente y el hijo no puede leer `props.key`. Si el hijo necesita el valor, hay que pasarlo con otro nombre (por ejemplo `id={item.id}`).

### Cómo lo hace el código (revisados todos los `key=`)

| Archivo | Key | Evaluación |
|---|---|---|
| `buscar_usuario_trainer`, `editar_rutina_trainer` (días/bloques/ítems), `mi_rutina_user`, `ver_dia_x_user`, `escanear_qr_user` | `user.id`, `day.id`, `block.id`, `item.id` | Correcto: ids propios de los datos |
| `ProfileDataCard` | `row.label` | Correcto mientras las etiquetas no se repitan dentro de una tarjeta |
| `estadisticas_user` (semanas) | `week.from` | Correcto si cada semana tiene un inicio distinto |
| `estadisticas_user` (grupos) | `group` | Correcto: un nombre por grupo muscular |
| `signup` (opciones) | `option` | Correcto si las opciones no se repiten |
| `ver_dia_x_user` (pasos de instrucciones) | `index` | Aceptable: lista estática, sin estado propio, nunca se reordena |

El único uso de índice es el de las instrucciones, y es el caso donde sí es válido.

**El caso crítico es `editar_rutina_trainer`.** Ahí el entrenador agrega, borra y **reordena** días, bloques y ejercicios (con `MoveArrows`), y cada ítem tiene estado propio (inputs de series, repeticiones, peso, comentarios). Es el escenario donde una key por índice rompería la pantalla; usar `item.id` lo evita. Al agregar un elemento nuevo hay que asignarle un id que no choque con los existentes (se analiza al estudiar ese archivo).

### En una línea
La `key` es la identidad de cada elemento de la lista: React la usa para saber a quién pertenece cada estado cuando la lista cambia, por eso debe ser única, estable y, preferentemente, un id real de los datos.
