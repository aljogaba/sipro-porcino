import { calculateFeed } from "./modules/feed-consumption.js";
import { calculateFeedFormulation } from "./modules/feed-formulation.js";
import { calculateEconomicSummary } from "./modules/economic-summary.js";
import { calculateOperationalExpenses } from "./modules/operational-expenses.js";
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
const operationalExpenseKpis = document.querySelector("#operational-expense-kpis");
const operationalExpenseCategories = document.querySelector("#operational-expense-categories");
const operationalExpenseTable = document.querySelector("#operational-expense-table");
const feedCostInputs = document.querySelector("#feed-cost-inputs");
const feedCostPanelTitle = document.querySelector("#feed-cost-panel-title");
const feedCostModeNote = document.querySelector("#feed-cost-mode-note");
const feedCostModeButtons = document.querySelectorAll("[data-feed-mode]");
const feedFormulationPanel = document.querySelector("#feed-formulation-panel");
const formulationKpis = document.querySelector("#formulation-kpis");
const formulationIngredientTable = document.querySelector("#formulation-ingredient-table");
const formulationNucleiTable = document.querySelector("#formulation-nuclei-table");
const formulationDietTable = document.querySelector("#formulation-diet-table");
const formulationBalanceTable = document.querySelector("#formulation-balance-table");
const medicationKpis = document.querySelector("#medication-kpis");
const medicationProductTable = document.querySelector("#medication-product-table");
const medicationMatrixTable = document.querySelector("#medication-matrix-table");
const medicationBalanceTable = document.querySelector("#medication-balance-table");
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

  document.querySelector("#app-version").textContent = baseParameters.metadata?.version ?? "0.6.0-dev";

  renderInputs();
  recalculate();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function helpIcon(text) {
  const safe = escapeHtml(text);
  return `<span class="help-icon" tabindex="0" role="img" aria-label="Ayuda: ${safe}" data-tooltip="${safe}" title="${safe}">?</span>`;
}

function formatInputValue(value, decimals = null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? "";

  if (decimals === null) {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2
    }).format(number);
  }

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

function unformatInputValue(value) {
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function applyInputFormatting(input) {
  const decimals = input.dataset.decimals === "auto" ? null : Number(input.dataset.decimals);
  const parsed = toNumber(input.value, NaN);
  if (Number.isFinite(parsed)) {
    input.value = formatInputValue(parsed, Number.isFinite(decimals) ? decimals : null);
  }
}

function attachEditableNumberEvents(input) {
  input.addEventListener("focus", () => {
    input.value = unformatInputValue(input.value);
    input.select();
  });

  input.addEventListener("blur", () => {
    applyInputFormatting(input);
  });
}

function getInputFormat(section, item) {
  const unit = String(item?.unit ?? "").toLowerCase();

  if (unit.includes("$/") || unit.includes("mxn") || section.includes("cost")) {
    return { decimals: 2, step: "0.01" };
  }

  if (unit.includes("kg") || unit.includes("ton") || unit.includes("semanas")) {
    return { decimals: 1, step: "0.1" };
  }

  return { decimals: null, step: "any" };
}

function renderInputs() {
  productiveInputs.innerHTML = renderInputCards("productive_parameters", currentParameters.productive_parameters);
  durationInputs.innerHTML = renderInputCards("stage_duration_weeks", currentParameters.stage_duration_weeks);
  feedConsumptionInputs.innerHTML = renderInputCards("feed_consumption_kg_day", currentParameters.feed_consumption_kg_day);
  laborInputs.innerHTML = renderInputCards("labor", currentParameters.labor);
  const visibleOtherCosts = Object.fromEntries(Object.entries(currentParameters.other_monthly_costs ?? {}).filter(([key]) => key !== "medicine_taxes_misc"));
  otherCostInputs.innerHTML = renderInputCards("other_monthly_costs", visibleOtherCosts);
  renderFeedCostMode();

  document.querySelectorAll("[data-section][data-key]").forEach((input) => {
    input.addEventListener("input", handleInputChange);
    attachEditableNumberEvents(input);
  });
}

function renderInputCards(section, entries, options = {}) {
  const disabled = options.disabled ? "disabled" : "";
  const disabledClass = options.disabled ? " is-disabled" : "";

  return Object.entries(entries).map(([key, item]) => {
    const { decimals, step } = getInputFormat(section, item);
    const help = item.note ? helpIcon(item.note) : "";
    return `
      <div class="input-card${disabledClass}">
        <label for="${section}-${key}">${escapeHtml(item.label)}${help}</label>
        <div class="input-row">
          <input
            id="${section}-${key}"
            type="text"
            inputmode="decimal"
            step="${step}"
            value="${formatInputValue(item.value, decimals)}"
            data-section="${section}"
            data-key="${key}"
            data-decimals="${decimals === null ? "auto" : decimals}"
            ${disabled}
          />
          <span>${escapeHtml(item.unit ?? "")}</span>
        </div>
      </div>
    `;
  }).join("");
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

  if (feedFormulationPanel) {
    feedFormulationPanel.hidden = !isFormulated;
    feedFormulationPanel.setAttribute("aria-hidden", String(!isFormulated));
  }

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


function syncFormulatedFeedCosts(formulationResult) {
  Object.entries(formulationResult.dietCostMap ?? {}).forEach(([dietKey, costPerKg]) => {
    if (currentParameters.feed_costs_formulated_per_kg?.[dietKey]) {
      currentParameters.feed_costs_formulated_per_kg[dietKey].value = costPerKg;
    }
  });
}

function handleFormulationInput(event) {
  const { formulationType, key, field, dietKey, ingredientKey } = event.target.dataset;
  const formulation = currentParameters.feed_formulation;

  if (!formulation) return;

  if (formulationType === "ingredient") {
    if (field === "label") {
      formulation.ingredients[key].label = event.target.value;
    } else if (field === "price") {
      formulation.ingredients[key].price = toNumber(event.target.value, formulation.ingredients[key].price);
    }
  }

  if (formulationType === "nucleus") {
    formulation.nuclei[key].price = toNumber(event.target.value, formulation.nuclei[key].price);
  }

  if (formulationType === "diet-ingredient") {
    formulation.diets[dietKey].ingredients_kg[ingredientKey] = toNumber(event.target.value, formulation.diets[dietKey].ingredients_kg[ingredientKey]);
  }

  if (formulationType === "diet-nucleus") {
    formulation.diets[dietKey].nucleus_kg = toNumber(event.target.value, formulation.diets[dietKey].nucleus_kg);
  }

  if (formulationType === "med-product") {
    const premix = currentParameters.medication_premix;
    if (!premix?.products?.[key]) return;
    if (field === "label") {
      premix.products[key].label = event.target.value;
    } else if (field === "price") {
      premix.products[key].price = toNumber(event.target.value, premix.products[key].price);
    }
  }

  if (formulationType === "med-inclusion") {
    const premix = currentParameters.medication_premix;
    if (!premix?.inclusions_kg_ton?.[key]) return;
    premix.inclusions_kg_ton[key][dietKey] = toNumber(event.target.value, premix.inclusions_kg_ton[key][dietKey] ?? 0);
  }

  recalculate();
}

function recalculate() {
  const formulationPreResult = calculateFeedFormulation(currentParameters);
  syncFormulatedFeedCosts(formulationPreResult);

  if ((currentParameters.feed_cost_mode?.active ?? "purchased") === "formulated") {
    renderFeedCostMode();
  }

  const feedResult = calculateFeed(currentParameters);
  const formulationResult = calculateFeedFormulation(currentParameters, feedResult);
  syncFormulatedFeedCosts(formulationResult);

  const operationalExpenseResult = calculateOperationalExpenses(currentParameters);
  const economicResult = calculateEconomicSummary(currentParameters, feedResult, operationalExpenseResult);
  const scenarioResult = analyzeScenarios(currentParameters);
  const result = feedResult.inventory;
  renderKpis(result, feedResult, economicResult);
  renderFlowTable(result.flow);
  renderInventory(result.groups);
  renderFeed(feedResult);
  if ((currentParameters.feed_cost_mode?.active ?? "purchased") === "formulated") {
    renderFeedFormulation(formulationResult);
  }
  renderOperationalExpenses(operationalExpenseResult);
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
    { label: "Días a mercado", value: formatInteger(flow.daysToMarket), unit: "días", type: "positive" },
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
    ["Cerdos a finalización", flow.pigsToFinishingPerWeek],
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
  const pigRows = [
    ["Lactantes", groups.lactantes],
    ["Destete", groups.destete],
    ["Finalización", groups.engorda],
    ["Total cerdos", groups.totalInventory]
  ];

  const femaleRows = [
    ["Hembras lactando", groups.breedingFemales?.lactating ?? 0],
    ["Hembras abiertas", groups.breedingFemales?.open ?? 0],
    ["Hembras gestantes", groups.breedingFemales?.gestating ?? 0],
    ["Total vientres", groups.breedingFemales?.total ?? 0]
  ];

  const renderBars = (rows, max) => rows.slice(0, 3).map(([label, value]) => {
    const width = max > 0 ? (value / max) * 100 : 0;
    return `
      <div class="bar-item">
        <div class="bar-label"><span>${label}</span><span>${formatNumber(value, 1)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      </div>
    `;
  }).join("");

  const maxPigs = Math.max(groups.lactantes, groups.destete, groups.engorda);
  const maxFemales = Math.max(
    groups.breedingFemales?.lactating ?? 0,
    groups.breedingFemales?.open ?? 0,
    groups.breedingFemales?.gestating ?? 0
  );

  inventoryBars.innerHTML = `
    <div class="inventory-subsection">
      <h3>Cerdos en producción</h3>
      ${renderBars(pigRows, maxPigs)}
    </div>
    <div class="inventory-subsection">
      <h3>Hembras reproductivas</h3>
      ${renderBars(femaleRows, maxFemales)}
    </div>
  `;

  inventoryTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Grupo</th><th>Inventario</th></tr>
      </thead>
      <tbody>
        <tr class="group-row"><td colspan="2">Cerdos en producción</td></tr>
        ${pigRows.map(([label, value]) => `<tr><td>${label}</td><td>${formatNumber(value, 1)}</td></tr>`).join("")}
        <tr class="group-row"><td colspan="2">Hembras reproductivas</td></tr>
        ${femaleRows.map(([label, value]) => `<tr><td>${label}</td><td>${formatNumber(value, 1)}</td></tr>`).join("")}
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



function renderFeedFormulation(formulationResult) {
  if (!formulationKpis || !formulationIngredientTable || !formulationDietTable || !formulationBalanceTable) return;

  const formulation = currentParameters.feed_formulation ?? {};
  const activeMode = currentParameters.feed_cost_mode?.active ?? "purchased";
  const unbalanced = formulationResult.diets.filter((diet) => !diet.isBalanced);

  formulationKpis.innerHTML = `
    <article class="kpi-card ${activeMode === "formulated" ? "positive" : "economic"}">
      <div class="label">Modo activo alimento</div>
      <div><div class="value">${activeMode === "formulated" ? "Formulación" : "Compra"}</div><div class="unit">${activeMode === "formulated" ? "usa costos calculados" : "usa costos capturados"}</div></div>
    </article>
    <article class="kpi-card ${unbalanced.length === 0 ? "positive" : "warning"}">
      <div class="label">Fórmulas balanceadas</div>
      <div><div class="value">${formulationResult.diets.length - unbalanced.length}/${formulationResult.diets.length}</div><div class="unit">base ${formatNumber(formulationResult.batchKg, 0)} kg</div></div>
    </article>
    <article class="kpi-card economic">
      <div class="label">Costo formulado promedio</div>
      <div><div class="value">${formatCurrency(mean(formulationResult.diets.map((d) => d.costPerKg)), 2)}</div><div class="unit">MXN/kg dieta</div></div>
    </article>
  `;

  formulationIngredientTable.innerHTML = renderIngredientTable(formulation.ingredients ?? {});
  formulationNucleiTable.innerHTML = renderNucleiTable(formulation.nuclei ?? {});
  formulationDietTable.innerHTML = renderDietFormulaTable(formulation, formulationResult);
  renderMedicationPremix(formulationResult.medication, formulation);
  formulationBalanceTable.innerHTML = renderIngredientBalanceTable(formulationResult.balance);

  document.querySelectorAll("[data-formulation-type]").forEach((input) => {
    input.addEventListener("change", handleFormulationInput);
    if (input.dataset.decimals) {
      attachEditableNumberEvents(input);
    }
  });
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function renderIngredientTable(ingredients) {
  return `
    <table class="compact-table">
      <thead>
        <tr>
          <th>Ingrediente ${helpIcon("Insumo disponible para formular las dietas. Los opcionales permiten capturar ingredientes alternativos de la granja.")}</th>
          <th>Precio/kg ${helpIcon("Valor económico del ingrediente. Se captura con dos decimales y se usa para calcular el costo por tonelada de dieta.")}</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(ingredients).map(([key, ingredient]) => `
          <tr>
            <td>
              ${ingredient.editable_label ? `
                <input class="inline-input text-input" type="text" value="${escapeHtml(ingredient.label)}" data-formulation-type="ingredient" data-key="${key}" data-field="label" />
              ` : `<strong>${escapeHtml(ingredient.label)}</strong>`}
            </td>
            <td>
              <input class="inline-input money-input" type="text" inputmode="decimal" step="0.01" value="${formatInputValue(ingredient.price, 2)}" data-decimals="2" data-formulation-type="ingredient" data-key="${key}" data-field="price" />
            </td>
            <td>${escapeHtml(ingredient.type ?? "ingrediente")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderNucleiTable(nuclei) {
  return `
    <table class="compact-table">
      <thead>
        <tr>
          <th>Núcleo / dieta ${helpIcon("Núcleo, premezcla o dieta completa específica de la etapa. En Fase 0 y Fase 1 puede representar la dieta terminada.")}</th>
          <th>Precio/kg ${helpIcon("Costo por kg del núcleo o dieta completa. Este valor entra al costo final de la tonelada formulada.")}</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(nuclei).map(([key, nucleus]) => `
          <tr>
            <td><strong>${escapeHtml(nucleus.label)}</strong>${["phase_0", "phase_1"].includes(key) ? ` <span class="stage-chip" title="Dieta completa comprada: por eso puede representar 1,000 kg de la fórmula.">Dieta completa</span>` : ""}</td>
            <td>
              <input class="inline-input money-input" type="text" inputmode="decimal" step="0.01" value="${formatInputValue(nucleus.price, 2)}" data-decimals="2" data-formulation-type="nucleus" data-key="${key}" />
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderDietFormulaTable(formulation, formulationResult) {
  const ingredients = formulation.ingredients ?? {};
  const ingredientKeys = Object.keys(ingredients);
  const dietResultMap = Object.fromEntries(formulationResult.diets.map((diet) => [diet.key, diet]));

  return `
    <table class="formula-table">
      <thead>
        <tr>
          <th>Dieta ${helpIcon("Cada fila representa una dieta calculada sobre una base de 1,000 kg.")}</th>
          ${ingredientKeys.map((key) => `<th>${escapeHtml(ingredients[key].label)}<br><span>kg/ton</span></th>`).join("")}
          <th>Núcleo ${helpIcon("Cantidad del núcleo, premezcla o dieta completa incluida por tonelada. En Fase 0 y Fase 1 puede ser 1,000 kg porque se compran terminadas.")}<br><span>kg/ton</span></th>
          <th>Total kg ${helpIcon("La suma de ingredientes + núcleo debe ser igual a 1,000 kg por tonelada.")}</th>
          <th>Costo/ton ${helpIcon("Suma del costo aportado por ingredientes y núcleo en una tonelada de alimento.")}</th>
          <th>Costo/kg ${helpIcon("Costo por tonelada dividido entre 1,000 kg. Este valor alimenta el módulo de costos cuando se usa Formulación propia.")}</th>
          <th>Estado ${helpIcon("Indica si la dieta suma exactamente 1,000 kg. Si aparece diferencia, revise los kg/ton capturados.")}</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(formulation.diets ?? {}).map(([dietKey, diet]) => {
          const result = dietResultMap[dietKey];
          const completeDiet = ["phase_0", "phase_1"].includes(dietKey);
          return `
            <tr class="${completeDiet ? "complete-diet-row" : ""}">
              <td><strong>${escapeHtml(diet.label)}</strong>${completeDiet ? ` <span class="stage-chip" title="Dieta completa comprada: normalmente no se formula en granja.">Dieta completa</span>` : ""}</td>
              ${ingredientKeys.map((ingredientKey) => `
                <td>
                  <input class="inline-input small-input weight-input" type="text" inputmode="decimal" step="0.1" value="${formatInputValue(diet.ingredients_kg?.[ingredientKey] ?? 0, 1)}" data-decimals="1" data-formulation-type="diet-ingredient" data-diet-key="${dietKey}" data-ingredient-key="${ingredientKey}" />
                </td>
              `).join("")}
              <td>
                <input class="inline-input small-input weight-input" type="text" inputmode="decimal" step="0.1" value="${formatInputValue(diet.nucleus_kg, 1)}" data-decimals="1" data-formulation-type="diet-nucleus" data-diet-key="${dietKey}" />
              </td>
              <td>${formatNumber(result.totalKg, 1)}</td>
              <td>${formatCurrency(result.costPerTon, 2)}</td>
              <td>${formatCurrency(result.costPerKg, 2)}</td>
              <td><span class="status-chip ${result.isBalanced ? "ok" : "warn"}">${result.isBalanced ? "1000 kg" : `Δ ${formatNumber(result.balanceDelta, 1)} kg`}</span></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}


function getDietLabel(formulation, dietKey) {
  return formulation?.diets?.[dietKey]?.label ?? dietKey;
}

function renderMedicationPremix(medicationResult, formulation) {
  if (!medicationKpis || !medicationProductTable || !medicationMatrixTable || !medicationBalanceTable || !medicationResult) return;

  const maxCostDiet = Object.entries(medicationResult.stageTotals ?? {})
    .map(([dietKey, value]) => ({ dietKey, ...value }))
    .sort((a, b) => b.costPerTon - a.costPerTon)[0];

  medicationKpis.innerHTML = `
    <article class="kpi-card economic">
      <div class="label">Costo mensual medicación</div>
      <div><div class="value">${formatCurrency(medicationResult.totals.totalCostMonth, 2)}</div><div class="unit">MXN/mes</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Mayor costo/ton</div>
      <div><div class="value">${formatCurrency(maxCostDiet?.costPerTon ?? 0, 2)}</div><div class="unit">${escapeHtml(getDietLabel(formulation, maxCostDiet?.dietKey))}</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Insumo mensual</div>
      <div><div class="value">${formatNumber(medicationResult.totals.totalKgMonth, 1)}</div><div class="unit">kg/mes no ponderal</div></div>
    </article>
  `;

  medicationProductTable.innerHTML = renderMedicationProductTable(medicationResult);
  medicationMatrixTable.innerHTML = renderMedicationMatrixTable(medicationResult, formulation);
  medicationBalanceTable.innerHTML = renderMedicationBalanceTable(medicationResult, formulation);
}

function renderMedicationProductTable(medicationResult) {
  const rows = medicationResult.allRows ?? [];
  return `
    <table class="compact-table">
      <thead>
        <tr>
          <th>Producto ${helpIcon("Producto, aditivo, medicación o suplementación usada como costo no ponderal. Los nombres son editables y los valores precargados son solo ejemplos.")}</th>
          <th>Precio/kg ${helpIcon("Costo unitario del producto. Se usa para calcular el cargo económico por tonelada de dieta.")}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>
              ${row.editableLabel ? `
                <input class="inline-input text-input" type="text" value="${escapeHtml(row.label)}" data-formulation-type="med-product" data-key="${row.key}" data-field="label" />
              ` : `<strong>${escapeHtml(row.label)}</strong>`}
            </td>
            <td>
              <input class="inline-input money-input" type="text" inputmode="decimal" step="0.01" value="${formatInputValue(row.price, 2)}" data-decimals="2" data-formulation-type="med-product" data-key="${row.key}" data-field="price" />
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderMedicationMatrixTable(medicationResult, formulation) {
  const stageOrder = medicationResult.stageOrder ?? [];
  const rows = medicationResult.allRows ?? [];
  return `
    <table class="formula-table medication-table">
      <thead>
        <tr>
          <th>Producto ${helpIcon("Cada fila captura la inclusión por tonelada de dieta. Puedes cambiar el nombre del producto en la tabla de productos; estos kg no modifican el cierre de 1,000 kg de la fórmula alimenticia.")}</th>
          ${stageOrder.map((dietKey) => `<th>${escapeHtml(getDietLabel(formulation, dietKey))}<br><span>kg/ton</span></th>`).join("")}
          <th>Total $/ton ${helpIcon("Suma del costo por tonelada considerando todas las etapas donde se usa el producto. Es una lectura de referencia, no un costo de una sola dieta.")}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td><strong>${escapeHtml(row.label)}</strong></td>
            ${stageOrder.map((dietKey) => `
              <td>
                <input class="inline-input small-input weight-input" type="text" inputmode="decimal" step="0.1" value="${formatInputValue(row.dietValues?.[dietKey]?.kgTon ?? 0, 2)}" data-decimals="2" data-formulation-type="med-inclusion" data-key="${row.key}" data-diet-key="${dietKey}" />
              </td>
            `).join("")}
            <td>${formatCurrency(row.totalCostPerTon, 2)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Costo medicación/ton</td>
          ${stageOrder.map((dietKey) => `<td>${formatCurrency(medicationResult.stageTotals?.[dietKey]?.costPerTon ?? 0, 2)}</td>`).join("")}
          <td>${formatCurrency(medicationResult.totals.totalCostPerTonAcrossDiets, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderMedicationBalanceTable(medicationResult, formulation) {
  const stageOrder = medicationResult.stageOrder ?? [];
  return `
    <table>
      <thead>
        <tr><th>Dieta</th><th>Costo/ton</th><th>Costo/kg dieta</th><th>Kg/mes estimados</th><th>Costo mensual</th></tr>
      </thead>
      <tbody>
        ${stageOrder.map((dietKey) => {
          const item = medicationResult.stageTotals?.[dietKey] ?? {};
          return `
            <tr>
              <td>${escapeHtml(getDietLabel(formulation, dietKey))}</td>
              <td>${formatCurrency(item.costPerTon ?? 0, 2)}</td>
              <td>${formatCurrency((item.costPerTon ?? 0) / (medicationResult.batchKg || 1000), 4)}</td>
              <td>${formatNumber(item.kgMonth ?? 0, 1)}</td>
              <td>${formatCurrency(item.costMonth ?? 0, 2)}</td>
            </tr>
          `;
        }).join("")}
        <tr class="total-row">
          <td>Total</td>
          <td>—</td>
          <td>—</td>
          <td>${formatNumber(medicationResult.totals.totalKgMonth, 1)}</td>
          <td>${formatCurrency(medicationResult.totals.totalCostMonth, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderIngredientBalanceTable(balance) {
  const rows = balance?.rows ?? [];
  const totals = balance?.totals ?? {};

  if (rows.length === 0) {
    return `<p class="panel-note">El balance mensual se calculará cuando exista consumo de alimento asociado a las dietas formuladas.</p>`;
  }

  return `
    <table>
      <thead>
        <tr><th>Insumo</th><th>Tipo</th><th>Kg/mes</th><th>Ton/mes</th><th>Costo mensual</th></tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(row.label)}</td>
            <td>${escapeHtml(row.type)}</td>
            <td>${formatNumber(row.kgMonth, 1)}</td>
            <td>${formatNumber(row.kgMonth / 1000, 2)}</td>
            <td>${formatCurrency(row.costMonth, 2)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Total</td>
          <td>—</td>
          <td>${formatNumber(totals.totalKgMonth ?? 0, 1)}</td>
          <td>${formatNumber((totals.totalKgMonth ?? 0) / 1000, 2)}</td>
          <td>${formatCurrency(totals.totalCostMonth ?? 0, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function handleOperationalExpenseInput(event) {
  const { categoryKey, rowIndex, field } = event.target.dataset;
  const category = currentParameters.operational_expenses?.categories?.[categoryKey];
  const row = category?.rows?.[Number(rowIndex)];

  if (!row) return;

  if (field === "concept") {
    row.concept = event.target.value;
  } else if (field === "quantity") {
    row.quantity = toNumber(event.target.value, row.quantity ?? 0);
  } else if (field === "unit_cost") {
    row.unit_cost = toNumber(event.target.value, row.unit_cost ?? 0);
  }

  recalculate();
}

function renderOperationalExpenses(operationalExpenseResult) {
  if (!operationalExpenseKpis || !operationalExpenseCategories || !operationalExpenseTable) return;

  const categories = operationalExpenseResult?.categoryRows ?? [];
  const totalMonth = operationalExpenseResult?.totalMonth ?? 0;
  const topCategory = [...categories].sort((a, b) => b.total - a.total)[0];
  const activeCategories = categories.filter((category) => category.total > 0).length;

  operationalExpenseKpis.innerHTML = `
    <article class="kpi-card economic">
      <div class="label">Total mensual</div>
      <div><div class="value">${formatCurrency(totalMonth, 2)}</div><div class="unit">medicina, impuestos y varios</div></div>
    </article>
    <article class="kpi-card positive">
      <div class="label">Rubros con gasto</div>
      <div><div class="value">${activeCategories}</div><div class="unit">categorías activas</div></div>
    </article>
    <article class="kpi-card ${topCategory?.total > 0 ? "warning" : "positive"}">
      <div class="label">Mayor rubro</div>
      <div><div class="value">${topCategory?.total > 0 ? formatCurrency(topCategory.total, 2) : "$0.00"}</div><div class="unit">${topCategory?.total > 0 ? escapeHtml(topCategory.label) : "sin gasto"}</div></div>
    </article>
  `;

  operationalExpenseCategories.innerHTML = categories.map((category, index) => renderOperationalExpenseCategory(category, index === 0)).join("");

  operationalExpenseTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Rubro</th><th>Total mensual</th><th>% del bloque</th></tr>
      </thead>
      <tbody>
        ${categories.map((category) => `
          <tr>
            <td>${escapeHtml(category.label)}</td>
            <td>${formatCurrency(category.total, 2)}</td>
            <td>${formatPercent(category.percentOfTotal, 2)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Total</td>
          <td>${formatCurrency(totalMonth, 2)}</td>
          <td>${formatPercent(100, 2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  document.querySelectorAll("[data-operational-field]").forEach((input) => {
    input.addEventListener("change", handleOperationalExpenseInput);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") event.currentTarget.blur();
    });
    if (input.dataset.decimals) {
      attachEditableNumberEvents(input);
    }
  });
}

function renderOperationalExpenseCategory(category, open = false) {
  return `
    <details class="expense-category" ${open ? "open" : ""}>
      <summary>
        <span>${escapeHtml(category.label)}</span>
        <strong>${formatCurrency(category.total, 2)}</strong>
        <small>${formatPercent(category.percentOfTotal, 1)}</small>
      </summary>
      ${category.note ? `<p class="panel-note category-note">${escapeHtml(category.note)}</p>` : ""}
      <div class="table-wrap">
        <table class="compact-table expense-entry-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Costo unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${category.rows.map((row) => `
              <tr>
                <td>
                  <input class="inline-input text-input wide-text-input" type="text" value="${escapeHtml(row.concept)}" data-operational-field="true" data-category-key="${category.key}" data-row-index="${row.rowIndex}" data-field="concept" />
                </td>
                <td>
                  <input class="inline-input small-input" type="text" inputmode="decimal" value="${formatInputValue(row.quantity, 1)}" data-decimals="1" data-operational-field="true" data-category-key="${category.key}" data-row-index="${row.rowIndex}" data-field="quantity" />
                </td>
                <td>
                  <input class="inline-input money-input" type="text" inputmode="decimal" value="${formatInputValue(row.unitCost, 2)}" data-decimals="2" data-operational-field="true" data-category-key="${category.key}" data-row-index="${row.rowIndex}" data-field="unit_cost" />
                </td>
                <td>${formatCurrency(row.amount, 2)}</td>
              </tr>
            `).join("")}
            <tr class="total-row">
              <td>Total ${escapeHtml(category.label)}</td>
              <td>—</td>
              <td>—</td>
              <td>${formatCurrency(category.total, 2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
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
