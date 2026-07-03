export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value, min = -Infinity, max = Infinity) {
  return Math.min(Math.max(value, min), max);
}

export function percentToProportion(percent) {
  return clamp(toNumber(percent), 0, 100) / 100;
}

export function survivalFromMortality(percentMortality) {
  return 1 - percentToProportion(percentMortality);
}
