# Bloque 8a: `buscar_usuario_trainer` y `ver_datos_trainer`

Archivos: `src/screens/buscar_usuario_trainer.tsx` (369 líneas) y `src/screens/ver_datos_trainer.tsx` (368). Son las dos primeras pantallas del flujo del trainer. Simples en lógica, pero muestran decisiones de modelo de datos que importan para la BD.

## 1. `buscar_usuario_trainer.tsx`

### Estado
```tsx
const [selectedUser, setSelectedUser] = useState<number | null>(null);  // id del alumno seleccionado
const [filtro, setFiltro] = useState('');                               // texto del buscador
```
La lista de resultados **no es estado**: se deriva en cada render.

```tsx
const usuariosFiltrados = users
  .filter((user) => !user.isTrainer)
  .filter((user) => normalizar(`${user.firstName} ${user.lastName} ${user.email}`).includes(normalizar(filtro)));
```
- Excluye a los entrenadores y busca el texto dentro de una cadena que une nombre, apellido y email.
- Lee `users` **directamente** del módulo de datos (documento 01), sin pasar por contexto ni por una función de consulta.
- Con el filtro vacío, `includes('')` es `true` para cualquier texto: se ve la lista completa.
- El `TextInput` usa `onChangeText={setFiltro}`: el setter se pasa directo como handler, porque su firma (`texto => void`) coincide.

### `normalizar`: búsqueda sin tildes
```tsx
texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
```
1. `normalize('NFD')` descompone cada carácter acentuado en la letra base más el acento como carácter separado (`á` pasa a `a` + `´`).
2. El `replace` con la regex elimina esos acentos sueltos (el rango Unicode U+0300 a U+036F son las "marcas combinantes").
3. `toLowerCase()` ignora mayúsculas.

"Lucia", "lucía" y "LUCÍA" coinciden. La `ñ` también pierde su tilde: "Muñoz" coincide con "munoz".

### Selección y botones
- Tocar una tarjeta guarda su **id** en `selectedUser` (mismo criterio que `selectedDayId` en el QR).
- `isSelected = selectedUser === user.id` hace que solo la tarjeta elegida muestre "Ver datos" y "Editar rutina" (renderizado condicional).
- Los botones están dentro de una tarjeta que es un `TouchableOpacity`: los internos capturan su propio toque.
- Navegación: `navigate('ver_datos_trainer', { user })` y `navigate('editar_rutina_trainer', { user })`, con el **objeto completo**.

### Cosas a notar
1. **No hay mensaje de "sin resultados".** Si el filtro no coincide con nadie, la lista queda en blanco.
2. **`ScrollView` + `.map` no escala** (ver pregunta 4).
3. **La búsqueda exige el orden:** "sol gaet" encuentra a Sol, "gaetmank sol" no, porque busca la frase tal cual dentro de "nombre apellido email".
4. **El DNI no se puede buscar**, coherente con el placeholder.
5. **Si el usuario seleccionado deja de coincidir con el filtro**, `selectedUser` conserva su id, así que al volver a aparecer sigue seleccionado.
6. **Cualquier entrenador ve a todos los alumnos.** `User` no tiene un campo `trainerId` ni existe otra relación entrenador-alumno (ver pregunta 6).
7. **Por la navegación viaja el objeto `User` completo, incluida la contraseña** (ver pregunta 7).

## 2. `ver_datos_trainer.tsx`

**100 % presentación**: recibe el usuario por `route.params.user` y lo dibuja en cuatro tarjetas (Datos Personales, Datos Físicos, Contacto y Salud, Entrenamiento) más un botón "Editar rutina".

### `||` en lugar de `??`
```tsx
{user?.dni || '-'}
```
- `||` usa el valor de la derecha si el de la izquierda es **cualquier valor "falso"** (`''`, `0`, `null`, `undefined`).
- `??` solo lo hace con `null` o `undefined`.

Acá `||` es lo correcto: un campo vacío (`''`) también debe mostrar `-`. La elección depende de qué valores querés tratar como "no hay dato".

### Cosas a notar
1. **Los `user?.` son innecesarios:** el tipo declara `{ user: User }`, siempre definido. Defensivo de más, pero inofensivo.
2. **No usa `ProfileDataCard`** (documento 04): vuelve a definir sus propias tarjetas (`card`, `box`, `label`, `value`) con un diseño de dos columnas. UI repetida respecto de `mi_cuenta_user`.
3. **Es una foto del usuario** al navegar (el problema de los params con objetos del documento 03).
4. **Muestra datos de salud** (`contraindications`, `healthInsurance`). Son datos sensibles: con BD real hay que controlar quién los lee (en Argentina rige la Ley 25.326 de Protección de Datos Personales), servirlos solo por HTTPS y no registrarlos en logs.
5. **No muestra qué rutina tiene asignada** el alumno ni su historial.

## 3. Lista para el bloque 9 (continúa la del documento 09)
46. Búsqueda: pasarla al servidor (parámetro de búsqueda), con paginación, espera de unos 300 ms tras dejar de escribir (*debounce*), `FlatList`, y estados de carga, vacío ("sin resultados") y error.
47. Modelo entrenador-alumno: decidir si todos los entrenadores ven a todos los alumnos o solo a los asignados (un `trainerId` en el alumno o una tabla de asignaciones), y hacer cumplir el permiso en el servidor, no solo en la pantalla.
48. Parámetros de navegación: pasar `userId` y cargar el alumno en la pantalla. Los endpoints de entrenador devuelven solo los campos necesarios (nunca la contraseña) y tratan los datos de salud como sensibles.
49. La búsqueda sin acentos pasa a la BD: una *collation* insensible a acentos o una extensión como `unaccent` (PostgreSQL).
50. Unificar las tarjetas de datos (`ProfileDataCard` vs. las propias de `ver_datos_trainer`).

## 4. Preguntas de verificación, con respuestas

### 1. ¿Qué hace `normalizar` paso a paso y por qué hace falta `normalize('NFD')`?
Un carácter como `á` puede representarse como **uno solo** (U+00E1, forma compuesta). Una regex no puede "quitar el acento" de un carácter único sin quitar también la letra.

1. `normalize('NFD')` (*Normalization Form Decomposed*) lo **descompone** en dos: la letra base `a` y el acento `´` (U+0301, una marca combinante).
2. `replace(/[̀-ͯ]/g, '')` elimina todas las marcas combinantes del rango U+0300 a U+036F, dejando solo las letras base.
3. `toLowerCase()` pasa todo a minúsculas.

Se aplica a **ambos lados** de la comparación (el texto del usuario y el filtro), así que no importa cómo estén escritos: "Lucía", "LUCIA" y "lucia" quedan iguales.

### 2. ¿Por qué `usuariosFiltrados` no es un estado? ¿Qué traería que lo fuera?
Porque se puede **calcular siempre** a partir de `users` y `filtro`. Guardarlo en estado crearía una segunda copia del mismo dato que habría que mantener sincronizada:
- Cada `onChangeText` tendría que recalcular la lista y llamar a `setUsuariosFiltrados`, además de `setFiltro` (un render extra).
- Si `users` cambiara (por ejemplo, se registra un alumno nuevo) y alguien olvidara recalcular, la pantalla mostraría una lista vieja.

Derivando la lista en el render, siempre es consistente con sus entradas. El costo de recalcular es insignificante con pocos usuarios; con muchos, se mueve al servidor. Es el mismo principio de "estado mínimo, el resto derivado" visto en el QR y en estadísticas.

### 3. ¿Qué pasa con `includes(normalizar(filtro))` cuando el filtro está vacío?
`'cualquier texto'.includes('')` devuelve `true` para cualquier cadena: el string vacío está contenido en todos los strings. Por eso, con el buscador vacío, **todos** los alumnos pasan el filtro y se ve la lista completa. No hace falta un `if (filtro === '')` aparte; es un comportamiento útil de `includes`.

### 4. ¿Por qué `ScrollView` con `.map` no escala y qué se usaría en su lugar?
`ScrollView` crea y mantiene **todos** sus hijos a la vez, estén visibles o no. Con 500 alumnos serían 500 tarjetas en memoria y el primer render sería lento.

`FlatList` usa **virtualización**: solo crea los elementos visibles (más un margen) y reutiliza o descarta los que salen de pantalla. Se usa con `data`, `renderItem` y `keyExtractor`. Con una BD real se combinaría con paginación (pedir de a 20 o 50) para no descargar todo. Con pocas decenas de alumnos el `ScrollView` alcanza.

### 5. ¿Diferencia entre `||` y `??`, y por qué `ver_datos_trainer` usa `||`?
- `a || b`: devuelve `b` si `a` es falsy (`''`, `0`, `false`, `null`, `undefined`, `NaN`).
- `a ?? b`: devuelve `b` solo si `a` es `null` o `undefined`.

En `ver_datos_trainer` se quiere mostrar `-` también cuando el campo es un string vacío (`''`), por ejemplo una obra social sin completar. Con `??`, un `''` se mostraría tal cual (en blanco). Con `||`, se reemplaza por `-`. Ojo con `||` cuando `0` o `false` son valores válidos: ahí se usa `??`.

### 6. ¿Qué problema de diseño de datos aparece porque cualquier entrenador ve a todos los alumnos?
El modelo no tiene **ninguna relación entrenador-alumno**: `User` no tiene `trainerId` y no existe una tabla de asignaciones. La pantalla no puede mostrar "mis alumnos" porque el dato no existe. Consecuencias:
- **Privacidad:** cualquier entrenador accede a datos personales y de salud de todos los alumnos.
- **Permisos:** no hay forma de decir "este entrenador puede editar la rutina de este alumno y no la de otro".
- **Para la BD** hay que decidir: (a) todos ven a todos (si es una decisión de negocio, es válida), o (b) relación explícita, por ejemplo una columna `trainer_id` en el alumno (un entrenador por alumno) o una tabla `asignaciones` (varios).

Sea cual sea la decisión, la regla debe hacerse cumplir **en el servidor**. Ocultar botones en la pantalla no protege los datos, porque cualquiera puede llamar a la API directamente.

### 7. ¿Qué viaja dentro de `{ user }` por la navegación y qué problema trae?
El objeto `User` **completo**: nombre, DNI, teléfonos, obra social, contraindicaciones, objetivo y también **`password`** (en texto plano en este prototipo). Problemas:
- **Exposición innecesaria:** las pantallas del trainer reciben campos que no necesitan, incluida la contraseña.
- **Datos viejos:** es una foto del momento de navegar; si el dato cambia, la pantalla no se entera.
- **Estado de navegación:** React Navigation puede guardar y serializar los params (restauración de estado, deep links, herramientas de debug), lo que sacaría datos sensibles a lugares inesperados.

Lo correcto es pasar solo `userId` y que la pantalla destino pida los datos que necesita, con un endpoint que no devuelva campos sensibles.
