import type { GeoRegion } from '../models/grid.types';

export interface REEIncludedItem {
  id: string;
  type: string;
  attributes: {
    title: string;
    description?: string;
    color?: string;
    type?: string;
    magnitude?: string;
    values?: Array<{
      value: number;
      percentage?: number;
      datetime: string;
    }>;
    content?: Array<{
      type: string;
      id: string;
      attributes: {
        title: string;
        type?: string;
        color?: string;
        values?: Array<{
          value: number;
          percentage?: number;
          datetime: string;
        }>;
      };
    }>;
  };
}

export interface REEResponse {
  data?: {
    type: string;
    id: string;
    attributes: {
      title: string;
      'last-update': string;
    };
  };
  included?: REEIncludedItem[];
  errors?: Array<{
    status: string;
    title: string;
    detail: string;
  }>;
}

const REE_BASE_URL = 'https://apidatos.ree.es/es/datos';

/**
 * Perform a safe fetch to Red Eléctrica de España open JSON:API
 */
export async function fetchREEWidget(
  endpointPath: string,
  startDateStr: string,
  endDateStr: string,
  timeTrunc: 'hour' | 'day' = 'hour',
  geoParams?: { limit?: string; ids?: string; trunc?: string }
): Promise<REEResponse | null> {
  const url = new URL(`${REE_BASE_URL}/${endpointPath}`);
  url.searchParams.set('start_date', `${startDateStr}T00:00`);
  url.searchParams.set('end_date', `${endDateStr}T23:59`);
  url.searchParams.set('time_trunc', timeTrunc);

  if (geoParams?.trunc) {
    url.searchParams.set('geo_trunc', geoParams.trunc);
  }
  if (geoParams?.limit) {
    url.searchParams.set('geo_limit', geoParams.limit);
  }
  if (geoParams?.ids) {
    url.searchParams.set('geo_ids', geoParams.ids);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[REE Client] ${endpointPath} returned status ${response.status}`);
      return null;
    }

    const json = (await response.json()) as REEResponse;
    if (json.errors && json.errors.length > 0) {
      console.warn(`[REE Client] ${endpointPath} reported error:`, json.errors[0]?.detail);
      return null;
    }

    return json;
  } catch (error) {
    console.warn(`[REE Client] Failed to fetch ${endpointPath}:`, (error as Error).message);
    return null;
  }
}

/**
 * Fetch all essential datasets for a specific region and date in parallel
 */
export async function fetchAllGridData(region: GeoRegion, dateStr: string) {
  const geoConfig: Record<GeoRegion, { limit: string; ids: string; trunc: string }> = {
    peninsular: { limit: 'peninsular', ids: '8741', trunc: 'electric_system' },
    canarias: { limit: 'canarias', ids: '8742', trunc: 'electric_system' },
    baleares: { limit: 'baleares', ids: '8743', trunc: 'electric_system' }
  };

  const geo = geoConfig[region];

  // Run in parallel
  const [
    demandData,
    pricesData,
    generationData,
    balanceData,
    emissionsData,
    franciaData,
    portugalData,
    marruecosData,
    andorraData
  ] = await Promise.all([
    fetchREEWidget('demanda/demanda-tiempo-real', dateStr, dateStr, 'hour', geo),
    fetchREEWidget('mercados/precios-mercados-tiempo-real', dateStr, dateStr, 'hour', geo),
    fetchREEWidget('generacion/estructura-generacion', dateStr, dateStr, 'day', geo),
    fetchREEWidget('balance/balance-electrico', dateStr, dateStr, 'day', geo),
    fetchREEWidget('generacion/no-renovables-detalle-emisiones-CO2', dateStr, dateStr, 'day', geo),
    fetchREEWidget('intercambios/francia-frontera-programado', dateStr, dateStr, 'day'),
    fetchREEWidget('intercambios/portugal-frontera-programado', dateStr, dateStr, 'day'),
    fetchREEWidget('intercambios/marruecos-frontera-programado', dateStr, dateStr, 'day'),
    fetchREEWidget('intercambios/andorra-frontera-programado', dateStr, dateStr, 'day')
  ]);

  return {
    demandData,
    pricesData,
    generationData,
    balanceData,
    emissionsData,
    bordersData: {
      francia: franciaData,
      portugal: portugalData,
      marruecos: marruecosData,
      andorra: andorraData
    }
  };
}
