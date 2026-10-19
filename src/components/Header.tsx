import React from 'react';
import { useGridStore } from '../state/grid.store';
import type { GeoRegion } from '../models/grid.types';
import { Zap, RefreshCw, Radio } from 'lucide-react';

export const Header: React.FC = () => {
  const { region, setRegion, gridData, isLoading, fetchData, isLiveMode, setLiveMode } = useGridStore();

  const regions: Array<{ id: GeoRegion; label: string; icon: string }> = [
    { id: 'peninsular', label: 'Península', icon: '🇪🇸' },
    { id: 'canarias', label: 'Canarias', icon: '🏝️' },
    { id: 'baleares', label: 'Baleares', icon: '⛵' }
  ];

  return (
    <header className="app-header">
      <div className="app-title-group">
        <div className="app-logo-badge">
          <Zap size={26} color="#ffffff" />
        </div>
        <div>
          <h1 className="app-title" id="main-heading">El Viaje de un Vatio</h1>
          <p className="app-subtitle">Anatomía de tu enchufe y la red eléctrica española en tiempo real</p>
        </div>
      </div>

      {/* Region Selector */}
      <div className="geo-selector" role="group" aria-label="Selector de sistema eléctrico">
        {regions.map(r => (
          <button
            key={r.id}
            id={`geo-btn-${r.id}`}
            className={`geo-button ${region === r.id ? 'active' : ''}`}
            onClick={() => setRegion(r.id)}
            disabled={isLoading}
          >
            <span>{r.icon}</span> {r.label}
          </button>
        ))}
      </div>

      {/* Status & Live Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          className={`btn-live-now ${isLiveMode ? 'active' : ''}`}
          id="btn-live-toggle"
          onClick={() => setLiveMode(true)}
          title="Saltar a la hora actual"
        >
          <Radio size={12} style={{ display: 'inline', marginRight: 4 }} />
          En Vivo
        </button>

        <div className="live-pill" title={gridData?.dataSourceNotice || 'Conexión activa'}>
          <div className="live-dot" />
          <span>{gridData?.isRealData ? 'REE REDATA' : 'CALIBRADO'}</span>
        </div>

        <button
          className="btn-play"
          id="btn-refresh-data"
          onClick={() => fetchData()}
          disabled={isLoading}
          title="Actualizar datos ahora"
          style={{ width: 34, height: 34 }}
        >
          <RefreshCw size={15} className={isLoading ? 'spin-anim' : ''} />
        </button>
      </div>
    </header>
  );
};
