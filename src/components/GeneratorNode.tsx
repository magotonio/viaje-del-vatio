import React from 'react';
import type { TechnologyNode } from '../models/grid.types';
import { useGridStore } from '../state/grid.store';
import { formatMW, formatPercentage, windSpeedScale, solarGlowScale } from '../utils/scales';
import {
  Fan,
  Sun,
  Waves,
  Atom,
  Flame,
  BatteryCharging,
  Factory,
  Cable,
  Info
} from 'lucide-react';

interface GeneratorNodeProps {
  generator: TechnologyNode;
}

export const GeneratorNode: React.FC<GeneratorNodeProps> = ({ generator }) => {
  const { toggleGenerator, setSelectedNodeDetail } = useGridStore();

  const renderIcon = () => {
    const isSpinningWind = (generator.iconName === 'fan' || generator.iconName === 'wind') && generator.enabled && generator.mw > 0;
    const isGlowingSun = generator.iconName === 'sun' && generator.enabled && generator.mw > 0;

    const windDuration = windSpeedScale(generator.mw);
    const sunOpacity = solarGlowScale(generator.mw);

    switch (generator.iconName) {
      case 'fan':
      case 'wind':
        return (
          <div
            style={isSpinningWind ? { animation: `spin ${windDuration}s linear infinite`, transformOrigin: 'center' } : {}}
          >
            <Fan size={22} />
          </div>
        );
      case 'sun':
        return (
          <div
            style={isGlowingSun ? { filter: `drop-shadow(0 0 ${Math.round(sunOpacity * 12)}px ${generator.color})` } : {}}
          >
            <Sun size={22} />
          </div>
        );
      case 'waves':
        return <Waves size={22} />;
      case 'atom':
        return <Atom size={22} className={generator.enabled && generator.mw > 0 ? 'spin-anim' : ''} style={{ animationDuration: '8s' }} />;
      case 'flame':
        return <Flame size={22} />;
      case 'battery':
        return <BatteryCharging size={22} />;
      case 'factory':
        return <Factory size={22} />;
      case 'cable':
        return <Cable size={22} />;
      default:
        return <Flame size={22} />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click was not on the switch, open detail modal
    if ((e.target as HTMLElement).closest('.switch-control')) return;
    setSelectedNodeDetail(generator);
  };

  return (
    <div
      className={`glass-panel generator-card ${!generator.enabled ? 'disabled' : ''}`}
      id={`gen-card-${generator.id}`}
      style={{ '--card-accent': generator.color } as React.CSSProperties}
      onClick={handleCardClick}
      title="Haz clic para ver detalles y datos técnicos"
    >
      <div className="gen-main-info">
        <div className="gen-icon-box">
          {renderIcon()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gen-name">{generator.title}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 2 }}>
            <span className="gen-mw">{formatMW(generator.mw)}</span>
            <span className="gen-percentage">({formatPercentage(generator.percentage)})</span>
          </div>
          {generator.hourlyCO2Tons > 0 && generator.enabled && (
            <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: 2 }}>
              💨 {generator.hourlyCO2Tons.toLocaleString('es-ES')} t CO₂/h
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="modal-close-btn"
          style={{ position: 'static', padding: 4 }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeDetail(generator);
          }}
          title="Ver ficha técnica"
        >
          <Info size={15} />
        </button>

        {/* ON / OFF Switch */}
        <label
          className="switch-control"
          title={generator.enabled ? `Apagar ${generator.title} (Simulador)` : `Encender ${generator.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            id={`switch-${generator.id}`}
            checked={generator.enabled}
            onChange={() => toggleGenerator(generator.id)}
          />
          <span className="switch-slider" />
        </label>
      </div>
    </div>
  );
};
