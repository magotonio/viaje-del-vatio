import { create } from 'zustand';
import type { GeoRegion, GridDayData, HourlySnapshot, TechnologyNode, Appliance, SimulatorImpact } from '../models/grid.types';
import { getGridDayData } from '../api/redata.mapper';

export const APPLIANCES_LIST: Appliance[] = [
  {
    id: 'movil',
    name: 'Cargar el móvil',
    watts: 15,
    iconName: 'smartphone',
    description: 'Carga rápida de batería de smartphone (15 W)',
    durationMinutes: 60
  },
  {
    id: 'horno-lavadora',
    name: 'Lavadora / Horno',
    watts: 2200,
    iconName: 'washing-machine',
    description: 'Ciclo caliente de lavado o cocción en horno eléctrico (2.200 W)',
    durationMinutes: 60
  },
  {
    id: 'aire-acondicionado',
    name: 'Aire Acondicionado',
    watts: 1200,
    iconName: 'air-vent',
    description: 'Bomba de calor / climatización inverter en modo frío o calor (1.200 W)',
    durationMinutes: 60
  },
  {
    id: 'coche-electrico',
    name: 'Coche Eléctrico',
    watts: 7400,
    iconName: 'car',
    description: 'Punto de recarga doméstico Wallbox en monofásica a 32A (7.400 W)',
    durationMinutes: 60
  }
];

interface GridStoreState {
  region: GeoRegion;
  selectedHourIndex: number;
  disabledGeneratorIds: string[];
  selectedApplianceId: string;
  gridData: GridDayData | null;
  isLoading: boolean;
  isPlaying: boolean;
  isLiveMode: boolean;
  selectedNodeDetail: TechnologyNode | null;

  // Actions
  setRegion: (region: GeoRegion) => Promise<void>;
  setSelectedHourIndex: (hour: number) => void;
  toggleGenerator: (id: string) => void;
  enableAllGenerators: () => void;
  setSelectedApplianceId: (id: string) => void;
  togglePlay: () => void;
  setLiveMode: (live: boolean) => void;
  setSelectedNodeDetail: (node: TechnologyNode | null) => void;
  fetchData: () => Promise<void>;

  // Derived getters
  getCurrentSnapshot: () => HourlySnapshot | null;
  getSelectedAppliance: () => Appliance;
  getSimulatorImpact: () => SimulatorImpact;
  getApplianceBreakdown: () => {
    watts: number;
    costCents: number;
    co2Grams: number;
    techBreakdown: Array<{
      id: string;
      title: string;
      color: string;
      watts: number;
      percentage: number;
      isRenewable: boolean;
    }>;
  };
}

export const useGridStore = create<GridStoreState>((set, get) => ({
  region: 'peninsular',
  selectedHourIndex: new Date().getHours(),
  disabledGeneratorIds: [],
  selectedApplianceId: 'horno-lavadora',
  gridData: null,
  isLoading: true,
  isPlaying: false,
  isLiveMode: true,
  selectedNodeDetail: null,

  setRegion: async (region: GeoRegion) => {
    set({ region, isLoading: true, disabledGeneratorIds: [] });
    try {
      const data = await getGridDayData(region);
      set({ gridData: data, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  setSelectedHourIndex: (hour: number) => {
    const clamped = Math.max(0, Math.min(23, hour));
    const currentRealHour = new Date().getHours();
    set({
      selectedHourIndex: clamped,
      isLiveMode: clamped === currentRealHour
    });
  },

  toggleGenerator: (id: string) => {
    const { disabledGeneratorIds } = get();
    const isCurrentlyDisabled = disabledGeneratorIds.includes(id);
    if (isCurrentlyDisabled) {
      set({ disabledGeneratorIds: disabledGeneratorIds.filter(x => x !== id) });
    } else {
      set({ disabledGeneratorIds: [...disabledGeneratorIds, id] });
    }
  },

  enableAllGenerators: () => {
    set({ disabledGeneratorIds: [] });
  },

  setSelectedApplianceId: (id: string) => {
    set({ selectedApplianceId: id });
  },

  togglePlay: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying, isLiveMode: false });
  },

  setLiveMode: (live: boolean) => {
    if (live) {
      const currentRealHour = new Date().getHours();
      set({ isLiveMode: true, selectedHourIndex: currentRealHour, isPlaying: false });
    } else {
      set({ isLiveMode: false });
    }
  },

  setSelectedNodeDetail: (node: TechnologyNode | null) => {
    set({ selectedNodeDetail: node });
  },

  fetchData: async () => {
    const { region } = get();
    set({ isLoading: true });
    try {
      const data = await getGridDayData(region);
      set({ gridData: data, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  getCurrentSnapshot: () => {
    const { gridData, selectedHourIndex, disabledGeneratorIds } = get();
    if (!gridData || !gridData.hourlySnapshots[selectedHourIndex]) return null;

    const baseSnapshot = gridData.hourlySnapshots[selectedHourIndex];

    // Compute adjusted generators according to disabled list
    const activeGenerators = baseSnapshot.generators.map(g => ({
      ...g,
      enabled: !disabledGeneratorIds.includes(g.id),
      mw: disabledGeneratorIds.includes(g.id) ? 0 : g.mw
    }));

    const totalActiveMW = activeGenerators.reduce((sum, g) => sum + g.mw, 0);

    const recomputedGenerators = activeGenerators.map(g => ({
      ...g,
      percentage: totalActiveMW > 0 ? g.mw / totalActiveMW : 0
    }));

    const renewableMW = recomputedGenerators
      .filter(g => g.techType === 'renovable' && g.enabled)
      .reduce((sum, g) => sum + g.mw, 0);

    const renewablePercentage = totalActiveMW > 0 ? renewableMW / totalActiveMW : 0;

    return {
      ...baseSnapshot,
      renewablePercentage,
      generators: recomputedGenerators
    };
  },

  getSelectedAppliance: () => {
    const { selectedApplianceId } = get();
    return APPLIANCES_LIST.find(a => a.id === selectedApplianceId) || APPLIANCES_LIST[1];
  },

  getSimulatorImpact: () => {
    const { gridData, selectedHourIndex, disabledGeneratorIds } = get();
    if (!gridData || !gridData.hourlySnapshots[selectedHourIndex]) {
      return {
        disabledCount: 0,
        deficitMW: 0,
        homesEquivalent: 0,
        gasMultiplierNeeded: 1,
        co2DifferenceTons: 0,
        isDeficit: false
      };
    }

    const snapshot = gridData.hourlySnapshots[selectedHourIndex];
    let deficitMW = 0;
    let originalGasMW = 1;
    let co2Diff = 0;

    for (const g of snapshot.generators) {
      if (disabledGeneratorIds.includes(g.id)) {
        deficitMW += g.mw;
        co2Diff -= g.hourlyCO2Tons;
      }
      if (g.id === 'ciclo-combinado') {
        originalGasMW = Math.max(1, g.mw);
      }
    }

    const homesEquivalent = Math.round((deficitMW * 1000) / 3.5); // 3.5 kW peak power per home
    const gasMultiplierNeeded = Number(((originalGasMW + deficitMW) / originalGasMW).toFixed(1));

    return {
      disabledCount: disabledGeneratorIds.length,
      deficitMW: Math.round(deficitMW),
      homesEquivalent,
      gasMultiplierNeeded,
      co2DifferenceTons: co2Diff,
      isDeficit: disabledGeneratorIds.length > 0 && deficitMW > 0
    };
  },

  getApplianceBreakdown: () => {
    const { getCurrentSnapshot, getSelectedAppliance } = get();
    const snapshot = getCurrentSnapshot();
    const appliance = getSelectedAppliance();

    if (!snapshot) {
      return {
        watts: appliance.watts,
        costCents: 0,
        co2Grams: 0,
        techBreakdown: []
      };
    }

    const totalMW = snapshot.generators.reduce((sum, g) => sum + g.mw, 0);
    const techBreakdown = snapshot.generators.map(g => {
      const share = totalMW > 0 ? g.mw / totalMW : 0;
      const techWatts = Math.round(appliance.watts * share);
      return {
        id: g.id,
        title: g.title,
        color: g.color,
        watts: techWatts,
        percentage: share,
        isRenewable: g.techType === 'renovable'
      };
    });

    // Cost in cents for 1 hour of use
    // (Watts / 1000 kW) * (priceEurMWh / 1000 €/kWh) * 100 cents/€
    const kwh = appliance.watts / 1000;
    const eurKwh = snapshot.priceEurMWh / 1000;
    const costCents = Number((kwh * eurKwh * 100).toFixed(1));

    // CO2 in grams:
    // Grams = sum(techWatts / 1000 kW * co2Factor)
    const co2Grams = Math.round(
      snapshot.generators.reduce((sum, g) => {
        const share = totalMW > 0 ? g.mw / totalMW : 0;
        const kw = (appliance.watts * share) / 1000;
        return sum + kw * g.co2FactorGPerKWh;
      }, 0)
    );

    return {
      watts: appliance.watts,
      costCents,
      co2Grams,
      techBreakdown
    };
  }
}));
