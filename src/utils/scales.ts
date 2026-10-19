import { scaleSqrt, scaleLinear } from 'd3-scale';

/**
 * Scale for cable stroke width based on Megawatts.
 * Uses square-root scale so large technologies don't monopolize the canvas
 * and small technologies remain clearly visible.
 */
export const cableWidthScale = scaleSqrt()
  .domain([0, 15000])
  .range([2, 22])
  .clamp(true);

/**
 * Scale for animation duration in seconds based on Megawatts.
 * Higher MW -> shorter duration -> faster particle flow.
 */
export const flowDurationScale = scaleLinear()
  .domain([0, 12000])
  .range([5.5, 0.45])
  .clamp(true);

/**
 * Scale for wind turbine rotation duration (seconds per turn)
 */
export const windSpeedScale = scaleLinear()
  .domain([0, 12000])
  .range([6.0, 0.6])
  .clamp(true);

/**
 * Scale for solar glow / intensity (0.3 to 1.0)
 */
export const solarGlowScale = scaleLinear()
  .domain([0, 10000])
  .range([0.25, 1.0])
  .clamp(true);

/**
 * Formatter for Megawatts
 */
export function formatMW(mw: number): string {
  if (Math.abs(mw) >= 1000) {
    return `${(mw / 1000).toFixed(1)} GW`;
  }
  return `${Math.round(mw).toLocaleString('es-ES')} MW`;
}

/**
 * Formatter for Megawatt-hours or Gigawatt-hours
 */
export function formatMWh(mwh: number): string {
  if (Math.abs(mwh) >= 1000) {
    return `${(mwh / 1000).toFixed(1)} GWh`;
  }
  return `${Math.round(mwh).toLocaleString('es-ES')} MWh`;
}

/**
 * Formatter for Euros per MWh
 */
export function formatPrice(eurMWh: number): string {
  return `${eurMWh.toFixed(2)} €/MWh`;
}

/**
 * Formatter for Euros per kWh (consumer view)
 */
export function formatPriceKWh(eurMWh: number): string {
  const eurKWh = eurMWh / 1000;
  return `${eurKWh.toFixed(4)} €/kWh`;
}

/**
 * Format percentages (0.342 -> 34,2%)
 */
export function formatPercentage(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
