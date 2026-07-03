export function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatInteger(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, decimals)} %`;
}
