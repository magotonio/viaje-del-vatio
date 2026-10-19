import React, { useEffect } from 'react';
import { useGridStore } from './state/grid.store';
import { Header } from './components/Header';
import { DeficitAlert } from './components/DeficitAlert';
import { GeneratorNode } from './components/GeneratorNode';
import { CentralPlugHub } from './components/CentralPlugHub';
import { BorderConnections } from './components/BorderConnections';
import { CircuitCanvas } from './components/CircuitCanvas';
import { TimeSliderBar } from './components/TimeSliderBar';
import { TechDetailModal } from './components/TechDetailModal';
import { Zap, Factory } from 'lucide-react';

export const App: React.FC = () => {
  const { fetchData, getCurrentSnapshot, isLoading, gridData } = useGridStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const snapshot = getCurrentSnapshot();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="main-content">
        <DeficitAlert />

        {/* 3-Column Interactive Circuit Canvas */}
        <section className="circuit-stage" aria-label="Circuito eléctrico interactivo">
          {/* Column 1: Centrales Generadoras */}
          <div className="generators-column">
            <div className="section-label">
              <span>Centrales Generadoras</span>
              <Factory size={14} />
            </div>

            {snapshot && snapshot.generators.map(gen => (
              <GeneratorNode key={gen.id} generator={gen} />
            ))}

            {!snapshot && isLoading && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                Cargando centrales eléctricas...
              </div>
            )}
          </div>

          {/* Column 2: Central SVG Canvas & Hub */}
          <div className="canvas-container">
            <CircuitCanvas />
            <CentralPlugHub />
          </div>

          {/* Column 3: Fronteras Internacionales */}
          <BorderConnections />
        </section>

        {/* Bottom 24-Hour Slider */}
        <section aria-label="Control horario de 24 horas">
          <TimeSliderBar />
        </section>
      </main>

      {/* Educational Modal */}
      <TechDetailModal />

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#e2e8f0' }}>
          <Zap size={16} color="#38bdf8" />
          <span>El Viaje de un Vatio — Datos Oficiales de Red Eléctrica de España (REData JSON:API)</span>
        </div>
        <p style={{ maxWidth: 720 }}>
          Visualización viva y divulgativa de la infraestructura eléctrica peninsular e insular.
          Cada cable refleja en tiempo real el grosor y la velocidad de los electrones según los megavatios reales consumidos y generados.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: 4 }}>
          <span>API: <code>apidatos.ree.es</code></span>
          <span>Actualizado: <strong>{gridData?.lastUpdated || 'En vivo'}</strong></span>
          <span>Licencia: Open Data REE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
