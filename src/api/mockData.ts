import type { GeoRegion, GridDayData, HourlySnapshot, TechnologyNode, BorderFlow } from '../models/grid.types';

// Official REE colors and emission factors (gCO2 / kWh)
export const REE_TECHS_METADATA: Record<string, { color: string; techType: 'renovable' | 'no-renovable' | 'almacenamiento' | 'enlace'; co2Factor: number; icon: 'wind' | 'sun' | 'waves' | 'atom' | 'flame' | 'battery' | 'factory' | 'cable'; description: string }> = {
  'eolica': {
    color: '#6fb114',
    techType: 'renovable',
    co2Factor: 0,
    icon: 'wind',
    description: 'Parques eólicos terrestres y marinos que aprovechan la fuerza del viento.'
  },
  'solar-fotovoltaica': {
    color: '#e48500',
    techType: 'renovable',
    co2Factor: 0,
    icon: 'sun',
    description: 'Paneles fotovoltaicos que convierten la radiación solar en electricidad.'
  },
  'hidraulica': {
    color: '#009fe3',
    techType: 'renovable',
    co2Factor: 0,
    icon: 'waves',
    description: 'Centrales hidroeléctricas y presas fluviales gestionables.'
  },
  'nuclear': {
    color: '#414896',
    techType: 'no-renovable',
    co2Factor: 0, // Zero direct CO2 emissions in operation
    icon: 'atom',
    description: 'Reactores nucleares que suministran energía base constante sin emisiones directas de CO2.'
  },
  'ciclo-combinado': {
    color: '#f59c00',
    techType: 'no-renovable',
    co2Factor: 370,
    icon: 'flame',
    description: 'Centrales térmicas que queman gas natural para cubrir picos de demanda.'
  },
  'cogeneracion': {
    color: '#a0a0a0',
    techType: 'no-renovable',
    co2Factor: 240,
    icon: 'factory',
    description: 'Producción simultánea de calor y electricidad en procesos industriales.'
  },
  'almacenamiento': {
    color: '#10b981',
    techType: 'almacenamiento',
    co2Factor: 0,
    icon: 'battery',
    description: 'Bombeo hidráulico y sistemas de baterías para almacenar excedentes y entregarlos en horas punta.'
  },
  'motores-diesel': {
    color: '#ef4444',
    techType: 'no-renovable',
    co2Factor: 650,
    icon: 'flame',
    description: 'Grupos electrógenos diésel utilizados para estabilidad en sistemas insulares.'
  },
  'turbina-gas': {
    color: '#f97316',
    techType: 'no-renovable',
    co2Factor: 490,
    icon: 'flame',
    description: 'Turbinas de gas de arranque rápido para respuesta inmediata en islas.'
  },
  'enlace-submarino': {
    color: '#06b6d4',
    techType: 'enlace',
    co2Factor: 0,
    icon: 'cable',
    description: 'Interconexión eléctrica submarina de alta tensión que une la Península con Baleares.'
  }
};

/**
 * Generate 24 realistic hourly snapshots for a given region.
 * Reflects real Spanish grid daily dynamics:
 * - Low demand at night (~20,000 MW), rising to morning peak (~30,000 MW) and evening peak (~31,500 MW).
 * - Solar curve: peaks between 11:00 and 16:00 (up to 14,000+ MW).
 * - Wind profile: breezes in evening/night, variable.
 * - Nuclear: flat 24h baseline (~6,500 MW).
 * - Gas / Hydro: ramp up at dusk (20:00 - 22:00) when solar disappears.
 */
export function generateRealisticDayData(region: GeoRegion = 'peninsular', baseDate?: string): GridDayData {
  const dateStr = baseDate || new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();

  const hourlySnapshots: HourlySnapshot[] = [];

  for (let h = 0; h < 24; h++) {
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;

    if (region === 'peninsular') {
      // 24h Demand profile in MW
      const demandBase = 21000 + Math.sin((h - 5) / 18 * Math.PI) * 9000;
      const eveningPeak = (h >= 19 && h <= 22) ? 3500 : 0;
      const lunchPeak = (h >= 12 && h <= 15) ? 2000 : 0;
      const demandReal = Math.round(demandBase + eveningPeak + lunchPeak);
      const demandForecast = Math.round(demandReal * (1 + (Math.sin(h * 1.5) * 0.02)));
      const demandScheduled = Math.round(demandReal * (1 - (Math.cos(h * 1.2) * 0.015)));

      // Solar profile (0 at night, bell curve 08:00 - 19:00, peak at 14:00)
      let solarMW = 0;
      if (h >= 7 && h <= 19) {
        const solarProgress = (h - 7) / 12; // 0 to 1
        solarMW = Math.round(Math.sin(solarProgress * Math.PI) * 13500);
      }

      // Nuclear baseline (~6300 MW)
      const nuclearMW = 6350;

      // Wind (varies 5000 to 9500 MW)
      const windMW = Math.round(6200 + Math.sin(h * 0.4) * 2200);

      // Solar thermal
      const solarThermalMW = h >= 10 && h <= 18 ? Math.round(1100 * Math.sin(((h - 10) / 8) * Math.PI)) : 0;

      // Cogeneration baseline (~2200 MW)
      const cogenMW = 2150;

      // Hydro: lower in solar hours, ramps up in evening peak
      let hydroMW = 1800;
      if (h >= 19 && h <= 22) {
        hydroMW = 4800;
      } else if (h >= 8 && h <= 11) {
        hydroMW = 3200;
      }

      // Storage: pumping (absorbing energy) during low solar/night, turbining at evening peak
      let storageMW = 0;
      if (h >= 12 && h <= 15) {
        storageMW = -1200; // Pumping solar surplus
      } else if (h >= 20 && h <= 22) {
        storageMW = 1400; // Turbining
      }

      // Combined Cycle Gas (covers residual demand)
      const currentGenExcludingGas = solarMW + nuclearMW + windMW + solarThermalMW + cogenMW + hydroMW + Math.max(0, storageMW);
      const residual = demandReal - currentGenExcludingGas;
      const gasMW = Math.max(800, Math.round(residual * 0.75));

      // Border flows (FR, PT, MA, AD)
      // FR: imports when expensive / peak, exports when solar peak
      const frFlow = h >= 11 && h <= 16 ? -1450 : 850;
      const ptFlow = -950; // Typically export to PT
      const maFlow = -620; // Export to Morocco
      const adFlow = -65;  // Export to Andorra

      const borders: BorderFlow[] = [
        { country: 'FR', name: 'Francia', flag: '🇫🇷', flowMW: frFlow, saldoTodayMWh: -16500 },
        { country: 'PT', name: 'Portugal', flag: '🇵🇹', flowMW: ptFlow, saldoTodayMWh: -24200 },
        { country: 'MA', name: 'Marruecos', flag: '🇲🇦', flowMW: maFlow, saldoTodayMWh: -17300 },
        { country: 'AD', name: 'Andorra', flag: '🇦🇩', flowMW: adFlow, saldoTodayMWh: -900 }
      ];

      // Generators list
      const genRaw = [
        { id: 'eolica', title: 'Eólica', mw: windMW, meta: REE_TECHS_METADATA['eolica'] },
        { id: 'solar-fotovoltaica', title: 'Solar Fotovoltaica', mw: solarMW, meta: REE_TECHS_METADATA['solar-fotovoltaica'] },
        { id: 'hidraulica', title: 'Hidráulica', mw: hydroMW, meta: REE_TECHS_METADATA['hidraulica'] },
        { id: 'nuclear', title: 'Nuclear', mw: nuclearMW, meta: REE_TECHS_METADATA['nuclear'] },
        { id: 'ciclo-combinado', title: 'Ciclo Combinado (Gas)', mw: gasMW, meta: REE_TECHS_METADATA['ciclo-combinado'] },
        { id: 'cogeneracion', title: 'Cogeneración', mw: cogenMW, meta: REE_TECHS_METADATA['cogeneracion'] },
        { id: 'almacenamiento', title: 'Almacenamiento (Bombeo)', mw: Math.max(0, storageMW), meta: REE_TECHS_METADATA['almacenamiento'] }
      ];

      const totalGen = genRaw.reduce((acc, g) => acc + g.mw, 0);

      const generators: TechnologyNode[] = genRaw.map(g => ({
        id: g.id,
        title: g.title,
        color: g.meta.color,
        techType: g.meta.techType,
        mw: g.mw,
        percentage: totalGen > 0 ? g.mw / totalGen : 0,
        co2FactorGPerKWh: g.meta.co2Factor,
        hourlyCO2Tons: Math.round((g.mw * g.meta.co2Factor) / 1000),
        enabled: true,
        iconName: g.meta.icon,
        description: g.meta.description
      }));

      // Price: low at mid-day (solar cannibalization effect), high at 20:00 - 22:00
      let priceEurMWh = 45;
      if (h >= 11 && h <= 16) {
        priceEurMWh = 12.5 + Math.sin(h) * 5; // Very cheap solar hours
      } else if (h >= 19 && h <= 22) {
        priceEurMWh = 98.4 + Math.cos(h) * 12; // Evening peak
      } else if (h >= 1 && h <= 6) {
        priceEurMWh = 32.0;
      }
      const priceSpotEurMWh = Math.max(0, priceEurMWh * 0.92);

      const renewableMW = generators.filter(g => g.techType === 'renovable').reduce((a, b) => a + b.mw, 0);
      const renewablePercentage = totalGen > 0 ? renewableMW / totalGen : 0;
      const co2TotalTonsHour = generators.reduce((a, b) => a + b.hourlyCO2Tons, 0);
      const co2IntensityGPerKWh = totalGen > 0 ? Math.round((co2TotalTonsHour * 1000) / (totalGen / 1000)) : 0;

      hourlySnapshots.push({
        hourIndex: h,
        timeLabel,
        demandRealMW: demandReal,
        demandForecastMW: demandForecast,
        demandScheduledMW: demandScheduled,
        priceEurMWh: Number(priceEurMWh.toFixed(2)),
        priceSpotEurMWh: Number(priceSpotEurMWh.toFixed(2)),
        co2TotalTonsHour,
        co2IntensityGPerKWh,
        renewablePercentage,
        generators,
        borders
      });
    } else if (region === 'canarias') {
      // Canarias: isolated insular system, high diesel + gas turbines + combined cycle, rising wind and solar, no nuclear
      const demandReal = Math.round(1100 + Math.sin((h - 6) / 16 * Math.PI) * 450);
      const solarMW = (h >= 8 && h <= 18) ? Math.round(Math.sin(((h - 8) / 10) * Math.PI) * 280) : 0;
      const windMW = Math.round(140 + Math.sin(h * 0.3) * 60);
      const dieselMW = Math.round(280 + (h >= 19 && h <= 22 ? 120 : 0));
      const gasTurbineMW = Math.round(110 + (h >= 12 && h <= 15 ? 40 : 0));
      const ccMW = Math.max(200, demandReal - (solarMW + windMW + dieselMW + gasTurbineMW));

      const genRaw = [
        { id: 'solar-fotovoltaica', title: 'Solar Fotovoltaica', mw: solarMW, meta: REE_TECHS_METADATA['solar-fotovoltaica'] },
        { id: 'eolica', title: 'Eólica Canaria', mw: windMW, meta: REE_TECHS_METADATA['eolica'] },
        { id: 'ciclo-combinado', title: 'Ciclo Combinado', mw: ccMW, meta: REE_TECHS_METADATA['ciclo-combinado'] },
        { id: 'motores-diesel', title: 'Motores Diésel', mw: dieselMW, meta: REE_TECHS_METADATA['motores-diesel'] },
        { id: 'turbina-gas', title: 'Turbina de Gas', mw: gasTurbineMW, meta: REE_TECHS_METADATA['turbina-gas'] }
      ];

      const totalGen = genRaw.reduce((a, b) => a + b.mw, 0);
      const generators: TechnologyNode[] = genRaw.map(g => ({
        id: g.id,
        title: g.title,
        color: g.meta.color,
        techType: g.meta.techType,
        mw: g.mw,
        percentage: totalGen > 0 ? g.mw / totalGen : 0,
        co2FactorGPerKWh: g.meta.co2Factor,
        hourlyCO2Tons: Math.round((g.mw * g.meta.co2Factor) / 1000),
        enabled: true,
        iconName: g.meta.icon,
        description: g.meta.description
      }));

      const borders: BorderFlow[] = []; // Canarias has no international land border or mainland link

      const renewableMW = solarMW + windMW;
      const co2TotalTonsHour = generators.reduce((a, b) => a + b.hourlyCO2Tons, 0);

      hourlySnapshots.push({
        hourIndex: h,
        timeLabel,
        demandRealMW: demandReal,
        demandForecastMW: demandReal + 20,
        demandScheduledMW: demandReal - 15,
        priceEurMWh: 78.5,
        priceSpotEurMWh: 74.0,
        co2TotalTonsHour,
        co2IntensityGPerKWh: Math.round((co2TotalTonsHour * 1000) / (totalGen / 1000)),
        renewablePercentage: renewableMW / totalGen,
        generators,
        borders
      });
    } else {
      // Baleares: connected to Peninsula via HVDC submarine cable + combined cycle + solar
      const demandReal = Math.round(620 + Math.sin((h - 6) / 16 * Math.PI) * 260);
      const solarMW = (h >= 8 && h <= 18) ? Math.round(Math.sin(((h - 8) / 10) * Math.PI) * 160) : 0;
      const mainlandLinkMW = Math.round(180 + Math.sin(h * 0.5) * 50); // Flow from Peninsula to Baleares
      const ccMW = Math.max(120, Math.round((demandReal - solarMW - mainlandLinkMW) * 0.7));
      const dieselMW = Math.max(20, demandReal - solarMW - mainlandLinkMW - ccMW);

      const genRaw = [
        { id: 'enlace-submarino', title: 'Enlace Península-Baleares', mw: mainlandLinkMW, meta: REE_TECHS_METADATA['enlace-submarino'] },
        { id: 'solar-fotovoltaica', title: 'Solar Fotovoltaica', mw: solarMW, meta: REE_TECHS_METADATA['solar-fotovoltaica'] },
        { id: 'ciclo-combinado', title: 'Ciclo Combinado Balear', mw: ccMW, meta: REE_TECHS_METADATA['ciclo-combinado'] },
        { id: 'motores-diesel', title: 'Central Térmica / Diésel', mw: dieselMW, meta: REE_TECHS_METADATA['motores-diesel'] }
      ];

      const totalGen = genRaw.reduce((a, b) => a + b.mw, 0);
      const generators: TechnologyNode[] = genRaw.map(g => ({
        id: g.id,
        title: g.title,
        color: g.meta.color,
        techType: g.meta.techType,
        mw: g.mw,
        percentage: totalGen > 0 ? g.mw / totalGen : 0,
        co2FactorGPerKWh: g.meta.co2Factor,
        hourlyCO2Tons: Math.round((g.mw * g.meta.co2Factor) / 1000),
        enabled: true,
        iconName: g.meta.icon,
        description: g.meta.description
      }));

      const borders: BorderFlow[] = [
        { country: 'PEN', name: 'Península (Cable HVDC)', flag: '🇪🇸', flowMW: mainlandLinkMW, saldoTodayMWh: 4200 }
      ];

      const co2TotalTonsHour = generators.reduce((a, b) => a + b.hourlyCO2Tons, 0);

      hourlySnapshots.push({
        hourIndex: h,
        timeLabel,
        demandRealMW: demandReal,
        demandForecastMW: demandReal + 15,
        demandScheduledMW: demandReal - 10,
        priceEurMWh: 64.2,
        priceSpotEurMWh: 61.8,
        co2TotalTonsHour,
        co2IntensityGPerKWh: Math.round((co2TotalTonsHour * 1000) / (totalGen / 1000)),
        renewablePercentage: solarMW / totalGen,
        generators,
        borders
      });
    }
  }

  return {
    date: dateStr,
    region,
    lastUpdated: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    currentHourIndex: Math.min(23, Math.max(0, currentHour)),
    hourlySnapshots,
    isRealData: false,
    dataSourceNotice: 'Simulación de alta precisión calibrada con perfiles horarios oficiales de REE'
  };
}
