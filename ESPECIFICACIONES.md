### 1. El Empaquetador y Base: Vite + TypeScript

Olvídate de frameworks pesados con SSR (como Next.js) porque tu web va a ser 100% estática y gratuita de alojar (Cloudflare Pages o GitHub Pages).

* **Vite (v6+):** Arranca en milisegundos en Windows y genera una carpeta `dist/` estática lista para subir a cualquier hosting gratuito.
* **TypeScript:** Imprescindible aquí porque el JSON de REData (`JSON:API`) tiene varios niveles de anidación (`data -> included -> attributes -> values`) y tipar la respuesta te ahorrará muchos errores con valores nulos (por ejemplo, cuando la solar cae a `0` de noche).

---

### 2. ¿Qué Framework elegir para este caso concreto?

Para pintar un circuito interactivo tienes dos caminos excelentes según cómo prefieras trabajar los gráficos:

#### Opción A: React 19 + Vite (Recomendada si quieres usar nodos ya hechos)

* **Por qué elegirlo:** Tienes acceso a **React Flow (`@xyflow/react`)**, una librería brutal y gratuita para crear esquemas de nodos y cables interactivos. Ya trae resuelto el zoom, el encuadre automático en móvil/escritorio, las curvas Bézier de los cables y la animación de partículas circulando por ellos.
* **Gestión de estado:** **Zustand** (minúsculo, sin *boilerplate*).

#### Opción B: Angular (Standalone + Signals + Zoneless)

* **Por qué elegirlo:** Si prefieres dibujar tu propio esquema SVG a medida sin depender de librerías de nodos externas, el motor de **Signals (`signal`, `computed`)** de las versiones modernas de Angular es perfecto para este proyecto.
* **Ventaja técnica:** Puedes enlazar directamente señales calculadas a los atributos del SVG (`[attr.stroke-width]="cableWidth()"`, `[style.--flow-speed]="speed()"`). Como casi toda la interactividad de la web (mover el slider de 24h, apagar la nuclear, elegir la lavadora) son **cálculos matemáticos derivados** sobre el mismo JSON, con `computed()` toda la pantalla se recalcula sola de forma quirúrgica sin re-renderizar el árbol entero.

---

### 3. Librerías clave para el efecto "Circuito Vivo" (pocas y muy específicas)

No necesitas librerías de gráficas tradicionales (ni Chart.js ni ECharts), porque queremos huir de las gráficas de barras. Necesitas este kit ligero:

1. **Motor gráfico: SVG declarativo + Variables CSS (o `@xyflow/react`)**
* **Por qué SVG y no Canvas/WebGL:** Tu circuito tendrá unos 12 nodos fijos (6 tecnologías + 1 nodo central + 4 fronteras + 1 electrodoméstico). En SVG cada cable es un `<path>` al que puedes darle efecto de neón con CSS (`filter: drop-shadow(...)`) y animar el flujo de electricidad simplemente usando `stroke-dasharray` y un `@keyframes` cuya duración (`animation-duration`) cambie dinámicamente según los megavatios. Además, nunca se pixela y es facilísimo hacer clic o *hover* sobre cada central.


2. **`d3-scale` (Solo ese micro-paquete de ~5 KB, no todo D3.js):**
* En la red eléctrica, la Eólica puede estar generando **11.000 MW** y la Hidráulica **800 MW**. Si multiplicas a ojo para el grosor del cable, uno será invisible y otro tapará la pantalla.
* Con `scaleSqrt()` o `scaleLinear()` de `d3-scale` conviertes cualquier rango real de megavatios (`[0, 15000]`) en un rango visual seguro y estético:
* Grosor del cable: de `2px` a `22px`.
* Velocidad de animación: de `6s` (lento) a `0.4s` (muy rápido).




3. **Tailwind CSS v4:**
* Para este tipo de visualizaciones, un **modo oscuro tipo "panel de control energético"** (fondos `bg-slate-950`, paneles translúcidos con `backdrop-blur-md` y bordes sutiles) hace que los colores oficiales que devuelve el JSON de REData resalten como luces de neón.


4. **Lucide Icons (`lucide-react` o `lucide-angular`):**
* Trae todos los iconos vectoriales limpios que necesitas: `Wind` (Eólica), `Sun` (Solar), `Atom` (Nuclear), `Waves` (Hidráulica), `Flame` (Gas), `BatteryCharging` (Almacenamiento), `Smartphone`, `WashingMachine`, `Car`, `AirVent`.



---

### 4. Arquitectura del Frontend (Simple, de 3 capas)

El secreto para que la web vaya a **60 FPS** y no sature la API de Red Eléctrica es **descargar el día completo una sola vez al cargar la página** y hacer toda la interactividad en memoria:

```text
src/
├── api/
│   ├── redata.client.ts      # Fetch a los 4 endpoints de apidatos.ree.es
│   └── redata.mapper.ts      # ¡CLAVE! Convierte el JSON:API crudo en un objeto limpio
├── models/
│   └── grid.types.ts         # Interfaces: TechnologyNode, BorderFlow, HourlyPrice
├── state/
│   └── grid.store.ts         # Estado reactivo (Zustand o Angular Signals)
├── utils/
│   └── scales.ts             # Funciones d3-scale (MW -> grosor px y velocidad seg)
└── components/
    ├── CircuitCanvas.tsx     # El SVG central con los cables (<path>) y nodos
    ├── GeneratorNode.tsx     # Tarjeta de cada central con su switch ON/OFF
    ├── CentralPlugHub.tsx    # El enchufe central + selector de electrodomésticos
    ├── BorderConnections.tsx # Salidas a Francia, Portugal, Marruecos y Andorra
    └── TimeSliderBar.tsx     # Barra inferior de 00:00 a 23:59

```

#### Cómo funciona el flujo de datos en memoria:

1. **Capa 1: El Normalizador (`redata.mapper.ts`):**
El JSON de REData es verboso. Nada más recibir los 4 `fetch` en paralelo (`Promise.all`), tu *mapper* los cruza por hora y devuelve un array limpio de 24 posiciones (una por hora del día):
```typescript
export interface GridHourSnapshot {
  hour: string;             // "13:00"
  demandMW: number;         // 28450
  priceEurMWh: number;      // 45.20
  co2Tons: number;          // 3120
  generators: {
    id: string;             // "eolica"
    title: string;          // "Eólica"
    color: string;          // "#6fb114" (viene directo de la API)
    renewable: boolean;
    mw: number;             // 8450.2
    percentage: number;     // 0.342
  }[];
  borders: {
    country: 'FR' | 'PT' | 'MA' | 'AD';
    flowMW: number;         // Positivo = Importando, Negativo = Exportando
  }[];
}

```


2. **Capa 2: El Motor Reactivo (`grid.store.ts`):**
Guardas ese array de 24 horas en memoria y solo tienes **4 variables de control de usuario**:
* `selectedHourIndex` (por defecto, la hora actual).
* `disabledGeneratorIds` (array con las centrales que el usuario ha "apagado" con el interruptor para simular qué pasaría).
* `selectedApplianceWatts` (por defecto `2200` W de un horno/lavadora).
* `geoRegion` (`peninsular`, `canarias`, `baleares` — este es el único cambio que dispara un nuevo `fetch`).


3. **Capa 3: La Animación CSS sin coste de CPU:**
En lugar de animar partículas con JavaScript en cada fotograma, pasas los valores calculados como **variables CSS** a cada cable SVG:
```css
.energy-cable {
  stroke: var(--tech-color);
  stroke-width: var(--cable-width); /* Calculado de 2px a 20px según MW */
  stroke-dasharray: 8 12;
  animation: flow var(--flow-duration) linear infinite;
}
@keyframes flow {
  to { stroke-dashoffset: -20; }
}

```


Si el flujo es exportador (hacia Francia), inviertes `stroke-dashoffset: 20`. Si una central está en `0 MW` o el usuario la apaga con el switch, pones `animation: none` y `opacity: 0.2`.

---

### 5. Truco rápido en tu entorno (Windows + Node 26)

Antes de crear el proyecto visual, puedes abrir PowerShell en cualquier carpeta, crear un archivo `test-ree.ts` y ejecutarlo directamente con `node test-ree.ts` (gracias al soporte nativo de TypeScript en Node 26 y a su `fetch` integrado) para ver los datos reales que están entrando ahora mismo en España:

```typescript
// test-ree.ts -> Ejecutar con: node test-ree.ts
const hoy = new Date().toISOString().split('T')[0];
const url = `https://apidatos.ree.es/es/datos/generacion/estructura-generacion?start_date=${hoy}T00:00&end_date=${hoy}T23:59&time_trunc=day`;

const res = await fetch(url, { headers: { Accept: 'application/json' } });
const json = await res.json();

console.table(
  json.included.map((item: any) => ({
    Tecnologia: item.attributes.title,
    Tipo: item.attributes.type,
    Color: item.attributes.color,
    MWh_Hoy: Math.round(item.attributes.values[0]?.value ?? 0),
    Porcentaje: ((item.attributes.values[0]?.percentage ?? 0) * 100).toFixed(1) + '%'
  }))
);
