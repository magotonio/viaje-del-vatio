import React from 'react';
import { useGridStore } from '../state/grid.store';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { formatMW } from '../utils/scales';

export const DeficitAlert: React.FC = () => {
  const { getSimulatorImpact, enableAllGenerators } = useGridStore();
  const impact = getSimulatorImpact();

  if (!impact.isDeficit) return null;

  const homesMillions = (impact.homesEquivalent / 1000000).toFixed(1);

  return (
    <div className="deficit-alert-banner" role="alert" id="sim-deficit-alert">
      <div>
        <div className="deficit-title">
          <AlertTriangle size={18} color="#fca5a5" />
          <span>¡ALERTA DE DÉFICIT ENERGÉTICO! (Modo Simulación)</span>
        </div>
        <p className="deficit-desc">
          Has apagado tecnologías del mix eléctrico. Faltan <strong>{formatMW(impact.deficitMW)}</strong> de potencia instantánea:
          {' '}equivale a dejar sin suministro eléctrico a <strong>{homesMillions} millones de hogares</strong>
          {impact.gasMultiplierNeeded > 1 && (
            <span>, o tendríamos que <strong>multiplicar por {impact.gasMultiplierNeeded}x</strong> la quema de gas en Ciclo Combinado.</span>
          )}
        </p>
      </div>

      <button
        className="btn-reset-sim"
        id="btn-restore-generators"
        onClick={enableAllGenerators}
      >
        <RotateCcw size={14} style={{ display: 'inline', marginRight: 6 }} />
        Restablecer Red
      </button>
    </div>
  );
};
