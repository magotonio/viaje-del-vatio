import React, { useEffect } from 'react';
import { useGridStore } from '../state/grid.store';
import { formatMW, formatPercentage } from '../utils/scales';
import { X, Zap } from 'lucide-react';

export const TechDetailModal: React.FC = () => {
  const { selectedNodeDetail, setSelectedNodeDetail } = useGridStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeDetail(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedNodeDetail]);

  if (!selectedNodeDetail) return null;

  const node = selectedNodeDetail;
  const isRenewable = node.techType === 'renovable';

  return (
    <div
      className="modal-backdrop"
      id="tech-detail-modal"
      onClick={() => setSelectedNodeDetail(null)}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${node.color}` }}
      >
        <button
          className="modal-close-btn"
          id="btn-close-modal"
          onClick={() => setSelectedNodeDetail(null)}
          title="Cerrar ventana"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${node.color}22`,
              border: `1px solid ${node.color}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: node.color
            }}
          >
            <Zap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{node.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: isRenewable ? 'rgba(111, 177, 20, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isRenewable ? '#84cc16' : '#f87171'
                }}
              >
                {node.techType}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Color oficial REE: <code style={{ color: node.color }}>{node.color}</code>
              </span>
            </div>
          </div>
        </div>

        {/* Output Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div className="metric-box">
            <div className="metric-label">Producción Actual</div>
            <div className="metric-value" style={{ color: node.color }}>
              {formatMW(node.mw)}
            </div>
            <div className="metric-sub">{formatPercentage(node.percentage)} del mix nacional</div>
          </div>

          <div className="metric-box">
            <div className="metric-label">Factor de Emisiones</div>
            <div className="metric-value" style={{ color: node.co2FactorGPerKWh === 0 ? '#4ade80' : '#f87171' }}>
              {node.co2FactorGPerKWh} <span style={{ fontSize: '0.75rem' }}>g CO₂/kWh</span>
            </div>
            <div className="metric-sub">
              {node.hourlyCO2Tons > 0 ? `${node.hourlyCO2Tons.toLocaleString('es-ES')} t/hora` : '0 emisiones directas'}
            </div>
          </div>
        </div>

        {/* Narrative Description */}
        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          <p>{node.description}</p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, padding: '0.85rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#f8fafc' }}>💡 Función en el sistema:</strong>
          {node.id === 'eolica' && ' España cuenta con más de 30.000 MW de potencia eólica instalada, siendo uno de los líderes mundiales.'}
          {node.id === 'solar-fotovoltaica' && ' Es la tecnología de mayor crecimiento, generando excedentes en horas centrales que abaratan el precio a 0 €.'}
          {node.id === 'nuclear' && ' Funciona como carga base permanente e ininterrumpida las 24 horas del día sin emitir gases de efecto invernadero.'}
          {node.id === 'ciclo-combinado' && ' Clave como tecnología de respaldo rápida cuando cae el sol y el viento para garantizar que nunca falte electricidad.'}
          {node.id === 'hidraulica' && ' Actúa como una enorme batería natural gracias a las presas de bombeo que pueden acumular agua.'}
          {node.id === 'almacenamiento' && ' Absorbe energía barata en las horas de mayor radiación solar y la inyecta al circuito durante las puntas de demanda.'}
          {node.id === 'enlace-submarino' && ' El cable submarino Rómulo transporta energía en corriente continua desde la costa peninsular hasta las Islas Baleares.'}
        </div>
      </div>
    </div>
  );
};
