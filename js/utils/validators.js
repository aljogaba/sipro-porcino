export function toNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/MXN/gi, "")
    .replace(/%/g, "")
    .replace(/,/g, "");

  if (normalized === "" || normalized === "-" || normalized === ".") return fallback;

  const number = Number(normalized);
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
