# Bloque 6a: `login` y `signup`

Archivos: `src/screens/login.tsx` (236 líneas, casi todo estilo) y `src/screens/signup.tsx` (481 líneas). Son los dos formularios de la app y muestran el patrón completo: estado, validación, envío y manejo de errores.

## 1. `login.tsx`

**La lógica real son ~15 líneas:**
```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleLogin = () => {
  if (!email.trim() || !password) { setError('Completa email y contraseña'); return; }
  const result = login(email, password);
  if (!result.ok) setError(result.error ?? '');
};
```

**Flujo completo:**
1. Cada tecla llama a `onChangeText`, que hace `setEmail(text)` y `setError('')`. Lo segundo borra el error en cuanto el usuario empieza a corregir.
2. Al tocar "Iniciar Sesión", `handleLogin` hace una **validación local** (campos vacíos). Si falla, muestra el error y corta con `return`.
3. Si pasa, llama a `login` de `AuthContext` (bloque 3), que valida credenciales y devuelve `{ ok, error? }`.
4. Si `ok` es `true`, **no hay ninguna línea de navegación**: `setUser` dentro del contexto hace que `AppNavigator` cambie las pantallas disponibles (bloque 1). Si es `false`, se muestra el error.

**Detalles técnicos:**
- **`email.trim()` pero `password` sin trim.** Un email con espacios al final es un error de tipeo; una contraseña puede contener espacios a propósito.
- **`error !== '' && <Text>...`:** renderizado condicional.
- **`ScrollView` con `keyboardShouldPersistTaps="handled"`:** sin esto, con el teclado abierto, el primer toque sobre el botón solo cierra el teclado. Con `"handled"`, los toques sobre botones funcionan a la primera.
- **`contentContainerStyle` con `flexGrow: 1` y `justifyContent: 'center'`:** contenido corto queda centrado; contenido largo (horizontal, teclado) hace scroll.
- **`SafeAreaView` viene de `react-native-safe-area-context`**, no de `react-native`: respeta correctamente el notch y las barras del sistema en todas las plataformas.
- **`require('../../assets/images/splash-icon.png')`:** imagen local empaquetada en la app (a diferencia de las remotas con `uri`).
- **`navigation.navigate('signup')`:** apila el registro sobre el login.

**Dos cosas que no hacen nada:**
1. **"Mantener sesión abierta"** es un `View` con borde, sin estado ni `onPress`: solo decorativo. Hacerlo funcionar requiere persistir un token (ítem 8 del bloque 3).
2. No hay "olvidé mi contraseña".

## 2. `signup.tsx`

### 2.1 Estado del formulario: un solo objeto
```tsx
const EMPTY_FORM = { firstName: '', lastName: '', email: '', ... };
type RegistrationForm = typeof EMPTY_FORM;
const [form, setForm] = useState(EMPTY_FORM);
```
- Con 15 campos, un `useState` por campo sería inmanejable; se agrupan en un objeto.
- **`typeof EMPTY_FORM`** deriva el tipo del propio valor: tipo y valor no pueden desincronizarse.
- Todos los valores son **strings**, incluso edad, peso y altura, porque un `TextInput` siempre entrega texto. La conversión a número se hace recién al enviar.

### 2.2 `setField`: una función que devuelve una función
```tsx
const setField = (field: keyof RegistrationForm) => (value: string) => {
  setForm((prev) => ({ ...prev, [field]: value }));
  setError('');
};
// uso:
<CustomInput value={form.firstName} onChangeText={setField('firstName')} />
```
- `setField('firstName')` **devuelve** la función que recibe el texto (*función de orden superior*, currying). Evita escribir 15 funciones casi iguales.
- **`keyof RegistrationForm`** limita el parámetro a los nombres de campo reales; un typo no compila.
- **`[field]: value`** es una *propiedad calculada*: el nombre de la propiedad se decide en ejecución.
- **`{ ...prev, [field]: value }`** crea un objeto **nuevo** copiando el anterior y reemplazando un campo (inmutabilidad, bloque 3).
- **`setForm((prev) => ...)` (forma funcional):** recibe el estado más reciente.

### 2.3 Validación en `handleRegister`
Las reglas se evalúan **en orden y, al fallar una, se corta con `return`**; solo se muestra un error a la vez.

| # | Regla | Cómo |
|---|---|---|
| 1 | Obligatorios no vacíos | `REQUIRED_FIELDS.some(field => !form[field].trim())` |
| 2 | Email válido | `/^\S+@\S+\.\S+$/` |
| 3 | DNI 7 u 8 dígitos | `/^\d{7,8}$/` |
| 4 | Contraseña ≥ 6 caracteres | `form.password.length < 6` |
| 5 | Contraseñas coinciden | `form.password !== form.confirmPassword` |
| 6 | Edad, peso, altura numéricos | `Number(...)`, `Number.isInteger`, `> 0` |

- **`REQUIRED_FIELDS`** lista los obligatorios (obra social y contraindicaciones son opcionales). `.some()` devuelve `true` en cuanto encuentra uno vacío.
- **Regex del email:** `\S+` (uno o más no-espacios), `@`, `\S+`, un punto literal, `\S+`. Valida solo la forma "algo@algo.algo"; no verifica que el email exista.
- **`!(weight > 0)`:** `Number('abc')` da `NaN`, y toda comparación con `NaN` es `false`. Ver pregunta 3.
- **Coma decimal:** `.replace(',', '.')` acepta "70,5" antes de convertir.
- **Normalización antes de enviar:** `age: String(age)`, etc. "70,5" llega como "70.5"; `addUser` (bloque 2) agrega las unidades.
- **`register({ ...form, ... })`:** el objeto incluye `confirmPassword`; por eso `RegistrationData` lo declara opcional (`confirmPassword?`). `addUser` lo ignora.

### 2.4 Capas de validación
- **En la pantalla:** formato (vacíos, regex, longitud, números).
- **En `AuthContext.register`:** reglas de negocio que requieren los datos (email o DNI ya existentes).
- **Con backend:** el servidor debe volver a validar todo. La validación del cliente es comodidad para el usuario; cualquiera puede saltearla llamando a la API. La unicidad de email y DNI solo la garantiza la base de datos (índice único).

### 2.5 `OptionChips`: componente local
```tsx
function OptionChips({ options, selected, onSelect }) { ... }
```
- Definido **fuera** de `SignUpScreen`, en el mismo archivo, porque solo se usa acá (dos veces: género y objetivo). Se mueve a `components/` cuando lo necesite otra pantalla.
- El chip elegido se resalta con `selected === option && styles.optionSelected`. Es un componente controlado, igual que `CustomInput`. `key={option}` (ver teoría de keys en el documento 04).

### 2.6 Otros detalles
- **Fila de 3 inputs** (edad, peso, altura): cada uno envuelto en un `View` con `flex: 1` y `gap: 8` para repartir el ancho.
- **`keyboardType`:** `numeric`, `decimal-pad`, `phone-pad`, `email-address`. Cambia el teclado pero no impide pegar texto: por eso se valida igual.
- **`autoCapitalize`:** `words` para nombres, `sentences` para contraindicaciones; el default de `CustomInput` es `none`.
- **`navigation` se recibe pero no se usa** en `signup`: tras registrarse no navega (lo hace el cambio de sesión). Tampoco hay un enlace "volver al login"; se vuelve con el gesto o el botón atrás del sistema.

## 3. Cosas a notar
1. **Inconsistencia de datos:** `signup` ofrece `Salud, Bajar de peso, Fuerza, Tonificar, Otro`, pero los usuarios de prueba tienen `Ganar fuerza` y `Mantener masa muscular` (`users.ts`). En una BD conviene un catálogo cerrado.
2. **Teléfonos sin validar:** solo se exige que no estén vacíos.
3. **Edad y peso sin rangos:** se acepta `age = 500` o `weight = 0.001`.
4. **`Number('1e2')` es 100:** se acepta notación científica. Detalle menor.
5. **Contraseña mínima de 6 caracteres**, sin más requisitos.
6. **No hay estado de "enviando":** el botón puede tocarse varias veces seguidas. Hoy no importa (todo es síncrono); con backend sí.

## 4. Lista para el bloque 9 (continúa la del documento 04)
19. `login` y `register` pasan a async: estado `loading`, botón deshabilitado mientras espera y errores de red.
20. El servidor revalida todo y garantiza unicidad de email y DNI con índices únicos. Manejar el error de duplicado (HTTP 409) y mostrarlo como hoy.
21. Catálogos cerrados para género y objetivo (unificar `Fuerza` vs `Ganar fuerza`).
22. La contraseña viaja solo por HTTPS y se hashea en el servidor. Nunca se devuelve al cliente.
23. "Mantener sesión abierta": implementarlo con token persistente o quitarlo.
24. Decidir si se guarda la edad o la fecha de nacimiento (afecta el campo "Edad" del formulario).

## 5. Preguntas de verificación, con respuestas

### 1. ¿Por qué `setField('firstName')` devuelve una función y no actualiza el estado directamente?
Porque `onChangeText` espera una **función** que React Native llamará más tarde, cada vez que el usuario escriba, pasándole el texto. `setField('firstName')` se ejecuta **durante el render**, al construir el JSX; si actualizara el estado ahí mismo, cambiaría el estado en pleno render, lo que provoca un bucle de re-renders (React lo detecta y falla).

Devolviendo una función, el trabajo se divide en dos momentos:
1. **En el render:** `setField('firstName')` solo "pre-configura" el campo y devuelve el handler.
2. **Cuando el usuario escribe:** RN llama al handler con el texto, y recién ahí se actualiza el estado.

La alternativa sería escribir en cada input `onChangeText={(t) => setField('firstName', t)}`, 15 veces. El currying evita esa repetición.

### 2. ¿Por qué `setForm((prev) => ({ ...prev, [field]: value }))` y no `setForm({ ...form, [field]: value })`?
`form` es el valor del **render en el que se creó la función** (una "foto"). Si dos actualizaciones ocurren antes de que React vuelva a renderizar, las dos usan la misma foto vieja y la segunda **pisa** a la primera, perdiendo un cambio. Por ejemplo, un gestor de contraseñas puede autocompletar email y contraseña disparando varios `onChangeText` seguidos.

La forma funcional `(prev) => ...` recibe siempre el **estado más reciente** al momento de aplicar el cambio, así que ninguna actualización se pierde. Regla: si el nuevo estado depende del anterior, usá la forma funcional.

### 3. ¿Qué pasaría si la validación del peso fuera `weight <= 0` en lugar de `!(weight > 0)`?
Con texto no numérico, `Number('abc')` da `NaN`, y **toda comparación con `NaN` da `false`**:
- `NaN <= 0` → `false` → la condición de error no se cumple y el valor **pasa la validación**.
- `!(NaN > 0)` → `!false` → `true` → se rechaza.

Con `weight <= 0`, escribir "abc" en el peso permitiría registrarse, y `String(NaN)` daría `"NaN"`, guardando `"NaN kg"` en el usuario. La forma `!(x > 0)` significa "debe ser un número mayor que 0" y rechaza `NaN` automáticamente. Para la edad el problema no existe porque `Number.isInteger(NaN)` ya es `false`.

### 4. ¿Por qué `OptionChips` está definido fuera de `SignUpScreen`?
Porque un componente definido **dentro** de otro se vuelve a crear en cada render. React identifica el tipo de componente por la identidad de la función; una función nueva en cada render es, para React, un componente **distinto** cada vez. Entonces desmonta el anterior y monta uno nuevo, destruyendo su estado interno y sus vistas nativas, y se perdería el foco si tuviera inputs.

En este caso concreto los chips no tienen estado propio, así que el efecto sería desperdicio de rendimiento más que un error visible. Pero es una regla general: los componentes se definen en el nivel superior del archivo.

### 5. ¿Por qué hay validación en la pantalla y en `register`, y por qué con backend habría una tercera?
Cada capa responde a una necesidad distinta:
1. **Pantalla (`handleRegister`):** feedback inmediato, sin esperar a nadie. Reglas de formato que no necesitan datos externos.
2. **`register` en `AuthContext`:** reglas que necesitan consultar datos (¿ya existe ese email o DNI?).
3. **Servidor (con backend):** la única capa en la que se puede confiar. El cliente se puede saltear (llamando a la API directamente o con una app modificada), así que el servidor tiene que revalidar todo. Además, la unicidad solo la puede garantizar la base de datos con un índice único: dos registros simultáneos podrían pasar a la vez la comprobación del cliente.

Resumen: las capas del cliente mejoran la experiencia; la del servidor protege los datos.
