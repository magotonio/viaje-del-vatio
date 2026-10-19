# El Viaje de un Vatio

- subdominio o nombre de directorio: elviajedeunvatio

- propuesta de repositorio para github: viaje-del-vatio

---

## 1. La Idea Visual: "Anatomía de tu Enchufe en Tiempo Real"

En lugar de mostrar tablas o gráficos bursátiles, la web presenta la red eléctrica española como **un circuito vivo (estilo placa base minimalista o diagrama de flujo animado)** a pantalla completa.

El lienzo se divide en tres zonas conectadas por "cables" (líneas SVG) por los que circulan partículas luminosas cuya **velocidad** y **grosor** dependen de los megavatios reales de ese instante:

1. **Bloque Izquierdo (Las Centrales Generadoras):**
* Un bloque de nodos con iconos animados para cada tecnología: **Eólica** (aspas que giran más rápido cuantos más MW producen), **Solar Fotovoltaica** (brillo proporcional a la producción), **Hidráulica**, **Nuclear**, **Ciclo Combinado (Gas)** y **Almacenamiento/Baterías**.
* Junto a las no renovables, un indicador de humo/carbono que crece según las toneladas de $CO_2$ emitidas en esa hora.


2. **Bloque Central (El Corazón de la Red y "Tu Enchufe"):**
* Todos los cables de las centrales confluyen en un gran nodo central que muestra la **Demanda Real en vivo (en MW)** comparada con la prevista por Red Eléctrica, el **porcentaje de energía limpia actual** y el **precio en tiempo real (€/MWh)**.


3. **Bloque Derecho (Las Fronteras Internacionales):**
* Cuatro cables que salen hacia **Francia, Portugal, Marruecos y Andorra**. Si el saldo es importador, las partículas viajan desde el país vecino hacia España; si es exportador, las partículas salen de España hacia fuera.



---

## 2. Cómo se conecta (Arquitectura a Coste 0 €)

La API de REData (`apidatos.ree.es`) es una API REST abierta que utiliza el estándar **JSON:API**.

* **Autenticación:** **Ninguna**. No requiere registro, ni cuenta, ni API Key.
* **Estructura de la URL:**
```text
https://apidatos.ree.es/{idioma}/datos/{categoria}/{widget}?start_date={inicio}&end_date={fin}&time_trunc={agrupacion}

```


* **Parámetros obligatorios en cada llamada**:
* `start_date`: Fecha/hora de inicio en formato ISO 8601 (`YYYY-MM-DDTHH:MM`).
* `end_date`: Fecha/hora de fin (`YYYY-MM-DDTHH:MM`).
* `time_trunc`: Nivel de agregación temporal (`hour`, `day`, `month`, `year`). *(Nota: en el widget `demanda-tiempo-real`, aunque pases `hour`, la API te devuelve los puntos exactos cada **5 minutos**)*.


* **Parámetros opcionales (para filtrar por territorio)**:
* `geo_trunc=electric_system`
* `geo_limit`: `peninsular`, `canarias`, `baleares`, `ceuta`, `melilla` o `ccaa`.
* `geo_ids`: El ID numérico de la región (por ejemplo, `8741` para Península, `8742` Canarias, `8743` Baleares, o del `1` al `21` para cada Comunidad Autónoma).



### Ejemplo de conexión directa en JavaScript

Solo necesitas enviar la cabecera `Accept: application/json`:

```javascript
async function obtenerDemandaTiempoReal() {
  // Pedimos el día de hoy completo
  const hoy = new Date().toISOString().split('T')[0];
  const url = `https://apidatos.ree.es/es/datos/demanda/demanda-tiempo-real?start_date=${hoy}T00:00&end_date=${hoy}T23:59&time_trunc=hour`;

  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const datosCrudos = await respuesta.json();
  return datosCrudos;
}

```

> **Consejo de arquitectura gratuita:** Puedes hacer el `fetch` directamente desde el navegador alojando la web gratis en GitHub Pages o Cloudflare Pages. Si en algún momento quieres evitar que cada visitante haga 4 llamadas al abrir la página, puedes poner un **Cloudflare Worker gratuito** (100.000 peticiones/día a 0 €) con `Cache-Control: max-age=300` (5 minutos). Así tu web carga en 10 milisegundos y a Red Eléctrica solo le llega 1 petición cada 5 minutos.

---

## 3. Qué datos pedir y cómo vienen en bruto

Con solo **4 endpoints** tienes absolutamente todo para alimentar la pantalla:

| Qué alimenta en tu diseño | Categoría / Widget (`{categoria}/{widget}`) | Frecuencia de los datos |
| --- | --- | --- |
| **El latido en vivo:** Demanda real, programada y prevista | `demanda/demanda-tiempo-real` | Cada **5 minutos** |
| **El mix y las fronteras:** Generación por tecnología + Almacenamiento + Saldo internacional | `balance/balance-electrico` o `generacion/estructura-generacion` | Horario / Diario |
| **El bolsillo:** Precio de la luz regulado (PVPC) y mercado mayorista (Spot) | `mercados/precios-mercados-tiempo-real` | Cada **hora** del día |
| **El impacto ambiental:** Emisiones de $CO_2$ por central y factor $tCO_2eq/MWh$ | `generacion/no-renovables-detalle-emisiones-CO2` | Horario / Diario |

### La gran ventaja del JSON de REData (ya trae diseño incluido)

Cuando llamas a un endpoint de REData, el JSON que devuelve tiene una lista llamada `included`. Dentro viene cada serie de datos y **Red Eléctrica ya te regala el color hexadecimal oficial (`color`) y el porcentaje precalculado (`percentage`)** de cada tecnología:

```json
{
  "data": {
    "type": "Generación por tecnología",
    "id": "gen1",
    "attributes": {
      "title": "Estructura de generación",
      "last-update": "2026-10-19T09:10:00.000+02:00"
    }
  },
  "included": [
    {
      "type": "Eólica",
      "id": "10288",
      "attributes": {
        "title": "Eólica",
        "color": "#6fb114",
        "type": "Renovable",
        "magnitude": "power",
        "values": [
          {
            "value": 8450.2,
            "percentage": 0.342,
            "datetime": "2026-10-19T09:00:00.000+02:00"
          }
        ]
      }
    },
    {
      "type": "Solar fotovoltaica",
      "id": "10289",
      "attributes": {
        "title": "Solar fotovoltaica",
        "color": "#e48500",
        "type": "Renovable",
        "values": [
          {
            "value": 4120.5,
            "percentage": 0.167,
            "datetime": "2026-10-19T09:00:00.000+02:00"
          }
        ]
      }
    }
  ]
}

```

* Fíjate en `percentage: 0.342`: puedes usar ese número directamente para multiplicar el grosor del cable SVG (`stroke-width`) y la velocidad de la animación CSS.
* Fíjate en `color: "#6fb114"`: puedes inyectar ese color directamente en tu dibujo sin tener que inventar una paleta desde cero.

---

## 4. Cómo es la interacción del usuario (Qué la hace única)

Para que un visitante entre y se quede trasteando varios minutos (y la comparta), la interfaz puede incluir **4 interacciones directas sobre el dibujo**:

### A. El Modo "¿De qué se alimenta mi electrodoméstico ahora mismo?"

En el centro del circuito pones 4 botones con iconos cotidianos:

* **Cargar el móvil (15 W)**
* **Lavadora / Horno (2.200 W)**
* **Aire Acondicionado (1.200 W)**
* **Coche Eléctrico (7.400 W)**

Cuando el usuario pulsa "Horno (2.200 W)", el diagrama recalcula los números en tiempo real usando el `percentage` de la API y el precio del endpoint `precios-mercados-tiempo-real`:

> *"Si enciendes el horno ahora mismo, **752 W** vienen del viento, **367 W** del sol, **440 W** de centrales nucleares y **310 W** de quemar gas. Te va a costar **0,24 € esta hora** y vas a emitir **180 gramos de $CO_2$**."*

### B. El "Viajero del Tiempo" (Slider de 24 horas)

Debajo del esquema colocas una barra deslizable de `00:00` a `23:59`.

* A medida que el usuario arrastra el control de la mañana al mediodía, ve visualmente cómo el sol sube, el cable naranja de la **Solar Fotovoltaica** se vuelve gigante al mediodía, las turbinas de gas se apagan casi por completo y el precio en €/MWh cae en picado.
* Al arrastrarlo hacia las `21:00`, ve cómo el cable solar desaparece y se encienden de golpe las presas **Hidráulicas** y el **Ciclo Combinado** para sostener el país.

### C. Interruptores "¿Qué pasa si apagamos...?" (Modo Simulador)

Cada nodo de generación (Nuclear, Eólica, Solar, Gas) tiene un interruptor de encendido/apagado (`ON/OFF`) en tu interfaz.

* Si el usuario apaga de golpe la **Eólica** o la **Nuclear**, el circuito central se tiñe de alerta (rojo/ámbar) mostrando el déficit instantáneo en megavatios (por ejemplo: *"Faltan 7.100 MW: equivale a dejar sin luz a 5,2 millones de hogares, o tendríamos que multiplicar por 3 la quema de gas"*).

### D. Selector de "Mundos Eléctricos" (Península vs. Islas vs. Comunidades)

Un selector visual arriba permite cambiar el parámetro `geo_limit`:

* Si el usuario pulsa en **Canarias** o **Baleares**, el circuito cambia por completo: desaparece la nuclear, aparecen los motores diésel y la turbina de gas, o se ve el cable submarino que conecta la Península con Baleares.
* Si elige su **Comunidad Autónoma** (datos históricos/mensuales), descubre si su región es una "isla exportadora" (como Extremadura o Castilla y León) o un "sumidero de consumo" (como Madrid).
