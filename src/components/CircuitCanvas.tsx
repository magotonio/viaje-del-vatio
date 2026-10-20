import React, { useEffect, useRef, useState } from 'react';
import { useGridStore } from '../state/grid.store';
import { cableWidthScale, flowDurationScale } from '../utils/scales';

interface ConnectionCoords {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  mw: number;
  enabled: boolean;
  isBorder?: boolean;
  isReverse?: boolean;
}

export const CircuitCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<ConnectionCoords[]>([]);
  const { getCurrentSnapshot } = useGridStore();
  const snapshot = getCurrentSnapshot();

  const updateCoordinates = () => {
    if (!containerRef.current || !snapshot) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const centralHubEl = document.getElementById('central-plug-hub');

    if (!centralHubEl) return;
    const hubRect = centralHubEl.getBoundingClientRect();

    const hubLeftX = hubRect.left - containerRect.left;
    const hubRightX = hubRect.right - containerRect.left;
    const hubCenterY = hubRect.top - containerRect.top + hubRect.height / 2;

    const newConnections: ConnectionCoords[] = [];

    // 1. Connect Left Generator Cards -> Central Hub Left
    snapshot.generators.forEach((gen, idx) => {
      const cardEl = document.getElementById(`gen-card-${gen.id}`);
      if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        const startX = cardRect.right - containerRect.left;
        const startY = cardRect.top - containerRect.top + cardRect.height / 2;

        // Offset destination slightly along hub height for clean bundling
        const hubOffset = ((idx - (snapshot.generators.length - 1) / 2) / snapshot.generators.length) * (hubRect.height * 0.6);
        const endY = hubCenterY + hubOffset;

        newConnections.push({
          id: `gen-${gen.id}`,
          x1: startX,
          y1: startY,
          x2: hubLeftX,
          y2: endY,
          color: gen.color,
          mw: gen.mw,
          enabled: gen.enabled && gen.mw > 0
        });
      }
    });

    // 2. Connect Central Hub Right -> Border Cards
    if (snapshot.borders && snapshot.borders.length > 0) {
      snapshot.borders.forEach((border, idx) => {
        const borderEl = document.getElementById(`border-card-${border.country.toLowerCase()}`);
        if (borderEl) {
          const borderRect = borderEl.getBoundingClientRect();
          const targetX = borderRect.left - containerRect.left;
          const targetY = borderRect.top - containerRect.top + borderRect.height / 2;

          const hubOffset = ((idx - (snapshot.borders.length - 1) / 2) / snapshot.borders.length) * (hubRect.height * 0.6);
          const startY = hubCenterY + hubOffset;

          const isExporting = border.flowMW < 0;
          const isImporting = border.flowMW > 0;
          const absMW = Math.abs(border.flowMW);

          newConnections.push({
            id: `border-${border.country}`,
            x1: hubRightX,
            y1: startY,
            x2: targetX,
            y2: targetY,
            color: isExporting ? '#f87171' : '#34d399',
            mw: absMW,
            enabled: absMW > 0,
            isBorder: true,
            // Las coordenadas van desde el Hub central (x1) a la frontera (x2):
            // - Exportación (flowMW < 0): Hub -> Frontera (animación normal / flow-forward)
            // - Importación (flowMW > 0): Frontera -> Hub (animación inversa / flow-reverse)
            isReverse: isImporting
          });
        }
      });
    }

    setConnections(newConnections);
  };

  useEffect(() => {
    updateCoordinates();
    const handleResize = () => updateCoordinates();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => updateCoordinates());
    if (containerRef.current) observer.observe(containerRef.current);

    // Minor delay to let initial layout settle
    const timeout = setTimeout(updateCoordinates, 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [snapshot]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map(conn => {
          // Smooth Bézier curve calculation
          const dx = Math.abs(conn.x2 - conn.x1) * 0.5;
          const pathD = `M ${conn.x1} ${conn.y1} C ${conn.x1 + dx} ${conn.y1}, ${conn.x2 - dx} ${conn.y2}, ${conn.x2} ${conn.y2}`;

          const cableWidth = cableWidthScale(conn.mw);
          const flowSpeed = flowDurationScale(conn.mw);

          return (
            <g key={conn.id}>
              {/* Under-glow line */}
              {conn.enabled && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth={cableWidth + 4}
                  opacity={0.25}
                  strokeLinecap="round"
                />
              )}

              {/* Animated energy cable */}
              <path
                d={pathD}
                className={`energy-cable ${!conn.enabled ? 'disabled-cable' : ''} ${conn.isReverse ? 'reverse' : ''}`}
                style={
                  {
                    '--tech-color': conn.color,
                    '--cable-width': `${cableWidth}px`,
                    '--flow-duration': `${flowSpeed}s`
                  } as React.CSSProperties
                }
              />

              {/* Core bright line */}
              {conn.enabled && (
                <path
                  d={pathD}
                  className={`energy-cable glow-core ${conn.isReverse ? 'reverse' : ''}`}
                  style={
                    {
                      '--flow-duration': `${flowSpeed}s`
                    } as React.CSSProperties
                  }
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
