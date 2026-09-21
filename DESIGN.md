---
name: Downly
description: Portal de luz para descargar video y audio: un campo WebGL nocturno, tipografía condensada enorme, líneas de 1px y un solo acento incandescente.
colors:
  void: "#0b0d1a"
  ink: "#13162b"
  night: "#1a1d3a"
  lilac: "#6a6cf6"
  mist: "#bfd2ff"
  ember: "#ff6a3d"
  text: "#d9e3ff"
  muted: "#a6b1d3"
  line: "rgba(191, 210, 255, 0.16)"
  line-strong: "rgba(191, 210, 255, 0.36)"
  scrim: "rgba(11, 13, 26, 0.74)"
  field: "rgba(11, 13, 26, 0.72)"
  lilac-wash: "rgba(106, 108, 246, 0.2)"
  error: "#ff8f7d"
  success: "#7ee0b0"
typography:
  display:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(3.5rem, 11.4vw, 10.5rem)"
    fontWeight: 560
    lineHeight: 0.88
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 5.2vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  display-compact:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(3.5rem, 19vw, 4.75rem)"
    fontWeight: 560
    lineHeight: 0.88
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  lead:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.18em"
    fontVariation: "'wdth' 118"
  button:
    fontFamily: "Archivo Var, Arial Narrow, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 118"
  figure:
    fontFamily: "Martian Mono Var, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "clamp(3rem, 8.5vw, 6.5rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "'tnum'"
  figure-intro:
    fontFamily: "Martian Mono Var, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "clamp(4rem, 16vw, 12rem)"
    fontWeight: 200
    lineHeight: 1
    letterSpacing: "-0.05em"
    fontFeature: "'tnum'"
  data:
    fontFamily: "Martian Mono Var, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "'tnum'"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  pill: "999px"
spacing:
  gap-sm: "12px"
  gap-md: "24px"
  gap-lg: "40px"
  panel-pad: "28px"
  gutter: "clamp(20px, 4.5vw, 64px)"
  section-pad: "clamp(80px, 13vw, 176px)"
  wrap-max: "1280px"
components:
  button-primary:
    textColor: "{colors.mist}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "64px"
    padding: "0 30px"
  button-primary-hover:
    textColor: "{colors.text}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.mist}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  input-link:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "64px"
    padding: "0 22px"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 14px"
  segmented-option:
    textColor: "{colors.muted}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: "52px"
  segmented-option-checked:
    backgroundColor: "{colors.lilac-wash}"
    textColor: "{colors.mist}"
  panel:
    backgroundColor: "{colors.scrim}"
    rounded: "{rounded.md}"
    padding: "28px"
  progress-counter:
    textColor: "{colors.mist}"
    typography: "{typography.figure}"
  state-pill:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "9px 14px"
---

# Design System: Downly

## Overview

**Creative North Star: "El portal de luz"**

Downly no es un formulario con fondo decorado: es un campo de luz viva a pantalla completa (un fragment shader WebGL de cintas de luz punteada sobre azul casi negro) y la interfaz flota encima como tipografía y líneas de 1px. Pegar un link es el gesto principal, y todo el resto del sistema existe para que ese gesto se sienta como acercarse a una fuente de luz, no como llenar un trámite. El mundo es nocturno, frío y silencioso; lo único cálido es el ember, y aparece cuando algo responde o avanza.

La tensión tipográfica es el carácter: un Archivo condensado al 62% de ancho, enorme y en mayúsculas, frente a rótulos de 12px muy espaciados y ensanchados al 118%. Entre ambos extremos hay poco: un cuerpo de 16px y un lead de 20px que solo sirven para leer. El espacio es amplio y la densidad baja; las secciones de producto se separan con una hairline con cruz, no con bloques de color. Los paneles funcionales (vista previa, opciones, progreso) son vidrio oscuro con borde de 1px, sin sombra, y existen solo mientras la herramienta los necesita.

El sistema rechaza la plantilla SaaS clara y la web de descargas llena de banners; cada superficie nueva debe leerse como parte del mismo campo nocturno.

**Key Characteristics:**
- Un campo WebGL fijo detrás de todo; la interfaz es tipografía y hairlines encima.
- Paleta fría de cinco tonos más un único acento cálido (ember) reservado a respuesta y avance.
- Archivo condensado enorme (wdth 62, peso 560) contra rótulos diminutos ensanchados (wdth 118, tracking 0.18em).
- Líneas de 1px como estructura; grano de película al 4% sobre todo.
- Martian Mono ligera para toda cifra: contador de progreso, metadatos, límites.
- El campo reacciona a la app: la energía sube al analizar o descargar y el ember crece con el progreso.

## Colors

Paleta de noche azul-violeta con un solo punto de calor; el color se reparte por capas de luz, no por superficies planas.

### Primary
- **Lila de portal** (`lilac`): color de estado firme. Borde del botón primario, opción seleccionada, foco de los campos, casilla marcada y punto de reposo del indicador de estado. Es la voz "activa pero tranquila".
- **Bruma** (`mist`): la luz alta. Titulares, marca, texto de botones, cifras y enlaces. Nunca se usa como relleno de una superficie; la única excepción es la selección de texto, que invierte bruma sobre vacío.

### Secondary
- **Ember incandescente** (`ember`): el único acento cálido. Reservado a hover, foco global y avance: hover de botones, opciones, enlaces, cursor-anillo y filas; el frente de la barra de progreso; el punto del indicador de estado mientras trabaja; el cursor de texto (caret). En el shader es apenas un tinte en la cresta inferior derecha en reposo y crece con el progreso.

### Neutral
- **Vacío** (`void`): fondo base y base del scrim; también relleno de los pulgares del rango y del punto del riel.
- **Tinta** (`ink`): fondo de las opciones desplegables de los select y segundo tono del degradado del campo.
- **Noche** (`night`): halo inferior derecho del fondo y relleno de miniaturas mientras cargan.
- **Texto** (`text`): cuerpo de lectura sobre el campo.
- **Apagado** (`muted`): texto secundario, placeholders, rótulos de campo, metadatos.
- **Línea** (`line`) y **Línea fuerte** (`line-strong`): hairlines de 1px; la fuerte para bordes de controles y la cruz, la suave para separadores y paneles.
- **Scrim** (`scrim`) y **Campo** (`field`): capas de vidrio oscuro para paneles y entradas, para que el texto no compita con el shader.
- **Velo lila** (`lilac-wash`): relleno de la opción seleccionada.

### Estados funcionales
- **Error** (`error`) y **Éxito** (`success`): coral suave y verde menta, solo para el mensaje de estado de la herramienta. No forman parte de la paleta del mundo y no se usan como decoración.

### Named Rules
**The One Ember Rule.** El ember es el único cálido y responde o avanza; jamás decora en reposo. Un elemento estático nunca es ember.
**The Light, Not Surface Rule.** El color se construye con luz sobre el vacío (shader, gradientes, tintes de lila de baja opacidad), no con superficies planas rellenas de color.

## Typography

**Display Font:** Archivo variable (Archivo Var, con Arial Narrow y Arial de respaldo), ejes wdth 62-125 y wght 100-900, alojada localmente.
**Body Font:** Archivo variable al ancho normal (100%).
**Label/Mono Font:** Martian Mono variable (con ui-monospace, Cascadia Mono, Consolas de respaldo), alojada localmente. Ambas con licencia OFL.

**Character:** Un solo eje de familia usado en sus dos extremos: condensado y colosal para nombrar, ensanchado y diminuto para rotular. La mono ligera aporta el sentido de instrumento: todo número es tabular.

### Hierarchy
- **Display** (560, `clamp(3.5rem, 11.4vw, 10.5rem)`, 0.88): el H1 de una o dos líneas en mayúsculas, ancho 62%, color bruma. En pantallas de 560px o menos baja a `clamp(3.5rem, 19vw, 4.75rem)`.
- **Headline** (600, `clamp(2.25rem, 5.2vw, 4.25rem)`, 0.95): un H2 por sección de producto, mayúsculas, ancho 62%, máximo 16ch y balanceado.
- **Title** (600, 1.5rem, 1.2): títulos de paso; el título del video en la vista previa y el de historial usan el paso Lead (1.25rem) en 600.
- **Lead** (400, 1.25rem, 1.45): una frase bajo el H1, máximo 40ch.
- **Body** (400, 1rem, 1.55): texto corrido; descripciones con máximo 62ch (pasos 34ch).
- **Small** (400, 0.875rem): pistas, metadatos y pie.
- **Label** (500, 0.75rem, 0.18em, mayúsculas, wdth 118): navegación, rótulos de campo, términos de las especificaciones, fase del progreso.
- **Button** (600, 0.875rem, 0.16em, mayúsculas, wdth 118): texto de botones y opciones segmentadas.
- **Figure** (Martian Mono 300, `clamp(3rem, 8.5vw, 6.5rem)`, tracking -0.04em): el contador de progreso; la intro usa la misma voz a `clamp(4rem, 16vw, 12rem)` con peso 200.
- **Data** (Martian Mono 400, 0.875rem, tabular): metadatos, salida del rango, cifras de límites (a 1.25rem) e historial (a 0.75rem).

### Named Rules
**The Two Extremes Rule.** La jerarquía se resuelve por contraste de extremos (condensado colosal contra rótulo ensanchado de 12px), no por una escalera de pesos intermedios.
**The Tabular Rule.** Toda cifra que cambia o se compara va en Martian Mono con dígitos tabulares.
**The Shout Stays in Archivo Rule.** Solo Display y Headline van en mayúsculas condensadas al 62%; el cuerpo nunca se condensa.

## Layout

Una sola columna de contenido a la izquierda sobre un campo que ocupa toda la pantalla; las cintas de luz viven a la derecha y el texto a la izquierda. El contenedor `wrap` mide `min(100% - 2 × gutter, 1280px)` con un gutter fluido de 20 a 64px (`clamp(20px, 4.5vw, 64px)`). La primera pantalla apila H1, lead y herramienta; el hero deja `clamp(120px, 19vh, 220px)` arriba para la cabecera absoluta.

El ritmo es generoso y no sigue una escala cerrada: huecos de 12px entre campo y botón, 24px entre paneles, 40px entre columnas de pasos y especificaciones, y separación de sección de `clamp(80px, 13vw, 176px)`. El espacio de trabajo es una cuadrícula 5fr / 7fr (vista previa a la izquierda, opciones a la derecha) con el progreso ocupando toda la fila; la vista previa es pegajosa a 24px mientras no hay progreso visible.

Adaptación: a 960px la cuadrícula pasa a una columna, los pasos se apilan, la navegación conserva solo GitHub y desaparecen el indicador de estado y el riel de scroll. En escritorio el indicador también se aparta mientras el espacio de trabajo está abierto y cuando llega el pie, para no tapar controles ni enlaces. A 560px la fila del link se apila, los campos en pareja pasan a una columna, el hero ocupa `100svh` y el contador de progreso se coloca sobre la barra. En pantallas de menos de 760px el shader baja las cintas al espacio libre bajo el botón. El build se midió sin desborde a 1440, 390, 360 y 320px.

## Elevation & Depth

Plano por defecto: la profundidad viene de capas de luz y de vidrio, no de sombras. El campo shader es el fondo; el grano (opacidad 0.04) lo cubre; los paneles son scrims oscuros de 74% con borde de 1px. Al hacer scroll, el campo se retira de la primera pantalla para que el texto mande.

### Shadow Vocabulary
- **Brasa de botón** (`box-shadow: 0 14px 34px -14px rgba(255, 106, 61, 0.6)`): brillo ember suave bajo el botón primario solo en hover; en `:active` se reduce a `0 6px 18px -8px`.
- **Anillo de foco de campo** (`box-shadow: 0 0 0 3px rgba(106, 108, 246, 0.32)`): halo lila alrededor de un campo enfocado.
- **Halo del titular** (`text-shadow: 0 6px 48px rgba(11, 13, 26, 0.75)`): sombra difusa oscura tras el H1 para separarlo de la luz del shader.

### Named Rules
**The Flat Until Touched Rule.** Ninguna sombra en reposo sobre paneles o botones; la única sombra con color es la brasa ember y aparece solo en hover.
**The Soft Glow Only Rule.** Toda sombra es un resplandor difuso; no hay sombras duras desplazadas.

## Shapes

Esquinas contenidas y geometría fina. Los botones, el campo del link y los paneles usan 8px; los campos de formulario, las opciones segmentadas y la miniatura 6px; casillas y miniaturas del historial 4px; el indicador de estado es una píldora; el pulgar del rango, el cursor-anillo y los puntos son círculos. Los bordes son siempre de 1px (1.5px solo en el pulgar del rango); los separadores son hairlines, no cajas.

Firma geométrica: la **hairline con cruz**, una línea de 1px con una marca vertical de 13px al centro. Cierra la cabecera (junto a la marca) y abre cada sección de producto. La barra de progreso usa una máscara de segmentos de 3px cada 8px, de 12px de alto, con esquinas rectas.

## Components

Instrumentos de precisión sobre vidrio oscuro: bordes de 1px, rótulos ensanchados y respuesta ember al tacto.

### Buttons
- **Shape:** esquinas de 8px (`rounded.md`), 64px de alto (60px el de descargar, que ocupa todo el ancho), padding horizontal 30px.
- **Primary:** texto bruma en mayúsculas ensanchadas, degradado vertical de lila de 34% a 10% de opacidad y borde de 1px lila; incluye una flecha de trazo de 20px.
- **Hover / Focus:** el borde pasa a ember, el texto sube a `text` y aparece la brasa de botón; el foco visible es un contorno ember de 2px con 3px de separación. Deshabilitado: 50% de opacidad.
- **Ghost:** 40px de alto, fondo transparente, borde de línea fuerte y texto de 0.75rem; para acciones secundarias como "Borrar historial".

### Inputs / Fields
- **Style:** vidrio oscuro (`field`), borde de línea fuerte de 1px; el del link mide 64px y 8px de radio, los demás 48px y 6px. Los select llevan un chevron de trazo bruma.
- **Hover:** el borde se aclara.
- **Focus:** borde lila y anillo lila de 3px, sin contorno; el cursor de texto es ember.
- **Disabled:** 50% de opacidad.

### Segmented option (Video / Solo audio)
- Dos opciones en cuadrícula de 52px de alto, borde de línea fuerte, texto apagado. Seleccionada: borde lila, texto bruma y velo lila. Hover: borde ember y texto `text`.

### Checkbox and range
- Casilla de 22px con radio de 4px; marcada, borde lila y una marca bruma recortada por clip-path. Rango con pista de 2px y pulgar circular de 20px con borde bruma que pasa a ember en hover; la salida va en mono tabular.

### Panels (vista previa, opciones, progreso)
- Scrim oscuro de 74%, borde de línea de 1px, 8px de radio, relleno de 20px (vista previa) o 28px (opciones y progreso); sin sombra. Dentro, los grupos se separan con una hairline superior y 22px de relleno, no con cajas anidadas. Son contenedores funcionales de la herramienta, no un patrón para el contenido de producto.

### Navigation
- Cabecera absoluta sobre el campo: marca en Archivo 125% con tracking 0.42em en bruma, hairline con cruz que se estira y navegación en rótulos. Hover: el enlace pasa a ember. Bajo 960px solo queda el enlace a GitHub.

### Progress counter (componente firma)
- El porcentaje en Martian Mono 300 enorme, bruma y tabular, junto a una barra punteada por máscara cuyo frente va de lila a bruma a ember; debajo, la fase en rótulo y los metadatos (velocidad, tiempo restante) en mono. Mientras aparece, el shader sube su energía y el ember crece con el mismo avance. La intro de sesión reutiliza esta voz: un contador de 000 a 100 sobre vacío.

### Product rows (pasos, especificaciones, límites)
- Contenido de producto en líneas, sin tarjetas: filas separadas por hairlines de 1px. Los pasos llevan un ordinal mono y un título; las especificaciones son pares término-descripción en dos columnas (1fr / 3fr); en los límites la cifra ocupa el término en mono a 1.25rem. Hover: la hairline superior pasa a ember.

### Portal field, cursor and state chrome
- El campo shader es fijo, con relleno en CSS (degradado noche sobre vacío) si WebGL no está disponible. El cursor-anillo (30px, borde bruma al 50%) existe solo con puntero fino y sin movimiento reducido; crece a 1.73 y se vuelve ember sobre elementos interactivos, y se oculta sobre campos de texto. En escritorio, un indicador de estado en píldora (punto lila en reposo, ember mientras trabaja) y un riel de scroll fino acompañan el borde derecho.
- Movimiento: curva `cubic-bezier(0.16, 1, 0.3, 1)`. Los elementos del hero entran con desplazamiento de 32px y opacidad en 1s, escalonados 110ms. Con `prefers-reduced-motion` no hay intro, cursor ni animación del shader (se dibuja un solo cuadro fijo) y las transiciones se reducen a 0.01ms.

## Do's and Don'ts

### Do:
- **Do** dejar el ember para hover, foco, avance y el cursor de texto; en el campo shader, apenas un tinte en reposo que crece con el progreso.
- **Do** sostener la tensión Display 62% enorme contra Label 118% de 12px, y poner toda cifra en Martian Mono tabular.
- **Do** estructurar con hairlines de 1px (`line`, `line-strong`) y la hairline con cruz al abrir una sección nueva.
- **Do** colocar el texto sobre scrims oscuros de 72-74% cuando quede encima de las cintas de luz, y verificar el contraste sobre el campo real.
- **Do** mantener el campo legible con movimiento reducido: un cuadro fijo del shader, sin cursor ni intro.
- **Do** contar en español y con "link", "descargar", "solo audio" y "calidad", tal como fija PRODUCT.md.

### Don't:
- **Don't** usar fondos claros ni la plantilla SaaS de tarjetas con sombra; el mundo es vacío nocturno.
- **Don't** introducir un segundo acento cálido ni pintar de ember algo estático.
- **Don't** convertir contenido de producto en tarjetas rellenas; usar filas con hairlines. Los paneles de vidrio se reservan a la herramienta.
- **Don't** usar sombras duras desplazadas ni resplandores de color en reposo.
- **Don't** condensar el cuerpo de texto ni subir Display o Headline a otra cara; la voz colosal es solo Archivo al 62%.
- **Don't** imitar la estética de las webs de descarga con banners, contadores falsos o botones engañosos.
- **Don't** colocar un rótulo diminuto encima de un titular a modo de antetítulo; los rótulos ya tienen trabajo funcional (navegación, campos, términos, fase).
