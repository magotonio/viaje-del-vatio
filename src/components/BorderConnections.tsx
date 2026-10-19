import React from 'react';
import { useGridStore } from '../state/grid.store';
import { formatMW } from '../utils/scales';
import { Globe, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const BorderConnections: React.FC = () => {
  const { getCurrentSnapshot, region } = useGridStore();
  const snapshot = getCurrentSnapshot();

  if (!snapshot || !snapshot.borders || snapshot.borders.length === 0) {
    if (region === 'canarias') {
      return (
        <div className="borders-column" id="borders-column">
          <div className="section-label">
            <span>Sistema Aislado</span>
            <Globe size={14} />
          </div>
          <div className="glass-panel border-card" style={{ padding: '1.25rem', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <span>🏝️</span> Sin Interconexión Exterior
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>
              El sistema eléctrico canario es un subsistema insular aislado sin cables submarinos hacia el continente. La estabilidad depende de sus propios generadores.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="borders-column" id="borders-column">
      <div className="section-label">
        <span>Fronteras Internacionales</span>
        <Globe size={14} />
      </div>

      {snapshot.borders.map(b => {
        const isImporting = b.flowMW > 0;
        const absMW = Math.abs(b.flowMW);

        return (
          <div
            key={b.country}
            className="glass-panel border-card"
            id={`border-card-${b.country.toLowerCase()}`}
          >
            <div className="border-info">
              <span className="border-flag">{b.flag}</span>
              <div>
                <div className="border-name">{b.name}</div>
                <span className={`border-status-tag ${isImporting ? 'import' : 'export'}`}>
                  {isImporting ? (
                    <>
                      <ArrowDownLeft size={10} style={{ display: 'inline', marginRight: 2 }} />
                      Importando
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={10} style={{ display: 'inline', marginRight: 2 }} />
                      Exportando
                    </>
                  )}
                </span>
              </div>
            </div>

            <div>
              <div className="border-mw" style={{ color: isImporting ? '#34d399' : '#f87171' }}>
                {isImporting ? '+' : '-'}{formatMW(absMW)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
