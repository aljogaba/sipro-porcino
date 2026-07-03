import { calculateFeed } from "./modules/feed-consumption.js";
import { calculateEconomicSummary } from "./modules/economic-summary.js";
import { analyzeScenarios } from "./modules/scenario-analysis.js";
import { formatCurrency, formatInteger, formatNumber, formatPercent } from "./utils/formatters.js";
import { toNumber } from "./utils/validators.js";

let baseParameters = null;
let currentParameters = null;

const productiveInputs = document.querySelector("#productive-inputs");
const durationInputs = document.querySelector("#duration-inputs");
const feedConsumptionInputs = document.querySelector("#feed-consumption-inputs");
const laborInputs = document.querySelector("#labor-inputs");
const otherCostInputs = document.querySelector("#other-cost-inputs");
const feedCostInputs = document.querySelector("#feed-cost-inputs");
const feedCostPanelTitle = document.querySelector("#feed-cost-panel-title");
const feedCostModeNote = document.querySelector("#feed-cost-mode-note");
const feedCostModeButtons = document.querySelectorAll("[data-feed-mode]");
const kpiGrid = document.querySelector("#kpi-grid");
const flowTable = document.querySelector("#flow-table");
const inventoryTable = document.querySelector("#inventory-table");
const inventoryBars = document.querySelector("#inventory-bars");
const feedKpis = document.querySelector("#feed-kpis");
const feedTable = document.querySelector("#feed-table");
const economicKpis = document.querySelector("#economic-kpis");
const economicResultsTable = document.querySelector("#economic-results-table");
const expensesTable = document.querySelector("#expenses-table");
const scenarioCards = document.querySelector("#scenario-cards");
const scenarioTable = document.querySelector("#scenario-table");
const stickyBalance = document.querySelector("#sticky-balance");
const resetBtn = document.querySelector("#reset-btn");

async function init() {
  const response = await fetch("data/default-parameters.json");
  baseParameters = await response.json();
  currentParameters = structuredClone(baseParameters);

  document.querySelector("#app-version").textContent = baseParameters.metadata?.version ?? "0.4.1-dev";

  renderInputs();
  recalculate();
}

function renderInputs() {
  productiveInputs.innerHTML = renderInputCards("productive_parameters", currentParameters.productive_parameters);
  durationInputs.innerHTML = renderInputCards("stage_duration_weeks", currentParameters.stage_duration_weeks);
  feedConsumptionInputs.innerHTML = renderInputCards("feed_consumption_kg_day", currentParameters.feed_consumption_kg_day);
  laborInputs.innerHTML = renderInputCards("labor", currentParameters.labor);
  otherCostInputs.innerHTML = renderInputCards("other_monthly_costs", currentParameters.other_monthly_costs);
  renderFeedCostMode();

  document.querySelectorAll("[data-section][data-key]").forEach((input) => {
    input.addEventListener("input", handleInputChange);
  });
}

function renderInputCards(section, entries, options = {}) {
  const disabled = options.disabled ? "disabled" : "";
  const disabledClass = options.disabled ? " is-disabled" : "";

  return Object.entries(entries).map(([key, item]) => `
    <div class="input-card${disabledClass}">
      <label for="${section}-${key}">${item.label}</label>
      <div class="input-row">
        <input
          id="${section}-${key}"
          type="number"
          step="any"
          value="${item.value}"
          data-section="${section}"
          data-key="${key}"
          ${disabled}
        />
        <span>${item.unit ?? ""}</span>
      </div>
    </div>
  `).join("");
}

function getActiveFeedCostSection() {
  const mode = currentParameters.feed_cost_mode?.active ?? "purchased";
  return mode === "formulated" ? "feed_costs_formulated_per_kg" : "feed_costs_purchased_per_kg";
}

function renderFeedCostMode() {
  const mode = currentParameters.feed_cost_mode?.active ?? "purchased";
  const modeConfig = currentParameters.feed_cost_mode?.options?.[mode] ?? {};
  const section = getActiveFeedCostSection();
  const isFormulated = mode === "formulated";

  feedCostPanelTitle.textContent = modeConfig.title ?? "Costo por kg de alimento";
  feedCostModeNote.textContent = modeConfig.note ?? "Seleccione el modo de cálculo del costo de alimento.";

  feedCostModeButtons.forEach((button) => {
    const isActive = button.dataset.feedMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  feedCostInputs.innerHTML = renderInputCards(section, currentParameters[section], {
    disabled: isFormulated
  });
}

function handleFeedModeChange(event) {
  currentParameters.feed_cost_mode.active = event.currentTarget.dataset.feedMode;
  renderInputs();
  recalculate();
}

function handleInputChange(event) {
  const { section, key } = event.target.dataset;
  currentParameters[section][key].value = toNumber(event.target.value, currentParameters[section][key].value);
  recalculate();
}

function recalculate() {
  const feedResult = calculateFeed(currentParameters);
  const economicResult = calculateEconomicSummary(currentParameters, feedResult);
  const scenarioResult = analyzeScenarios(currentParameters);
  const result = feedResult.inventory;
  renderKpis(result, feedResult, economicResult);
  renderFlowTable(result.flow);
  renderInventory(result.groups);
  renderFeed(feedResult);
  renderEconomicSummary(economicResult);
  renderScenarios(scenarioResult);
  renderStickyBalance(feedResult, economicResult);
}

function renderKpis({ flow, groups }, feedResult) {
  const kpis = [
    { label: "Partos/hembra/año", value: formatNumber(flow.farrowingsPerSowPerYear, 2), unit: "partos", type: "positive" },
    { label: "Lechones dest./camada", value: formatNumber(flow.weanedPerLitter, 2), unit: "lechones", type: "positive" },
    { label: "Lechones dest./hembra/año", value: formatNumber(flow.weanedPerSowPerYear, 2), unit: "lechones", type: "positive" },
    { label: "Cerdos vend./hembra/año", value: formatNumber(flow.pigsSoldPerSowPerYear, 2), unit: "cerdos", type: "positive" },
    { label: "Cerdos vendidos/mes", value: formatNumber(flow.pigsSoldPerMonth, 2), unit: "cerdos", type: "positive" },
    { label: "Días a mercado", value: formatInteger(flow.daysToMarket), unit: "días", type: "warning" },
    { label: "Mortalidad global", value: formatPercent(flow.totalMortalityPercent, 1), unit: "suma de mortalidades", type: "warning" },
    { label: "Factor de eficiencia", value: formatNumber(groups.efficiencyFactor, 2), unit: "cerdos/hembra/mes", type: "positive" },
    { label: "Inventario total", value: formatNumber(groups.totalInventory, 1), unit: "animales", type: "positive" },
    { label: "Inventario prom./hembra", value: formatNumber(groups.inventoryPerSow, 2), unit: "animales/vientre", type: "positive" },
    { label: "Conv. alim. granja", value: formatNumber(feedResult.totals.feedConversionFarm, 2), unit: "kg alimento/kg vendido", type: "positive" }
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

function renderFeed(feedResult) {
  const { rows, totals } = feedResult;
  const totalCostWeek = totals.totalCostWeek || 1;

  feedKpis.innerHTML = `
    <article class="kpi-card economic">
      <div class="label">Costo alimento/semana</div>
      <div><div class="value">${formatCurrency(totals.totalCostWeek, 2)}</div><div class="unit">MXN</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Kg alimento/mes</div>
      <div><div class="value">${formatNumber(totals.totalKgMonth, 1)}</div><div class="unit">kg</div></div>
    </article>
    <article class="kpi-card economic">
      <div class="label">Costo alimento/kg</div>
      <div><div class="value">${formatCurrency(totals.feedCostPerKg, 2)}</div><div class="unit">MXN/kg alimento</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Conv. alim. granja</div>
      <div><div class="value">${formatNumber(totals.feedConversionFarm, 2)}</div><div class="unit">kg alimento/kg vendido</div></div>
    </article>
  `;

  feedTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Etapa</th>
          <th>Inventario alim.</th>
          <th>Kg/sem</th>
          <th>Costo/sem</th>
          <th>% costo</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${row.label}</td>
            <td>${formatNumber(row.animals, 1)}</td>
            <td>${formatNumber(row.kgWeek, 1)}</td>
            <td>${formatCurrency(row.costWeek, 2)}</td>
            <td>${formatPercent((row.costWeek / totalCostWeek) * 100, 2)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Total</td>
          <td>—</td>
          <td>${formatNumber(totals.totalKgWeek, 1)}</td>
          <td>${formatCurrency(totals.totalCostWeek, 2)}</td>
          <td>${formatPercent(100, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;
}


function renderEconomicSummary(economicResult) {
  economicKpis.innerHTML = `
    <article class="kpi-card economic">
      <div class="label">Ingresos mes</div>
      <div><div class="value">${formatCurrency(economicResult.grossIncomeMonth, 2)}</div><div class="unit">100 %</div></div>
    </article>
    <article class="kpi-card bad">
      <div class="label">Egresos mes</div>
      <div><div class="value">${formatCurrency(economicResult.totalCostsMonth, 2)}</div><div class="unit">${formatPercent(economicResult.costPercentOfIncome, 1)} del ingreso</div></div>
    </article>
    <article class="kpi-card ${economicResult.profitMonth >= 0 ? "positive" : "bad"}">
      <div class="label">Utilidad mes</div>
      <div><div class="value">${formatCurrency(economicResult.profitMonth, 2)}</div><div class="unit">${formatPercent(economicResult.profitPercentOfIncome, 1)} del ingreso</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Utilidad semana</div>
      <div><div class="value">${formatCurrency(economicResult.profitWeek, 2)}</div><div class="unit">MXN/semana</div></div>
    </article>
  `;

  economicResultsTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Resultado</th><th>Monto mensual</th><th>% ingreso</th></tr>
      </thead>
      <tbody>
        <tr><td>Ingresos mes</td><td>${formatCurrency(economicResult.grossIncomeMonth, 2)}</td><td>${formatPercent(100, 1)}</td></tr>
        <tr><td>Egresos mes</td><td>${formatCurrency(economicResult.totalCostsMonth, 2)}</td><td>${formatPercent(economicResult.costPercentOfIncome, 1)}</td></tr>
        <tr class="total-row"><td>Utilidad mes</td><td>${formatCurrency(economicResult.profitMonth, 2)}</td><td>${formatPercent(economicResult.profitPercentOfIncome, 1)}</td></tr>
        <tr><td>Utilidad semana</td><td>${formatCurrency(economicResult.profitWeek, 2)}</td><td>—</td></tr>
      </tbody>
    </table>
  `;

  expensesTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th>Monto mensual</th>
          <th>% egresos</th>
          <th>% ingresos</th>
        </tr>
      </thead>
      <tbody>
        ${economicResult.expenseRows.map((row) => `
          <tr>
            <td>${row.label}</td>
            <td>${formatCurrency(row.amount, 2)}</td>
            <td>${formatPercent(row.percentOfTotalCosts, 2)}</td>
            <td>${formatPercent(row.percentOfIncome, 2)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Gastos totales</td>
          <td>${formatCurrency(economicResult.totalCostsMonth, 2)}</td>
          <td>${formatPercent(100, 2)}</td>
          <td>${formatPercent(economicResult.costPercentOfIncome, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;
}


function renderStickyBalance(feedResult, economicResult) {
  if (!stickyBalance) return;

  const profitType = economicResult.profitMonth >= 0 ? "positive" : "bad";
  stickyBalance.innerHTML = `
    <article class="balance-card economic">
      <span>Ingresos mes</span>
      <strong>${formatCurrency(economicResult.grossIncomeMonth, 2)}</strong>
      <small>100 %</small>
    </article>
    <article class="balance-card bad">
      <span>Egresos mes</span>
      <strong>${formatCurrency(economicResult.totalCostsMonth, 2)}</strong>
      <small>${formatPercent(economicResult.costPercentOfIncome, 1)} del ingreso</small>
    </article>
    <article class="balance-card ${profitType}">
      <span>Utilidad mes</span>
      <strong>${formatCurrency(economicResult.profitMonth, 2)}</strong>
      <small>${formatPercent(economicResult.profitPercentOfIncome, 1)} del ingreso</small>
    </article>
    <div class="balance-mini-grid">
      <div><span>Costo alimento/mes</span><strong>${formatCurrency(feedResult.totals.totalCostMonth, 2)}</strong></div>
      <div><span>Conv. alim.</span><strong>${formatNumber(feedResult.totals.feedConversionFarm, 2)}</strong></div>
      <div><span>Utilidad semana</span><strong>${formatCurrency(economicResult.profitWeek, 2)}</strong></div>
      <div><span>Margen</span><strong>${formatPercent(economicResult.profitPercentOfIncome, 1)}</strong></div>
    </div>
  `;
}

function renderDelta(value, formatter = formatCurrency) {
  const sign = value > 0 ? "+" : "";
  const className = value >= 0 ? "delta-positive" : "delta-negative";
  return `<span class="${className}">${sign}${formatter(value, 2)}</span>`;
}

function renderScenarios(scenarios) {
  if (!scenarioCards || !scenarioTable) return;

  const comparisonScenarios = scenarios.slice(1);

  scenarioCards.innerHTML = comparisonScenarios.map((scenario) => `
    <article class="scenario-card">
      <div>
        <h3>${scenario.name}</h3>
        <p>${scenario.description}</p>
      </div>
      <div class="scenario-metric">
        <span>Utilidad mensual</span>
        <strong>${formatCurrency(scenario.metrics.profitMonth, 2)}</strong>
        <small>Δ vs actual: ${renderDelta(scenario.delta.profitMonth)}</small>
      </div>
    </article>
  `).join("");

  scenarioTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Escenario</th>
          <th>Cerdos vendidos/mes</th>
          <th>Ingreso mes</th>
          <th>Costo alimento mes</th>
          <th>Egresos mes</th>
          <th>Utilidad mes</th>
          <th>Δ utilidad</th>
          <th>Margen</th>
        </tr>
      </thead>
      <tbody>
        ${scenarios.map((scenario) => `
          <tr class="${scenario.id === "base" ? "total-row" : ""}">
            <td>${scenario.name}</td>
            <td>${formatNumber(scenario.metrics.pigsSoldPerMonth, 2)}</td>
            <td>${formatCurrency(scenario.metrics.grossIncomeMonth, 2)}</td>
            <td>${formatCurrency(scenario.metrics.feedCostMonth, 2)}</td>
            <td>${formatCurrency(scenario.metrics.totalCostsMonth, 2)}</td>
            <td>${formatCurrency(scenario.metrics.profitMonth, 2)}</td>
            <td>${scenario.id === "base" ? "—" : renderDelta(scenario.delta.profitMonth)}</td>
            <td>${formatPercent(scenario.metrics.profitPercentOfIncome, 1)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

feedCostModeButtons.forEach((button) => {
  button.addEventListener("click", handleFeedModeChange);
});

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
