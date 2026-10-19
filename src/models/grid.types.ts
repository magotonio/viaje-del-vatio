export type GeoRegion = 'peninsular' | 'canarias' | 'baleares';

export interface GeoRegionConfig {
  id: GeoRegion;
  label: string;
  subLabel: string;
  geoLimit: string;
  geoIds: string;
}

export type TechType = 'renovable' | 'no-renovable' | 'almacenamiento' | 'enlace';

export interface TechnologyNode {
  id: string;
  title: string;
  color: string;
  techType: TechType;
  mw: number;
  percentage: number; // 0 - 1
  co2FactorGPerKWh: number; // gCO2 / kWh
  hourlyCO2Tons: number;
  enabled: boolean;
  iconName: 'wind' | 'sun' | 'waves' | 'atom' | 'flame' | 'battery' | 'factory' | 'cable';
  description: string;
}

export interface BorderFlow {
  country: 'FR' | 'PT' | 'MA' | 'AD' | 'PEN';
  name: string;
  flag: string;
  flowMW: number; // >0 Importing into Spain, <0 Exporting
  saldoTodayMWh?: number;
}

export interface HourlySnapshot {
  hourIndex: number;
  timeLabel: string;
  demandRealMW: number;
  demandForecastMW: number;
  demandScheduledMW: number;
  priceEurMWh: number; // PVPC €/MWh
  priceSpotEurMWh: number; // Spot market €/MWh
  co2TotalTonsHour: number;
  co2IntensityGPerKWh: number;
  renewablePercentage: number;
  generators: TechnologyNode[];
  borders: BorderFlow[];
}

export interface Appliance {
  id: string;
  name: string;
  watts: number;
  iconName: 'smartphone' | 'washing-machine' | 'air-vent' | 'car' | 'tv' | 'cooking-pot';
  description: string;
  durationMinutes: number;
}

export interface GridDayData {
  date: string; // YYYY-MM-DD
  region: GeoRegion;
  lastUpdated: string;
  currentHourIndex: number;
  hourlySnapshots: HourlySnapshot[];
  isRealData: boolean;
  dataSourceNotice?: string;
}

export interface SimulatorImpact {
  disabledCount: number;
  deficitMW: number;
  homesEquivalent: number; // 1 home ~= 3.5 kW peak, or 1 MW ~= 300 homes
  gasMultiplierNeeded: number;
  co2DifferenceTons: number;
  isDeficit: boolean;
}
