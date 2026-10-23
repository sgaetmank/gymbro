# Bloque 8c: reordenar con gestos en `editar_rutina_trainer`

Archivos: `src/screens/editar_rutina_trainer.tsx`, `src/components/DragHandle.tsx` y `app/index.tsx` (la raíz `GestureHandlerRootView`). Librerías: `react-native-sortables`, `react-native-reanimated` y `react-native-gesture-handler`.

Este documento explica cómo el entrenador cambia el orden de días, bloques y ejercicios arrastrándolos, y la teoría que hay detrás (gestos, hilo de UI, layout con posición absoluta). Complementa a los documentos 11 (estado y operaciones), 12 (render) y 13 (guardado y avisos).

## 1. Qué ve y qué hace el entrenador

Cada día, cada bloque y cada ejercicio/descanso tiene a la izquierda una barrita gris de dos rayitas (≡), el `DragHandle`.

1. Mantiene presionada la barrita (por defecto **200 ms**).
2. El elemento "se despega": se agranda un poco (escala 1,1) y los demás se atenúan (opacidad 0,5).
3. Arrastra hacia arriba o abajo; los demás elementos se corren para hacerle lugar.
4. Si se acerca al borde de la pantalla (a menos de 75 px), el scroll avanza solo.
5. Al soltar, el elemento se acomoda en su nueva posición y el orden queda en el borrador. Para que se conserve hay que tocar **Guardar** (documento 13): reordenar cuenta como un cambio sin guardar.

Cada barrita mueve **solo su propio elemento**, dentro de su propia lista: un ejercicio se mueve entre los ejercicios de su bloque, un bloque entre los bloques de su día y un día entre los días. No se puede pasar un ejercicio a otro bloque arrastrándolo.

## 2. Las piezas y qué hace cada una

| Pieza | Dónde | Rol |
|---|---|---|
| `Sortable.Flex` | `editar_rutina_trainer`, 3 veces | Contenedor que hace reordenable a una lista de hijos: mide, posiciona y anima. |
| `DragHandle` | `src/components/DragHandle.tsx` | La barrita. Es la única zona que inicia el arrastre. |
| `customHandle` | prop de cada `Sortable.Flex` | Le dice al contenedor que el arrastre lo inicia un `Sortable.Handle` y no todo el elemento. |
| `onDragEnd` + `order` | prop de cada `Sortable.Flex` | Avisa que se soltó un elemento y entrega la función que calcula el nuevo orden. |
| `reorderDays`, `reorderBlocks`, `reorderBlockItems` | `editar_rutina_trainer` | Aplican `order` al arreglo correcto del estado. |
| `Animated.ScrollView` + `scrollRef` + `scrollableRef` | `editar_rutina_trainer` | Permiten el auto-scroll durante el arrastre. |
| `contentWidth` + `cardWidth(level)` | `editar_rutina_trainer` | Dan a cada tarjeta un ancho en píxeles (sección 7). |
| `GestureHandlerRootView` | `app/index.tsx` | Raíz que recibe los gestos de toda la app. |
| Reanimated | librería | Calcula posiciones y animaciones en el hilo de UI. |

## 3. Teoría: cómo se arrastra algo en React Native

### 3.1 El problema de los hilos
Una app React Native tiene dos hilos que importan acá:
- **Hilo de JavaScript:** corre los componentes, los `useState` y los `onPress`.
- **Hilo de UI:** dibuja la pantalla, unas 60 veces por segundo (cada ~16 ms).

Un arrastre actualiza la posición del dedo decenas de veces por segundo. Si cada movimiento tuviera que ir al hilo de JavaScript (que además puede estar ocupado), el elemento se vería entrecortado.

### 3.2 La solución: gestos y animaciones en el hilo de UI
- **`react-native-gesture-handler`** reconoce los gestos (toque largo, pan = arrastrar) directamente en el lado nativo, sin esperar al hilo de JavaScript.
- **`react-native-reanimated`** permite escribir funciones llamadas **worklets** que corren en el hilo de UI, y guardar valores en **valores compartidos** (`useSharedValue`) que ese hilo lee y modifica. `useAnimatedStyle` conecta un valor compartido con un estilo: cuando el valor cambia, el estilo se actualiza sin pasar por React.
- `react-native-sortables` está hecha con ambas: mientras se arrastra, la posición del elemento y el corrimiento de los demás se calculan **en el hilo de UI**. React casi no participa.

### 3.3 Por qué el estado de React se actualiza una sola vez
Durante el arrastre el estado `days` **no cambia**. Recién cuando el entrenador suelta el dedo, la librería llama a `onDragEnd` (en el hilo de JavaScript) con el resultado final, y ahí sí se hace un único `setDays`. Es una separación útil para estudiar:
- **Mientras se arrastra:** todo ocurre en el hilo de UI (rápido, fuera de React).
- **Al soltar:** se informa a React, que guarda el nuevo orden y re-renderiza.

### 3.4 Posición absoluta
Para poder mover cada elemento libremente, la librería mide el tamaño de cada hijo y lo coloca con **posición absoluta** (`position: 'absolute'` con un desplazamiento calculado). Esto tiene una consecuencia práctica en el layout: un hijo no puede usar `width: '100%'`, porque su ancho se calcula contra un contenedor que no tiene ancho propio (sección 7).

## 4. `Sortable.Flex` y la estrategia de reordenamiento

`Sortable.Flex` es un contenedor flexbox cuyos hijos se pueden reordenar. En este proyecto se usa siempre igual:

```tsx
<Sortable.Flex
  customHandle
  flexDirection="column"
  flexWrap="nowrap"
  width={cardWidth(n)}
  gap={...}
  paddingBottom={...}
  scrollableRef={scrollRef}
  onDragEnd={({ order }) => ...}
>
  {lista.map((elemento) => <View key={elemento.id}> ... </View>)}
</Sortable.Flex>
```

- **`flexDirection="column"` y `flexWrap="nowrap"`:** por defecto `Sortable.Flex` acomoda los hijos en fila y con salto de línea. Acá queremos una columna.
- **`gap`:** separación entre elementos. Reemplaza a los márgenes entre tarjetas: como la librería posiciona por medidas, no conviene que los hijos tengan margen propio.
- **`paddingBottom`:** deja aire debajo del último elemento, antes del botón "＋ Agregar" que sigue.
- **Los hijos se identifican por su `key`.** Por eso cada elemento usa `key={x.id}` (los ids de los datos, ver documento 04, sección 10). La librería usa esas claves para saber qué elemento se movió y para construir el nuevo orden.
- **Estrategia `insert` (por defecto):** al arrastrar, los elementos que quedan entre la posición original y la de destino se corren una posición, como al insertar una carta en un mazo. (La otra opción típica, `swap`, intercambia solo dos.)
- **Cuándo se decide el destino:** por defecto, cuando el **centro** del elemento arrastrado cruza a otro (`reorderTriggerOrigin: 'center'`).

## 5. El arrastre solo con la barrita (`customHandle`)

Sin `customHandle`, tocar cualquier parte del elemento y mantener lo arrastraría. Con la prop activa, **solo** el `Sortable.Handle` engancha el gesto. Se hizo así por tres razones:
1. **El scroll:** deslizar el dedo sobre una tarjeta debe seguir haciendo scroll de la pantalla.
2. **Los botones:** 🗑, ＋ Ejercicio, ＋ Descanso, etc. siguen funcionando con un toque normal.
3. **El anidado:** hay tres listas una dentro de otra (sección 6). Si todo el elemento fuera "agarrable", tocar un ejercicio podría disparar el arrastre del ejercicio, del bloque y del día a la vez.

### `DragHandle`

```tsx
export default function DragHandle() {
  return (
    <Sortable.Handle style={styles.handle}>
      <Ionicons name="reorder-two" size={20} color="#666666" />
    </Sortable.Handle>
  );
}
```
No recibe props: `Sortable.Handle` lee de un contexto de React a qué elemento pertenece (`useItemContext`), el del `Sortable.Flex` más cercano que lo contiene. Por eso **el mismo componente sirve en los tres niveles** y cada barrita mueve a su propio elemento. Si se usa fuera de un `Sortable.Flex` con `customHandle`, la librería lanza un error.

Hay una barrita en:
- el header del día (junto a `day.name`),
- el header del bloque (junto a `Bloque N`),
- la tarjeta de cada ejercicio o descanso (`itemMain`).

## 6. Tres listas anidadas

La pantalla tiene tres `Sortable.Flex` uno dentro de otro:

```
Sortable.Flex (días)
 └─ día
     └─ Sortable.Flex (bloques de ese día)
         └─ bloque
             └─ Sortable.Flex (ejercicios/descansos de ese bloque)
                 └─ ejercicio
```

- **Cada `Sortable.Flex` es independiente:** tiene su propio estado interno (posiciones, elemento activo) a través de contextos de React. Un contexto interior tapa al exterior, y así cada `Sortable.Handle` encuentra el contenedor más cercano.
- **Hay una lista de bloques por cada día y una de ejercicios por cada bloque,** y cada una avisa con su `onDragEnd` qué día/bloque es (la función de reordenar recibe `day.id` y `block.id`).
- **Al arrastrar un día se mueve entero**, con sus bloques y ejercicios adentro: es un hijo más de la lista de días, y los elementos de adentro viajan con él.
- **No se usan listas virtualizadas (`FlatList`):** las librerías de reordenamiento basadas en `FlatList` están pensadas para una sola lista y no soportan bien anidar listas reordenables dentro de otras. `Sortable.Flex` reordena `View`s comunes dentro de un scroll normal, lo que permite anidar. A cambio, **no virtualiza**: dibuja todos los elementos. Para una rutina (decenas de ejercicios) es irrelevante.

## 7. El ancho de las tarjetas (`contentWidth` y `cardWidth`)

### El problema
Como la librería posiciona con valores absolutos (sección 3.4), una tarjeta con `width: '100%'` no sabe de qué ancho es el 100% y se encoge a su contenido. Las tarjetas tienen que recibir un ancho **en píxeles**.

### La solución en tres pasos
1. **Medir una vez.** El título "Rutina de ..." está en una fila que ocupa todo el ancho útil del scroll. Su `onLayout` informa ese ancho y se guarda en el estado:
   ```tsx
   <View style={styles.titleRow} onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}>
   ```
   `onLayout` se vuelve a ejecutar si el ancho cambia (por ejemplo, al rotar el teléfono), así que el layout se recalcula solo.
2. **Calcular el ancho de cada nivel.**
   ```tsx
   const cardWidth = (level: number) => contentWidth - level * 27;
   ```
   Cada nivel anidado es más angosto porque su tarjeta padre le descuenta el borde y el padding de ambos lados: día `cardWidth(0)`, bloque `cardWidth(1)`, ejercicio `cardWidth(2)`.
3. **Aplicarlo** a cada `Sortable.Flex` (prop `width`) y a cada tarjeta (`style={{ width: cardWidth(n) }}`).

### De dónde sale el 27
- La tarjeta de día tiene borde 1,5 y padding 12 por lado: `2 × (1,5 + 12) = 27` px.
- La tarjeta de bloque tiene borde 1 y padding 10 por lado: `2 × (1 + 10) = 22` px.

Se usa 27 en ambos niveles para simplificar el cálculo. Los ejercicios quedan unos 5 px más angostos que el espacio exacto; no se nota.

### Consecuencias
- **Paddings fijos:** el padding de las tarjetas es en píxeles (12, 10 y 10), no en porcentaje. Un padding en porcentaje depende del ancho del padre y haría imposible calcular los anchos de arriba.
- **Primer render:** al principio `contentWidth` vale `0`. Por eso las listas se dibujan con `{contentWidth > 0 && ( ... )}`: recién cuando `onLayout` informa el ancho se muestran. Sin esa condición, los anchos darían valores negativos.
- **Textos largos:** como el ancho de la tarjeta es fijo, los nombres largos ("Estiramiento de cuádriceps en cuadrupedia") se parten en dos líneas en lugar de salirse de la pantalla.

## 8. Del gesto al estado: `onDragEnd` y `order`

Al soltar, `Sortable.Flex` llama a `onDragEnd` con un objeto que incluye **`order`**, una función:

```tsx
onDragEnd={({ order }) => reorderDays(order)}
```

`order(data)` recibe **el arreglo original** (en el orden anterior) y devuelve **un arreglo nuevo** con los mismos elementos en el orden final. Internamente la librería sabe, por las `key`, a qué posición fue cada elemento; `order` aplica esa permutación a los datos que le pasemos. Ejemplo: días `[A, B, C]`, el entrenador arrastra `A` entre `B` y `C` → `order([A, B, C])` devuelve `[B, A, C]`.

Dos propiedades importantes:
- **No muta el arreglo recibido:** crea uno nuevo (coherente con el patrón inmutable del documento 11, sección 3).
- **Si el elemento se suelta donde estaba**, `order` devuelve **el mismo arreglo** que recibió, sin cambios.

### Las tres funciones

```tsx
type OrderFn = <T>(data: T[]) => T[];

const reorderDays = (order: OrderFn) => {
  setDays(order(days));
};

const reorderBlocks = (dayId: number, order: OrderFn) => {
  setDays(days.map((day) =>
    day.id !== dayId ? day : { ...day, blocks: order(day.blocks) }
  ));
};

const reorderBlockItems = (dayId: number, blockId: number, order: OrderFn) => {
  setDays(days.map((day) =>
    day.id !== dayId ? day : {
      ...day,
      blocks: day.blocks.map((block) =>
        block.id !== blockId ? block : { ...block, items: order(block.items) }
      ),
    }
  ));
};
```

- **`OrderFn` es genérica (`<T>`):** la misma función `order` sirve para ordenar un arreglo de días, de bloques o de ítems, sin importar el tipo de elemento. TypeScript infiere `T` en cada llamada.
- **Cuántos niveles se reconstruyen:** días, 1 (el arreglo `days`); bloques, 2 (`days` y el día); ítems, 3 (`days`, el día y el bloque). Es el mismo anidado de `addExercise` o `deleteItem`.
- **Qué se conserva:** los días y bloques que no se tocaron mantienen su referencia (*structural sharing*).
- **Cada `onDragEnd` captura `day.id` / `block.id`** del `.map` donde se declara, por eso cada lista sabe qué arreglo actualizar.

### Efectos en el resto de la pantalla
- **Nombres de bloque:** `Bloque ${blockIndex + 1}` se calcula con la posición. Al reordenar, los bloques se renumeran solos.
- **Nombres de día:** `day.name` es un texto guardado ("Día 3"). Al reordenar **no se renumera**: pueden quedar "Día 2", "Día 1", "Día 3" (documento 11, sección 7).
- **Botón Guardar y avisos de salida:** el orden forma parte del JSON del borrador, así que `hasUnsavedChanges` pasa a `true` al reordenar. Si se vuelve al orden original, el JSON vuelve a coincidir con `savedSnapshot` y el botón vuelve a "Guardado ✓" (documentos 12 y 13).

## 9. Auto-scroll al arrastrar

```tsx
const scrollRef = useAnimatedRef<Animated.ScrollView>();
...
<Animated.ScrollView ref={scrollRef} ...>
  <Sortable.Flex scrollableRef={scrollRef} ...>
```

- **`Animated.ScrollView`** es el `ScrollView` de Reanimated. Su referencia (`useAnimatedRef`) puede usarse dentro de worklets, que es donde la librería mueve el scroll (con `scrollTo` de Reanimated) mientras se arrastra.
- **`scrollableRef`** se pasa a las **tres** listas: así, no importa cuál se esté arrastrando, todas saben cuál es el scroll que tienen que mover.
- **Cuándo se activa:** cuando el elemento arrastrado está a menos de 75 px del borde superior o inferior del scroll (`autoScrollActivationOffset`).
- Sin `scrollableRef` el arrastre funcionaría igual, pero para llevar un elemento lejos habría que soltarlo, hacer scroll a mano y volver a empezar.

## 10. `GestureHandlerRootView`

En `app/index.tsx`, toda la app está envuelta en:
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider> ... </SafeAreaProvider>
</GestureHandlerRootView>
```
- Gesture Handler necesita una **vista raíz** que registre los toques para poder reconocer los gestos de todos los componentes que haya debajo. Sin ella, los gestos no se detectan (en Android, en particular, el arrastre simplemente no funciona).
- **`style={{ flex: 1 }}`:** la raíz tiene que ocupar toda la pantalla. Sin eso, el resto de la app colapsaría a altura cero.
- Los **`Modal`** de React Native se dibujan en una ventana aparte, fuera de ese árbol. Los modales de esta pantalla no tienen gestos de arrastre, así que no lo necesitan; si algún día se pusiera un arrastre dentro de un `Modal`, habría que envolver su contenido en otro `GestureHandlerRootView`.

## 11. Limitaciones y cosas a tener en cuenta

1. **Los ejercicios no se pueden mover a otro bloque** ni los bloques a otro día: cada lista reordena solo dentro de sí misma.
2. **Los días no se renumeran** al reordenarlos (sección 8).
3. **Sin virtualización:** se dibujan todos los elementos. Con rutinas normales no es un problema.
4. **El ancho de las tarjetas es una aproximación** (el 27 de la sección 7); un cambio en el borde o el padding de las tarjetas obliga a ajustarlo.
5. **Anidado no documentado por la librería:** `react-native-sortables` no describe oficialmente el anidado de varios `Sortable.Flex`. Funciona con esta configuración, pero hay que volver a probarlo si se actualiza la librería.
6. **El arrastre no se probó en la versión web** (`react-native-web`).
7. **Los avisos de salida no cambian:** reordenar activa `hasUnsavedChanges` como cualquier otro cambio; todo lo demás sigue en el documento 13.

## 12. Para el backend

- **El orden es la posición en el arreglo.** `days`, `blocks` e `items` son arreglos, y su orden es el que el entrenador dejó. Cuando la rutina se guarde en una base de datos, ese orden hay que persistirlo: típicamente una columna `posicion` por día, bloque e ítem, que se completa al guardar con el índice del arreglo (`0, 1, 2...`) y se usa en el `ORDER BY` al leer.
- **Los ids deben seguir siendo únicos y estables:** la librería identifica a los elementos por su `key` (el id). Con ids nuevos generados por el servidor al guardar, la pantalla debe reemplazar el borrador por lo que devuelve el servidor.
- **Reordenar no modifica ids:** solo cambia la posición de los elementos en el arreglo.

## 13. Preguntas de verificación, con respuestas

### 1. ¿Por qué el arrastre es fluido aunque el estado de React no cambie mientras se mueve el dedo?
Porque el movimiento no lo calcula React. `react-native-gesture-handler` reconoce el gesto en el lado nativo y `react-native-reanimated` calcula posiciones y animaciones en el **hilo de UI** con valores compartidos y worklets. El hilo de JavaScript (donde corre React) solo se entera al soltar, cuando la librería llama a `onDragEnd`. Si cada movimiento del dedo pasara por `setState`, habría un re-render por cada movimiento del dedo y se vería entrecortado.

### 2. ¿Qué es `order` y qué devuelve si el elemento se suelta en su posición original?
Es una función que entrega la librería en `onDragEnd`. Recibe el arreglo original y devuelve un arreglo nuevo con los elementos en el orden final, usando las `key` para saber a qué posición fue cada uno. Si no hubo cambio de posición, devuelve el **mismo arreglo** que recibió. No modifica el arreglo recibido, por lo que respeta la regla de no mutar el estado.

### 3. ¿Para qué sirve la prop `customHandle`?
Hace que el arrastre solo pueda iniciarse desde un `Sortable.Handle` (nuestro `DragHandle`) y no desde cualquier parte del elemento. Así el resto de la tarjeta conserva sus comportamientos (hacer scroll deslizando, tocar 🗑 o ＋), y en un anidado de tres listas no se disparan varios arrastres a la vez. Si se usa un `Sortable.Handle` sin esa prop, la librería lanza un error.

### 4. ¿Por qué un mismo `DragHandle` sirve para días, bloques y ejercicios?
Porque no recibe información por props: `Sortable.Handle` consulta un contexto de React para saber a qué elemento pertenece. El contexto lo provee el `Sortable.Flex` más cercano que contiene a la barrita, y cada nivel tiene el suyo. Una barrita dibujada en la tarjeta de un ejercicio encuentra el contexto de la lista de ejercicios; una en el header de un bloque, el de la lista de bloques.

### 5. ¿Por qué no se puede usar `width: '100%'` en las tarjetas y cómo se resolvió?
`Sortable.Flex` posiciona cada hijo con un desplazamiento absoluto y mide su tamaño natural. Un porcentaje se calcula contra el ancho del padre, pero ese padre tampoco tiene un ancho definido, y la tarjeta se encoge a su contenido. Se resolvió midiendo el ancho disponible una vez (`onLayout` del título → `contentWidth`) y dándole a cada tarjeta un ancho en píxeles con `cardWidth(level) = contentWidth - level * 27`.

### 6. ¿Qué pasa con la pantalla en el primer render y por qué?
`contentWidth` empieza en `0` porque todavía no se midió nada. Las listas están dentro de `{contentWidth > 0 && ...}`, así que no se dibujan en ese primer render. El título sí se dibuja, su `onLayout` informa el ancho, se actualiza el estado y recién ahí aparecen las listas con anchos válidos.

### 7. ¿Qué cambia en el estado cuando se mueve un ejercicio, y qué ramas conservan su referencia?
`reorderBlockItems` reconstruye el camino hasta el bloque: crea un arreglo `days` nuevo, el día afectado nuevo, su arreglo `blocks` nuevo, el bloque afectado nuevo y su arreglo `items` nuevo (el que devuelve `order`). Conservan su referencia los demás días, los demás bloques de ese día y los propios ejercicios (solo cambia su orden dentro del arreglo).

### 8. ¿Reordenar cuenta como un cambio sin guardar? ¿Y qué pasa si se vuelve al orden anterior?
Sí. `hasUnsavedChanges` compara `JSON.stringify(days)` con `savedSnapshot`, y el orden de los elementos forma parte del JSON. Si el entrenador reordena, el botón pasa a "Guardar" y, al salir, saltan los avisos del documento 13. Si deja todo en el orden original, el JSON vuelve a coincidir con la foto guardada y la pantalla ya no avisa de cambios pendientes.

### 9. ¿Por qué se pasa `scrollableRef` a las tres listas y por qué el scroll es un `Animated.ScrollView`?
El auto-scroll corre en un worklet (hilo de UI) y necesita una referencia al scroll que también pueda usarse ahí: `useAnimatedRef` sobre un `Animated.ScrollView`. Se pasa a las tres listas porque el arrastre puede empezar en cualquiera de ellas y todas deben saber qué scroll mover.

### 10. ¿Qué limitaciones tiene esta forma de reordenar?
Los elementos solo se reordenan dentro de su propia lista (no se puede pasar un ejercicio a otro bloque). Los días no se renumeran. No hay virtualización (se dibuja todo). El ancho de las tarjetas se calcula con una constante aproximada y depende de que los paddings sean fijos. Y la librería no documenta oficialmente el anidado de listas, por lo que conviene volver a probarlo al actualizarla.
