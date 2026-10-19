import React from 'react';
import { useGridStore, APPLIANCES_LIST } from '../state/grid.store';
import { formatMW, formatPrice, formatPercentage } from '../utils/scales';
import {
  PlugZap,
  Smartphone,
  WashingMachine,
  AirVent,
  Car,
  TrendingUp,
  Leaf,
  Euro,
  Sparkles,
  Clock
} from 'lucide-react';

export const CentralPlugHub: React.FC = () => {
  const {
    getCurrentSnapshot,
    selectedApplianceId,
    setSelectedApplianceId,
    getApplianceBreakdown,
    getSelectedAppliance
  } = useGridStore();

  const snapshot = getCurrentSnapshot();
  const breakdown = getApplianceBreakdown();
  const appliance = getSelectedAppliance();

  if (!snapshot) return null;

  const renderApplianceIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone size={size} />;
      case 'washing-machine':
        return <WashingMachine size={size} />;
      case 'air-vent':
        return <AirVent size={size} />;
      case 'car':
        return <Car size={size} />;
      default:
        return <PlugZap size={size} />;
    }
  };

  // Build the narrative text dynamically:
  // e.g., "Si enciendes el horno ahora mismo, 752 W vienen del viento, 367 W del sol..."
  const nonZeroTechs = breakdown.techBreakdown.filter(t => t.watts > 0);
  const narrativeParts = nonZeroTechs.slice(0, 4).map(t => (
    <span key={t.id}>
      <strong style={{ color: t.color }}>{t.watts} W</strong> de {t.title.toLowerCase()}
    </span>
  ));

  return (
    <div className="glass-panel central-hub" id="central-plug-hub">
      <div className="hub-header">
        <div className="hub-title">
          <PlugZap size={22} color="#38bdf8" />
          <span>El Corazón de tu Enchufe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
          <Clock size={13} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{snapshot.timeLabel}</span>
        </div>
      </div>

      {/* Grid Key Metrics */}
      <div className="hub-metrics-grid">
        <div className="metric-box">
          <div className="metric-label">Demanda Viva</div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {formatMW(snapshot.demandRealMW)}
          </div>
          <div className="metric-sub">
            Prevista: {formatMW(snapshot.demandForecastMW)}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Energía Limpia</div>
          <div className="metric-value" style={{ color: '#6fb114' }}>
            {formatPercentage(snapshot.renewablePercentage)}
          </div>
          <div className="metric-sub">
            <Leaf size={11} style={{ display: 'inline', marginRight: 3 }} />
            Renovable
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Precio PVPC</div>
          <div className="metric-value" style={{ color: snapshot.priceEurMWh < 40 ? '#34d399' : snapshot.priceEurMWh > 80 ? '#f87171' : '#f59e0b' }}>
            {formatPrice(snapshot.priceEurMWh)}
          </div>
          <div className="metric-sub">
            Spot: {formatPrice(snapshot.priceSpotEurMWh)}
          </div>
        </div>
      </div>

      {/* Mode: What powers my appliance right now? */}
      <div className="appliances-panel">
        <div className="appliances-title">
          <Sparkles size={14} color="#38bdf8" />
          <span>¿De qué se alimenta mi electrodoméstico ahora?</span>
        </div>

        <div className="appliances-grid">
          {APPLIANCES_LIST.map(item => (
            <button
              key={item.id}
              id={`btn-appliance-${item.id}`}
              className={`appliance-btn ${selectedApplianceId === item.id ? 'active' : ''}`}
              onClick={() => setSelectedApplianceId(item.id)}
            >
              <div className="appliance-btn-icon">
                {renderApplianceIcon(item.iconName)}
              </div>
              <div className="appliance-btn-text">
                <div className="appliance-btn-name">{item.name}</div>
                <div className="appliance-btn-watts">{item.watts.toLocaleString('es-ES')} W</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Didactic Narrative */}
      <div className="narrative-card" id="appliance-narrative-box">
        <p>
          Si enciendes <strong>{appliance.name.toLowerCase()} ({appliance.watts} W)</strong> ahora mismo:
          {' '}
          {narrativeParts.reduce((prev, curr, idx) => (
            <React.Fragment key={idx}>
              {prev}
              {idx === narrativeParts.length - 1 ? ' y ' : ', '}
              {curr}
            </React.Fragment>
          ))}
          .
        </p>
        <p style={{ marginTop: '0.45rem' }}>
          Te va a costar aproximadamente <strong>{(breakdown.costCents / 100).toFixed(2)} €</strong> esta hora
          {' '}y vas a emitir <strong>{breakdown.co2Grams} gramos de CO₂</strong>.
        </p>

        <div className="narrative-tags">
          <span className="narrative-tag" style={{ color: '#38bdf8' }}>
            <TrendingUp size={11} /> {breakdown.watts} W instantáneos
          </span>
          <span className="narrative-tag" style={{ color: '#fbbf24' }}>
            <Euro size={11} /> {breakdown.costCents} ¢/hora
          </span>
          <span className="narrative-tag" style={{ color: breakdown.co2Grams === 0 ? '#4ade80' : '#f87171' }}>
            🍃 {breakdown.co2Grams} g CO₂
          </span>
        </div>
      </div>
    </div>
  );
};
