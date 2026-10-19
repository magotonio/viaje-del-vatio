import React, { useEffect } from 'react';
import { useGridStore } from '../state/grid.store';
import { Play, Pause, Sun, Moon, Sunset, Sunrise } from 'lucide-react';

export const TimeSliderBar: React.FC = () => {
  const {
    selectedHourIndex,
    setSelectedHourIndex,
    isPlaying,
    togglePlay,
    isLiveMode,
    setLiveMode
  } = useGridStore();

  // Auto-play timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedHourIndex((selectedHourIndex + 1) % 24);
    }, 1400);

    return () => clearInterval(interval);
  }, [isPlaying, selectedHourIndex, setSelectedHourIndex]);

  const getHourContextNote = (h: number): string => {
    if (h >= 0 && h < 6) return 'Madrugada: Demanda mínima, predominio eólico y nuclear';
    if (h >= 6 && h < 9) return 'Primer pico matinal: La actividad laboral despierta el consumo';
    if (h >= 9 && h < 13) return 'Subida solar: Las centrales fotovoltaicas aceleran su generación';
    if (h >= 13 && h < 16) return 'Pico Solar: Máxima energía limpia y precios mínimos en el mercado';
    if (h >= 16 && h < 19) return 'Caída de radiación solar: Comienza la transición hacia el atardecer';
    if (h >= 19 && h < 22) return 'Pico Nocturno: Encendido de hidráulica y ciclo combinado para cubrir la cena';
    return 'Noche cerrada: Descenso paulatino del consumo hacia el valle';
  };

  const getTimeIcon = (h: number) => {
    if (h >= 7 && h <= 9) return <Sunrise size={18} color="#f59e0b" />;
    if (h >= 10 && h <= 17) return <Sun size={18} color="#eab308" />;
    if (h >= 18 && h <= 20) return <Sunset size={18} color="#f97316" />;
    return <Moon size={18} color="#60a5fa" />;
  };

  const keyTicks = [0, 4, 8, 12, 16, 20, 23];

  return (
    <div className="glass-panel time-slider-container" id="time-slider-bar">
      <div className="time-slider-header">
        <div className="slider-controls-left">
          <button
            className="btn-play"
            id="btn-play-pause-slider"
            onClick={togglePlay}
            title={isPlaying ? 'Pausar simulación 24h' : 'Reproducir día completo'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>

          <div className="slider-time-display">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {getTimeIcon(selectedHourIndex)}
            </span>
            <span className="current-hour-val">
              {selectedHourIndex.toString().padStart(2, '0')}:00
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {getHourContextNote(selectedHourIndex)}
          </div>
        </div>

        <div>
          <button
            className={`btn-live-now ${isLiveMode ? 'active' : ''}`}
            id="btn-slider-live"
            onClick={() => setLiveMode(true)}
            title="Sincronizar con la hora real de España"
          >
            ● EN VIVO
          </button>
        </div>
      </div>

      {/* 24-Hour Slider Input */}
      <div>
        <input
          type="range"
          id="hour-range-slider"
          min="0"
          max="23"
          step="1"
          value={selectedHourIndex}
          onChange={(e) => setSelectedHourIndex(Number(e.target.value))}
          className="time-range-input"
          aria-label="Seleccionar hora del día"
        />

        <div className="time-range-ticks">
          {keyTicks.map(t => (
            <span
              key={t}
              className={`tick-mark ${selectedHourIndex === t ? 'active' : ''}`}
              onClick={() => setSelectedHourIndex(t)}
              style={{ cursor: 'pointer' }}
            >
              {t.toString().padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
