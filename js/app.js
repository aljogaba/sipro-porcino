import { calculateInventory } from "./modules/inventory.js";
import { formatCurrency, formatInteger, formatNumber, formatPercent } from "./utils/formatters.js";
import { toNumber } from "./utils/validators.js";

let baseParameters = null;
let currentParameters = null;

const productiveInputs = document.querySelector("#productive-inputs");
const durationInputs = document.querySelector("#duration-inputs");
const kpiGrid = document.querySelector("#kpi-grid");
const flowTable = document.querySelector("#flow-table");
const inventoryTable = document.querySelector("#inventory-table");
const inventoryBars = document.querySelector("#inventory-bars");
const resetBtn = document.querySelector("#reset-btn");

async function init() {
  const response = await fetch("data/default-parameters.json");
  baseParameters = await response.json();
  currentParameters = structuredClone(baseParameters);

  document.querySelector("#app-version").textContent = baseParameters.metadata?.version ?? "0.1.0-dev";

  renderInputs();
  recalculate();
}

function renderInputs() {
  productiveInputs.innerHTML = renderInputCards("productive_parameters", currentParameters.productive_parameters);
  durationInputs.innerHTML = renderInputCards("stage_duration_weeks", currentParameters.stage_duration_weeks);

  document.querySelectorAll("[data-section][data-key]").forEach((input) => {
    input.addEventListener("input", handleInputChange);
  });
}

function renderInputCards(section, entries) {
  return Object.entries(entries).map(([key, item]) => `
    <div class="input-card">
      <label for="${section}-${key}">${item.label}</label>
      <div class="input-row">
        <input
          id="${section}-${key}"
          type="number"
          step="any"
          value="${item.value}"
          data-section="${section}"
          data-key="${key}"
        />
        <span>${item.unit ?? ""}</span>
      </div>
    </div>
  `).join("");
}

function handleInputChange(event) {
  const { section, key } = event.target.dataset;
  currentParameters[section][key].value = toNumber(event.target.value, currentParameters[section][key].value);
  recalculate();
}

function recalculate() {
  const result = calculateInventory(currentParameters);
  renderKpis(result);
  renderFlowTable(result.flow);
  renderInventory(result.groups);
}

function renderKpis({ flow, groups }) {
  const kpis = [
    { label: "Cerdos vendidos/mes", value: formatNumber(flow.pigsSoldPerMonth, 2), unit: "cerdos", type: "positive" },
    { label: "Días a mercado", value: formatInteger(flow.daysToMarket), unit: "días", type: "warning" },
    { label: "Inventario total", value: formatNumber(groups.totalInventory, 1), unit: "animales", type: "positive" },
    { label: "Inventario prom./hembra", value: formatNumber(groups.inventoryPerSow, 2), unit: "animales/vientre", type: "positive" },
    { label: "Partos/hembra/año", value: formatNumber(flow.farrowingsPerSowPerYear, 2), unit: "partos", type: "positive" },
    { label: "Lechones dest./camada", value: formatNumber(flow.weanedPerLitter, 2), unit: "lechones", type: "positive" },
    { label: "Cerdos vend./hembra/año", value: formatNumber(flow.pigsSoldPerSowPerYear, 2), unit: "cerdos", type: "positive" },
    { label: "Ingreso bruto mensual", value: formatCurrency(flow.grossMonthlyIncome, 2), unit: "MXN", type: "economic" },
    { label: "Mortalidad global", value: formatPercent(flow.totalMortalityPercent, 1), unit: "suma de mortalidades", type: "warning" },
    { label: "Factor de eficiencia", value: formatNumber(groups.efficiencyFactor, 2), unit: "cerdos/hembra/mes", type: "positive" }
  ];

  kpiGrid.innerHTML = kpis.map((kpi) => `
    <article class="kpi-card ${kpi.type}">
      <div class="label">${kpi.label}</div>
      <div>
        <div class="value">${kpi.value}</div>
        <div class="unit">${kpi.unit}</div>
      </div>
    </article>
  `).join("");
}

function renderFlowTable(flow) {
  const rows = [
    ["Hembras servidas", flow.servedSowsPerWeek],
    ["Partos", flow.farrowingsPerWeek],
    ["Nacidos vivos", flow.livebornPerWeek],
    ["Lechones destetados", flow.weanedPerWeek],
    ["Lechones a iniciación", flow.pigsToInitiationPerWeek],
    ["Cerdos a crecimiento", flow.pigsToGrowthPerWeek],
    ["Cerdos a desarrollo", flow.pigsToDevelopmentPerWeek],
    ["Cerdos a engorda", flow.pigsToFinishingPerWeek],
    ["Cerdos a rastro", flow.pigsToMarketPerWeek]
  ];

  flowTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Indicador</th><th>Animales/semana</th></tr>
      </thead>
      <tbody>
        ${rows.map(([label, value]) => `<tr><td>${label}</td><td>${formatNumber(value, 2)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderInventory(groups) {
  const rows = [
    ["Lactantes", groups.lactantes],
    ["Destete", groups.destete],
    ["Engorda", groups.engorda],
    ["Total", groups.totalInventory]
  ];
  const max = Math.max(groups.lactantes, groups.destete, groups.engorda);

  inventoryBars.innerHTML = rows.slice(0, 3).map(([label, value]) => {
    const width = max > 0 ? (value / max) * 100 : 0;
    return `
      <div class="bar-item">
        <div class="bar-label"><span>${label}</span><span>${formatNumber(value, 1)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      </div>
    `;
  }).join("");

  inventoryTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Grupo</th><th>Inventario</th></tr>
      </thead>
      <tbody>
        ${rows.map(([label, value]) => `<tr><td>${label}</td><td>${formatNumber(value, 1)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

resetBtn.addEventListener("click", () => {
  currentParameters = structuredClone(baseParameters);
  renderInputs();
  recalculate();
});

init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="notice" style="margin: 16px;">
      No se pudieron cargar los parámetros del modelo. Abre el proyecto con Live Server o desde GitHub Pages para permitir la lectura del archivo JSON.
    </div>
  `);
});
