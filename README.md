# ⚡ El Viaje de un Vatio

> **Anatomía de tu enchufe y del sistema eléctrico español en tiempo real.**  
> Una experiencia visual interactiva que transforma los datos abiertos de Red Eléctrica de España en un circuito vivo a pantalla completa.

---

## 💡 ¿De qué trata este proyecto?

La mayoría de plataformas energéticas representan el sistema eléctrico mediante complejas tablas de datos o gráficos bursátiles difíciles de interpretar para el ciudadano de a pie. 

**El Viaje de un Vatio** reimagina esta experiencia concibiendo la red eléctrica española como un **circuito vivo (estilo placa base minimalista con estética *dark mode neon*)**. En lugar de números abstractos, el usuario puede ver y sentir cómo fluye la energía por los "cables" (líneas vectoriales SVG) mediante pulsos de luz cuya **velocidad** y **grosor** varían en tiempo real según los megavatios (MW) que se están generando y consumiendo en cada instante.

La aplicación permite responder al instante a preguntas cotidianas como:
* *¿Cuántos vatios de mi lavadora vienen del viento o del sol ahora mismo?*
* *¿Cuánto me cuesta y cuánto CO₂ emite poner el horno a esta hora?*
* *¿Qué ocurriría con la estabilidad del país si de repente apagáramos la energía nuclear o los parques eólicos?*
* *¿Estamos importando energía de Francia o exportándola a Portugal y Marruecos?*

---

## 🎮 Funcionalidades Principales

### 1. El Circuito Vivo en Tres Bloques
* **Bloque Izquierdo (Centrales Generadoras):** Nodos interactivos para cada fuente de energía del mix (Eólica, Solar Fotovoltaica, Hidráulica, Nuclear, Ciclo Combinado de Gas, Almacenamiento/Baterías, Motores Diésel, etc.). Cada tarjeta muestra los MW generados, el porcentaje del mix, emisiones de CO₂ y cuenta con un **interruptor ON/OFF**.
* **Bloque Central (El Corazón de la Red y tu Enchufe):** Confluencia de todos los flujos donde se monitoriza la **Demanda Real en vivo** vs. la Prevista por REE, el **porcentaje de energía limpia**, el factor de emisión de CO₂ y el **precio regulado (PVPC) en €/MWh**.
* **Bloque Derecho (Fronteras e Interconexiones):** Monitorización de los intercambios internacionales con **Francia, Portugal, Marruecos y Andorra**, así como el enlace submarino peninsular en las islas. Las partículas invierten el sentido de la animación según si España está importando o exportando electricidad.

### 2. Modo "¿De qué se alimenta mi electrodoméstico?"
Permite seleccionar dispositivos de consumo habitual:
* 📱 **Cargar el móvil** (15 W)
* 🧺 **Lavadora / Horno** (2.200 W)
* ❄️ **Aire Acondicionado / Bomba de calor** (1.200 W)
* 🚗 **Coche Eléctrico (Wallbox)** (7.400 W)

El sistema calcula en tiempo real el desglose exacto de vatios asignados a cada tecnología según el mix de esa hora, el **coste horario exacto en céntimos de euro (€)** y los **gramos de CO₂ generados**.

### 3. El Viajero del Tiempo (Slider 24 Horas)
Una barra de control temporal inferior (`00:00` a `23:59`) con botón de reproducción automática (*Auto-Play*). Permite deslizar el tiempo para comprender los ciclos energéticos:
* La eólica y nuclear dominando las madrugadas.
* El estallido solar al mediodía (abaratando drásticamente el precio de la electricidad).
* La activación vespertina de las presas hidroeléctricas y las centrales de ciclo combinado para cubrir la cena.

### 4. Modo Simulador de Déficit ("¿Qué pasa si apagamos...?")
Al pulsar el interruptor de cualquier tecnología (por ejemplo, desconectar la Nuclear o la Eólica), la red entra en estado de alerta visual:
* Calcula instantáneamente el **déficit de megavatios**.
* Muestra el impacto en **millones de hogares** que se quedarían sin suministro eléctrico.
* Calcula el factor multiplicador por el que habría que aumentar la quema de gas en ciclo combinado para suplir la carencia.
* Ofrece un botón de restablecimiento inmediato de la red.

### 5. Multirregión y Sistemas Aislados
Selector de sistemas eléctricos configurado con los parámetros geográficos oficiales de REE:
* 🇪🇸 **Península Ibérica**
* 🏝️ **Canarias:** Representación fidedigna de un sistema insular aislado sin cables submarinos al continente, con presencia de tecnologías térmicas específicas (turbinas de gas, diésel).
* ⛵ **Baleares:** Visualización del cable submarino HVDC de interconexión con la Península.

### 6. Fichas Educativas y Divulgativas
Hacer clic en cualquier tarjeta de generación abre un modal detallado con la explicación técnica de la tecnología, su factor de emisión oficial ($gCO_2/kWh$), su papel en la transición ecológica y sus magnitudes en directo.

---

## 🛠️ Tecnologías Utilizadas

El proyecto ha sido diseñado priorizando la ligereza, la respuesta a 60 FPS y un coste de infraestructura de 0 €.

| Tecnología | Rol en el Proyecto | Justificación Técnica |
| :--- | :--- | :--- |
| **React 19** | Biblioteca de Interfaz | Gestión declarativa de la vista, componentes modulares y compatibilidad moderna. |
| **TypeScript** | Lenguaje Principal | Tipado estricto del estándar `JSON:API` de REData (`data -> included -> attributes -> values`), eliminando errores por nulos en horas valles. |
| **Vite 6+** | Build Tool & Dev Server | Arranque instantáneo en desarrollo y empaquetado optimizado en estático (`dist/`). |
| **Zustand** | Gestión del Estado | Store reactivo ligero (~1 KB) sin *boilerplate* para coordinar el snapshot horario, los interruptores del simulador y el electrodoméstico activo. |
| **d3-scale** | Matemáticas Visuales | Micro-módulo (~5 KB) de D3. Usa `scaleSqrt()` y `scaleLinear()` para normalizar rangos reales de potencia (de 0 a 15.000 MW) en grosores de cable SVG (de 2px a 20px) y duraciones de animación fluidas. |
| **SVG + CSS Variables** | Motor de Renderizado | Dibujo vectorial de curvas Bézier para los cables. La animación de partículas eléctricas se delega a `@keyframes` nativos de la GPU mediante `stroke-dasharray` y `stroke-dashoffset`, garantizando 60 FPS sin consumo de CPU. |
| **Vanilla CSS & Glassmorphism** | Diseño y Estilos | Estética *dark neon* (`#030712`, paneles translúcidos con `backdrop-filter: blur()`, sombras de neón dinámicas), sin dependencias pesadas de frameworks CSS. |
| **Lucide React** | Iconografía Vectorial | Iconos nítidos y coherentes para fuentes de energía, electrodomésticos y controles de interfaz. |
| **Oxlint** | Linter de Calidad | Análisis estático de código ultrarrápido basado en Rust. |

---

## 📡 Fuente de Datos: API de Red Eléctrica (REData)

La aplicación consume directamente la API REST pública de **Red Eléctrica de España** ([apidatos.ree.es](https://apidatos.ree.es/)):

* **Sin API Key ni registro:** Acceso totalmente abierto con cabecera `Accept: application/json`.
* **Diseño precalculado:** Los endpoints devuelven los colores hexadecimales oficiales de cada fuente energética (`#6fb114` para eólica, `#e48500` para solar, `#4a90e2` para nuclear, etc.) y los porcentajes de cuota de mercado.
* **Resiliencia & Fallback:** Incluye un generador de datos de respaldo calibrado (`mockData.ts`) con las curvas reales horarias de España para garantizar funcionamiento sin interrupciones ante caídas de la API externa o restricciones CORS.

### Endpoints principales consultados:

| Dimensión | Endpoint de REData | Frecuencia |
| :--- | :--- | :--- |
| **Demanda Eléctrica** | `demanda/demanda-tiempo-real` | Cada 5 minutos |
| **Estructura de Generación** | `generacion/estructura-generacion` | Horario / Diario |
| **Balance y Almacenamiento** | `balance/balance-electrico` | Horario / Diario |
| **Precios de Mercado** | `mercados/precios-mercados-tiempo-real` (PVPC y Spot) | Cada hora |
| **Emisiones Ambientales** | `generacion/no-renovables-detalle-emisiones-CO2` | Horario / Diario |
| **Interconexiones Internacionales** | `intercambios/{frontera}-frontera-programado` | Horario / Diario |

---

## 🏛️ Arquitectura del Software

La aplicación sigue un flujo unidireccional en 3 capas desacopladas:

```text
src/
├── api/
│   ├── redata.client.ts      # Cliente fetch para los endpoints REST de REE con timeout seguro
│   ├── redata.mapper.ts      # Transforma el JSON:API crudo en un array limpio de 24 Snapshots
│   └── mockData.ts           # Conjunto de datos calibrados para fallback y desarrollo offline
├── models/
│   └── grid.types.ts         # Contratos e interfaces (TechnologyNode, BorderFlow, HourlySnapshot)
├── state/
│   └── grid.store.ts         # Store centralizado (Zustand): estado reactivo, simulador y cálculos
├── utils/
│   └── scales.ts             # Escalado no lineal de d3-scale (MW -> px grosor y seg animación)
└── components/
    ├── Header.tsx            # Selector territorial (Península, Canarias, Baleares) y estado en vivo
    ├── CircuitCanvas.tsx     # Lienzo SVG dinámico que proyecta los cables animados entre nodos
    ├── GeneratorNode.tsx     # Tarjeta de central eléctrica interactiva con switch de apagado
    ├── CentralPlugHub.tsx    # Hub de demanda, precio, mix limpio y selector de electrodoméstico
    ├── BorderConnections.tsx # Indicadores de flujo con Francia, Portugal, Marruecos y Andorra
    ├── TimeSliderBar.tsx     # Barra temporal 00-23h con botón Play/Pausa e información horaria
    ├── DeficitAlert.tsx      # Alerta flotante de déficit energético en modo simulador
    └── TechDetailModal.tsx   # Modal divulgativo con información técnica por fuente de energía
```

### Funcionamiento en memoria:
1. Al iniciar o cambiar de territorio, se descargan los datos del día en paralelo (`Promise.all`).
2. El **Normalizador (`redata.mapper.ts`)** cruza las matrices horarias y genera un array en memoria de 24 posiciones.
3. El usuario puede arrastrar el slider horario o apagar tecnologías a voluntad: **no se repiten peticiones de red**. Todo el recálculo (vatios de la lavadora, déficit, costes, curvas de cables) se resuelve en memoria a 0 milisegundos de latencia.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js** (versión 18 o superior, compatible con Node 20 / 22 / 26).
* Gestor de paquetes `npm`.

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/magotonio/viaje-del-vatio.git
   cd viaje-del-vatio
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Comprobar la calidad del código (Linter):**
   ```bash
   npm run lint
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Genera una carpeta estática `dist/` ultraligera lista para alojar.

6. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

---

## ☁️ Despliegue

Al tratarse de una Single Page Application (SPA) 100% estática, puede alojarse de forma gratuita y sin servidor en plataformas como:
* **Cloudflare Pages**
* **Vercel**
* **GitHub Pages**
* **Netlify**

Solo requiere configurar el comando de construcción `npm run build` y la carpeta de salida `dist`.

---

## 📄 Licencia y Créditos

* **Datos energéticos:** Procedentes de la iniciativa Open Data de [Red Eléctrica de España (REE)](https://www.ree.es/) a través del servicio [REData](https://apidatos.ree.es/).
* **Iconos:** [Lucide Icons](https://lucide.dev/).
* Proyecto creado con propósitos divulgativos, educativos y de concienciación sobre la transición energética y el consumo responsable.
