# Bloque 6b: `escanear_qr_user`

Archivo: `src/screens/escanear_qr_user.tsx` (483 líneas). Mezcla cámara, permisos del sistema, ubicación GPS, un cálculo geográfico, un modal y el registro del entrenamiento.

## 1. Qué hace, de punta a punta

```
Abrir pantalla ─► ¿permiso de cámara? ─► escanear QR ─► ¿es el QR de Gymbro?
                                                           │
                       ┌───────────────────────────────────┘
                       ▼
          ¿permiso de ubicación? ─► leer GPS ─► ¿a menos de 150 m del gym?
                                                           │
                       ┌───────────────────────────────────┘
                       ▼
        Formulario: elegir el día de la rutina ─► Confirmar ─► guardar log ─► ir a ese día
```

Se llega desde el botón "Escanear" de `home_user`. Es hermana de `UserTabs` en el stack raíz, por eso tapa la barra de pestañas.

## 2. Constantes y dos funciones puras

```ts
const QR_GYMBRO = 'GYMBRO_CHECKIN_V1';
const GYM_LOCATION = { latitude: -34.6127955, longitude: -58.3661936 };
const GYM_RADIUS_METERS = 150;
```
El "QR válido" es un **texto fijo**. Las coordenadas son las de la sede (coinciden con la dirección del botón de mapa de `home_user`).

### `getDistanceInMeters`: fórmula de Haversine
Calcula la distancia entre dos puntos de latitud/longitud **sobre una esfera**.
- **Por qué no Pitágoras:** los grados de latitud/longitud no son metros, y un grado de longitud mide menos al alejarse del ecuador. Además la Tierra es curva.
- **Pasos:** pasa grados a radianes, calcula `a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)`, luego `c = 2·atan2(√a, √(1−a))` (el ángulo entre los puntos vistos desde el centro de la Tierra) y multiplica por el radio terrestre (6.371.000 m). Para 150 m la precisión sobra.
- **Tipo:** `Pick<LocationObjectCoords, 'latitude' | 'longitude'>` toma solo esos dos campos; `position.coords` trae más (altitud, precisión...).
- Es una **función pura** (mismo input, mismo output, sin efectos): fácil de testear.

### `getDayDescription`
Genera "Trabaja principalmente: Abdomen, Pierna.". Cadena: `blocks → flatMap(items) → filter(exercise) → map(grupo muscular) → filter(Boolean) → Set → spread`.
- `flatMap` aplana la lista de listas en una sola.
- `filter(Boolean)` descarta los `undefined` (ejercicios no encontrados en el catálogo).
- `new Set(...)` elimina repetidos; `[...set]` lo vuelve array.
- Maneja los estados: con datos, **cargando** o **error** del catálogo (bloque 3) y "sin ejercicios".
- Matiz: si el día tiene ejercicios pero ninguno está en el catálogo, dice "todavía no tiene ejercicios asignados", que no es del todo exacto.

## 3. Estado: qué se guarda y qué se deriva

| Estado | Para qué |
|---|---|
| `permission` (hook de la cámara) | `null` mientras consulta; luego `{ granted, canAskAgain, ... }` |
| `scanned` | ¿ya se leyó un QR? (apaga el escáner) |
| `qrValid` | ¿pasó QR y ubicación? Cambia de "cámara" a "formulario" |
| `dayPickerVisible` | ¿modal abierto? |
| `selectedDayId` | el día elegido, **solo su id** |
| `scanProcessed` (`useRef`) | candado síncrono contra lecturas duplicadas |

`selectedDay` y `routine` se **derivan** en cada render (`routine?.days.find(...)`, `getRoutineById(user.id_rutina)`). Regla: guardá el mínimo y calculá el resto.

## 4. El candado `scanProcessed` + `scanned`

`onBarcodeScanned` se dispara **muchas veces por segundo** mientras el QR está a la vista. Si cada disparo ejecutara el handler, saldrían varias alertas y varias consultas de GPS.

- `useRef` guarda un valor que **se modifica al instante** y **no provoca re-render**. El handler empieza con `if (scanProcessed.current) return;` y lo pone en `true`.
- `setScanned(true)` no alcanza solo (ver pregunta 1).
- `scanned` cumple otra función: `onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}` **le quita el callback a la cámara**.
- `resetScan()` libera ambos para permitir "Intentar de nuevo".

## 5. Permisos

**Cámara:** `useCameraPermissions()` devuelve `[permission, requestPermission]`.
**Ubicación:** funciones sueltas `getForegroundPermissionsAsync` y `requestForegroundPermissionsAsync`.

- `get...` **solo consulta** el estado actual, sin molestar al usuario. `request...` **muestra el diálogo del sistema**. Por eso primero se consulta y solo se pide si falta.
- **`canAskAgain`:** si el usuario denegó "para siempre", el sistema ya no muestra el diálogo y la única salida es `Linking.openSettings()`. Por eso el botón cambia de "Dar permiso" a "Abrir configuración".
- Los textos del diálogo están en `app.json` (bloque 1).
- Cámara y ubicación se piden **en momentos distintos**: la cámara al entrar, la ubicación recién al leer un QR válido.

## 6. `handleBarcodeScanned`, paso a paso
1. Candado.
2. Si `data !== QR_GYMBRO` → Alert "QR no válido" con "Intentar de nuevo" (`resetScan`).
3. Si es el QR: asegurar permiso de ubicación (consultar, pedir si falta). Si sigue denegado: con `canAskAgain === false` el Alert ofrece abrir configuración; si no, "Intentar de nuevo".
4. `getCurrentPositionAsync({ accuracy: High })` → distancia → si es mayor a 150 m, Alert con la distancia redondeada; si no, `setQrValid(true)`.
5. `try/catch`: cualquier fallo (por ejemplo GPS apagado) → Alert genérico con reintento.

Todos los caminos que no tienen éxito terminan ofreciendo `resetScan`; si no, la cámara quedaría muerta (`scanned` seguiría en `true`).

## 7. Render: máquina de estados con ternarios anidados

```
!permission          → "Cargando..."
permission.granted
   ├─ qrValid        → FORMULARIO (elegir día)
   └─ si no          → CÁMARA
si no                → mensaje + botón para pedir permiso
```
- Al pasar `qrValid` a `true`, `CameraView` **se desmonta** y la cámara se apaga.
- El título del header cambia según `qrValid`.
- `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` limita la detección a QR.
- Sin rutina (`routine?.days.length` falso), el formulario muestra "No tenés una rutina asignada".

### El `Modal` selector de día
- `transparent` + `animationType="fade"`.
- `onRequestClose` hace que el botón atrás de **Android** cierre el modal.
- Un `Pressable` con `StyleSheet.absoluteFill` está **detrás** del contenido y cubre toda la pantalla: tocar fuera cierra el modal. El contenido va después, queda encima y captura sus propios toques.
- Al elegir: `setSelectedDayId(day.id)` y se cierra.

## 8. `handleSubmit`: el registro del entrenamiento
1. **Guardas:** que haya usuario y día elegido; que el catálogo no esté cargando ni en error.
2. **Snapshot:** recorre los ejercicios del día y arma `{ exerciseId, muscleGroup }` tomando el grupo del catálogo **en este momento** (decisión del bloque 2: el log no cambia aunque la rutina se edite después).
3. Si algún ejercicio no se encuentra (`null`) → Alert y no se guarda.
4. `.filter((exercise): exercise is WorkoutExercise => exercise !== null)` es un **type predicate**: le enseña a TypeScript que el array ya no tiene `null`. `.some(!exercise)` no alcanza para que TS lo infiera.
5. **La fecha se arma a mano** con `getFullYear`, `getMonth() + 1` y `padStart(2, '0')`.
6. `addWorkoutLog(...)` y `navigation.replace(...)` al día elegido (analizado en el bloque 4).

## 9. Cosas a notar
1. **Chequeo de presencia débil.** El QR es un texto fijo que cualquiera puede generar, y la ubicación se valida en el cliente (se puede falsear con apps de ubicación simulada). Sirve para un prototipo, no como control antifraude.
2. **Sin feedback durante el GPS.** Entre leer el QR y obtener la ubicación (varios segundos en interiores con precisión `High`) la pantalla queda sin indicador, y `getCurrentPositionAsync` no tiene timeout.
3. **La fecha viene del reloj del dispositivo**, que el usuario puede cambiar.
4. **Se puede registrar el mismo día varias veces**, coherente con la nota de `workoutLogs`, pero conviene decidirlo conscientemente.
5. **Sin persistencia:** el log se agrega al array en memoria y se pierde al recargar.
6. **Grupos musculares inconsistentes con los datos de prueba (a verificar en `estadisticas_user`):** los logs de ejemplo tienen `'Movilidad'` (p. ej. para `quads/all-fours-squad-stretch`), pero el mapeo actual de `exercisesApi.ts` nunca produce `'Movilidad'`: ese ejercicio daría `'Pierna'`. Los logs nuevos y los de ejemplo no usan los mismos criterios.

## 10. Lista para el bloque 9 (continúa la del documento 05)
25. El check-in se valida en el **servidor**: recibir coordenadas y hora, calcular la distancia ahí, y usar un QR rotativo o firmado en vez de un texto fijo.
26. `addWorkoutLog` pasa a ser una llamada de red. Conviene que el servidor derive el grupo muscular desde su propio catálogo (ítem 11) en vez de confiar en el cliente.
27. Ubicación y radio del gimnasio a configuración/BD (por si hay más de una sede).
28. La fecha del registro la pone el servidor; definir la política de duplicados por día.
29. Estado de "validando ubicación..." y timeout para el GPS.
30. `getRoutineById` pasa a ser asíncrono: el formulario necesitará estado de carga.
31. Unificar la lista de grupos musculares (decidir si existe `Movilidad`).

## 11. Preguntas de verificación, con respuestas

### 1. ¿Por qué hacen falta `scanProcessed` (`useRef`) y `scanned` (`useState`)?
Hay dos problemas distintos, y cada herramienta resuelve uno.

**Problema A: evitar que el handler corra dos veces.** La cámara dispara `onBarcodeScanned` varias veces por segundo. Línea de tiempo:
```
t=0 ms    1.er disparo → handler corre → setScanned(true)  (queda "programado")
t=30 ms   2.º disparo  → el handler todavía ve scanned = false
t=60 ms   3.er disparo → igual
t=80 ms   React termina de re-renderizar → scanned = true
```
Dos razones por las que `useState` no sirve como candado:
- El estado **no cambia en el momento**: `setScanned(true)` lo programa para el próximo render.
- Cada render tiene su propia "foto" de las variables (*closure*): un handler creado en un render con `scanned = false` seguirá viendo `false` aunque después cambie.

Un `useRef` es una **caja mutable** que es la misma en todos los renders y se modifica **al instante**. El primer disparo hace `scanProcessed.current = true` y el segundo ya lo ve. Es un candado síncrono.

**Problema B: apagar el escáner.** Un cambio en un ref **no provoca re-render**, así que no sirve para cambiar lo que se dibuja. `scanned` (estado) hace que React vuelva a renderizar y pase `onBarcodeScanned={undefined}` a la cámara, que deja de emitir eventos.

Resumen: el ref es el candado inmediato y el estado es el interruptor visible para la UI.

### 2. ¿Por qué no se calcula la distancia con Pitágoras?
Pitágoras supone un plano con unidades uniformes. Las coordenadas son ángulos sobre una esfera:
- Un grado de latitud mide ~111 km, pero un grado de longitud mide menos cuanto más lejos del ecuador (en Buenos Aires ~91 km). Restar grados y aplicar Pitágoras mezcla unidades distintas.
- La Tierra es curva, y en distancias largas el error crece.

Haversine calcula la distancia del arco más corto sobre la esfera: pasa a radianes, mide cuánto se separan los dos puntos como ángulo visto desde el centro de la Tierra y lo multiplica por el radio terrestre.

### 3. Diferencia entre `getForegroundPermissionsAsync` y `requestForegroundPermissionsAsync`; qué es `canAskAgain`
- `get...`: **solo lee** el estado actual (concedido, denegado o sin decidir). No muestra nada.
- `request...`: **abre el diálogo del sistema** para que el usuario decida.

Primero se consulta para no mostrar el diálogo si el permiso ya está concedido. `canAskAgain` indica si el sistema todavía **permite volver a mostrar** el diálogo. Si el usuario denegó permanentemente, vale `false` y pedir de nuevo no hace nada: hay que mandarlo a la configuración de la app con `Linking.openSettings()`.

### 4. ¿Por qué `selectedDayId` guarda un id y no el objeto día?
- **Una sola fuente de verdad:** el día vive en la rutina; en el estado solo se guarda qué día está elegido. Guardar el objeto crearía una segunda copia que podría quedar desactualizada si la rutina cambia.
- **Estado mínimo y simple:** un número es fácil de comparar y de serializar.
- **Derivar el resto:** `selectedDay = routine?.days.find(...)` se recalcula en cada render y siempre refleja los datos actuales.

Es el mismo criterio que con los params de navegación (bloque 4): pasar ids y no objetos.

### 5. ¿Por qué la fecha se arma a mano y no con `toISOString()`?
`toISOString()` devuelve la fecha en **UTC**. Argentina está en UTC−3: a las 22:00 locales ya son las 01:00 del día siguiente en UTC. Un entrenamiento hecho de noche se registraría con la fecha de mañana, y rompería los conteos de días y las estadísticas por semana.

`getFullYear()`, `getMonth()` y `getDate()` usan la **zona horaria local** del dispositivo. `getMonth()` empieza en 0, por eso el `+ 1`; `padStart(2, '0')` agrega el cero a la izquierda para el formato `YYYY-MM-DD`.

### 6. Limitaciones de seguridad del check-in y cómo se resolverían con backend
Limitaciones:
- El QR es un texto fijo: cualquiera puede imprimirlo, fotografiarlo o generarlo desde su casa.
- La ubicación se valida en el celular y puede falsearse con apps de ubicación simulada.
- La fecha viene del reloj del dispositivo.
- Todo lo decide el cliente, que es modificable.

Con backend:
- **QR rotativo o firmado:** el gimnasio muestra un código que cambia cada pocos minutos (o un token firmado con vencimiento). El servidor verifica que sea vigente. Un QR copiado vence rápido.
- **Validar en el servidor:** la app envía el token leído y las coordenadas; el servidor calcula la distancia y decide.
- **Fecha y hora del servidor.**
- **Reglas de negocio:** límite de registros por día, límite de intentos.
- Limitación que persiste: el GPS puede falsearse. El QR rotativo mostrado en el gimnasio es la prueba de presencia más sólida; la ubicación es una capa adicional.
