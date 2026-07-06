import { calculateFeed } from "./feed-consumption.js";
import { calculateEconomicSummary } from "./economic-summary.js";
import { calculateOperationalExpenses } from "./operational-expenses.js";

function cloneParameters(parameters) {
  return structuredClone(parameters);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function getValue(parameters, section, key, fallback = 0) {
  return Number(parameters?.[section]?.[key]?.value ?? fallback);
}

function setValue(parameters, section, key, value) {
  if (parameters?.[section]?.[key]) {
    parameters[section][key].value = value;
  }
}

function addValue(parameters, section, key, delta, min = -Infinity, max = Infinity) {
  const current = getValue(parameters, section, key);
  setValue(parameters, section, key, clamp(current + delta, min, max));
}

function multiplyValue(parameters, section, key, multiplier) {
  const current = getValue(parameters, section, key);
  setValue(parameters, section, key, current * multiplier);
}

function multiplyActiveFeedCosts(parameters, multiplier) {
  const activeMode = parameters?.feed_cost_mode?.active ?? "purchased";
  const section = activeMode === "formulated" ? "feed_costs_formulated_per_kg" : "feed_costs_purchased_per_kg";

  Object.keys(parameters?.[section] ?? {}).forEach((key) => {
    multiplyValue(parameters, section, key, multiplier);
  });
}

function applyScenario(parameters, scenarioId) {
  const p = cloneParameters(parameters);

  switch (scenarioId) {
    case "optimized":
      addValue(p, "productive_parameters", "liveborn_per_sow", 0.5, 0, 30);
      addValue(p, "productive_parameters", "mortality_maternity", -2, 0, 100);
      addValue(p, "productive_parameters", "mortality_weaning", -1, 0, 100);
      addValue(p, "productive_parameters", "mortality_finishing", -1, 0, 100);
      multiplyActiveFeedCosts(p, 0.97);
      break;

    case "sanitary_pressure":
      addValue(p, "productive_parameters", "mortality_maternity", 3, 0, 100);
      addValue(p, "productive_parameters", "mortality_weaning", 2, 0, 100);
      addValue(p, "productive_parameters", "mortality_initiation", 1, 0, 100);
      addValue(p, "productive_parameters", "mortality_finishing", 2, 0, 100);
      break;

    case "feed_shock":
      multiplyActiveFeedCosts(p, 1.10);
      break;

    case "market_pressure":
      multiplyValue(p, "productive_parameters", "sale_price_per_kg", 0.95);
      multiplyActiveFeedCosts(p, 1.05);
      break;

    default:
      break;
  }

  return p;
}

function calculateScenario(parameters, scenario) {
  const scenarioParameters = applyScenario(parameters, scenario.id);
  const feed = calculateFeed(scenarioParameters);
  const operationalExpenses = calculateOperationalExpenses(scenarioParameters);
  const economic = calculateEconomicSummary(scenarioParameters, feed, operationalExpenses);
  const flow = feed.inventory.flow;

  return {
    ...scenario,
    metrics: {
      pigsSoldPerMonth: flow.pigsSoldPerMonth,
      grossIncomeMonth: economic.grossIncomeMonth,
      feedCostMonth: feed.totals.totalCostMonth,
      totalCostsMonth: economic.totalCostsMonth,
      profitMonth: economic.profitMonth,
      profitWeek: economic.profitWeek,
      profitPercentOfIncome: economic.profitPercentOfIncome,
      feedConversionFarm: feed.totals.feedConversionFarm
    }
  };
}

function withDeltas(scenarios) {
  const base = scenarios[0]?.metrics ?? {};

  return scenarios.map((scenario) => ({
    ...scenario,
    delta: {
      pigsSoldPerMonth: scenario.metrics.pigsSoldPerMonth - (base.pigsSoldPerMonth ?? 0),
      grossIncomeMonth: scenario.metrics.grossIncomeMonth - (base.grossIncomeMonth ?? 0),
      feedCostMonth: scenario.metrics.feedCostMonth - (base.feedCostMonth ?? 0),
      totalCostsMonth: scenario.metrics.totalCostsMonth - (base.totalCostsMonth ?? 0),
      profitMonth: scenario.metrics.profitMonth - (base.profitMonth ?? 0),
      profitWeek: scenario.metrics.profitWeek - (base.profitWeek ?? 0)
    }
  }));
}

export function analyzeScenarios(parameters) {
  const scenarios = [
    {
      id: "base",
      name: "Escenario actual",
      shortName: "Actual",
      description: "Resultados con los parámetros capturados en el tablero."
    },
    {
      id: "optimized",
      name: "Mejora técnica",
      shortName: "Mejora",
      description: "+0.5 LNV/hembra, menor mortalidad en maternidad, destete y finalización, y -3% en costo de alimento."
    },
    {
      id: "sanitary_pressure",
      name: "Presión sanitaria",
      shortName: "Sanitario",
      description: "Aumento moderado de mortalidad en maternidad, destete, iniciación y finalización."
    },
    {
      id: "feed_shock",
      name: "Alimento +10%",
      shortName: "Alimento",
      description: "Incremento de 10% en el costo de todas las dietas activas."
    },
    {
      id: "market_pressure",
      name: "Mercado adverso",
      shortName: "Mercado",
      description: "Precio de venta -5% y costo de alimento +5%."
    }
  ];

  return withDeltas(scenarios.map((scenario) => calculateScenario(parameters, scenario)));
}
