import { calculateInventory } from "./inventory.js";

function getValue(parameters, section, key, fallback = 0) {
  return Number(parameters?.[section]?.[key]?.value ?? fallback);
}

const WEEKS_PER_MONTH = 4.3;

function getActiveFeedCostSection(parameters) {
  const mode = parameters?.feed_cost_mode?.active ?? "purchased";
  return mode === "formulated" ? "feed_costs_formulated_per_kg" : "feed_costs_purchased_per_kg";
}

function getActiveFeedCostModeLabel(parameters) {
  const mode = parameters?.feed_cost_mode?.active ?? "purchased";
  return parameters?.feed_cost_mode?.options?.[mode]?.label ?? mode;
}

export function calculateFeed(parameters) {
  const inventory = calculateInventory(parameters);
  const { flow } = inventory;

  const costSection = getActiveFeedCostSection(parameters);
  const breedingSows = getValue(parameters, "productive_parameters", "breeding_sows");

  // Supuesto original del Excel: relación macho:hembra de 1:20 para alimento de pie de cría.
  const boars = breedingSows / 20;
  const lactatingSows = flow.farrowingsPerWeek * flow.lactationWeeks;
  const gestatingSows = Math.max(breedingSows - lactatingSows, 0);

  const rows = [
    {
      key: "gestation",
      label: "Gestación",
      animals: gestatingSows + boars,
      kgDay: getValue(parameters, "feed_consumption_kg_day", "gestation"),
      costKg: getValue(parameters, costSection, "gestation"),
      weeks: 1,
      group: "pie_cria"
    },
    {
      key: "lactation_sow",
      label: "Lactancia",
      animals: lactatingSows,
      kgDay: getValue(parameters, "feed_consumption_kg_day", "lactation_sow"),
      costKg: getValue(parameters, costSection, "lactation_sow"),
      weeks: 1,
      group: "pie_cria"
    },
    {
      key: "phase_0",
      label: "Fase 0",
      animals: flow.livebornPerWeek * flow.lactationWeeks,
      kgDay: getValue(parameters, "feed_consumption_kg_day", "phase_0"),
      costKg: getValue(parameters, costSection, "phase_0"),
      weeks: 1,
      group: "destete"
    },
    {
      key: "phase_1",
      label: "Fase 1",
      animals: flow.weanedPerWeek * getValue(parameters, "stage_duration_weeks", "phase_1", 1),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "phase_1"),
      costKg: getValue(parameters, costSection, "phase_1"),
      weeks: 1,
      group: "destete"
    },
    {
      key: "phase_2",
      label: "Fase 2",
      animals: flow.weanedPerWeek * getValue(parameters, "stage_duration_weeks", "phase_2", 1),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "phase_2"),
      costKg: getValue(parameters, costSection, "phase_2"),
      weeks: 1,
      group: "destete"
    },
    {
      key: "phase_3",
      label: "Fase 3",
      animals: flow.weanedPerWeek * getValue(parameters, "stage_duration_weeks", "phase_3", 1),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "phase_3"),
      costKg: getValue(parameters, costSection, "phase_3"),
      weeks: 1,
      group: "destete"
    },
    {
      key: "starter",
      label: "Iniciación",
      animals: flow.pigsToInitiationPerWeek * getValue(parameters, "stage_duration_weeks", "initiation", 4),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "starter"),
      costKg: getValue(parameters, costSection, "starter"),
      weeks: 1,
      group: "iniciadores"
    },
    {
      key: "growth",
      label: "Crecimiento",
      animals: flow.pigsToGrowthPerWeek * getValue(parameters, "stage_duration_weeks", "growth", 4),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "growth"),
      costKg: getValue(parameters, costSection, "growth"),
      weeks: 1,
      group: "crecimiento_finalizacion"
    },
    {
      key: "development",
      label: "Desarrollo",
      animals: flow.pigsToDevelopmentPerWeek * getValue(parameters, "stage_duration_weeks", "development", 4),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "development"),
      costKg: getValue(parameters, costSection, "development"),
      weeks: 1,
      group: "crecimiento_finalizacion"
    },
    {
      key: "finishing",
      label: "Finalización",
      animals: flow.pigsToFinishingPerWeek * getValue(parameters, "stage_duration_weeks", "finishing", 5),
      kgDay: getValue(parameters, "feed_consumption_kg_day", "finishing"),
      costKg: getValue(parameters, costSection, "finishing"),
      weeks: 1,
      group: "crecimiento_finalizacion"
    }
  ].map((row) => {
    const kgWeek = row.animals * row.kgDay * 7;
    const costWeek = kgWeek * row.costKg;
    return {
      ...row,
      kgWeek,
      kgMonth: kgWeek * WEEKS_PER_MONTH,
      costWeek,
      costMonth: costWeek * WEEKS_PER_MONTH
    };
  });

  const totalKgWeek = rows.reduce((sum, row) => sum + row.kgWeek, 0);
  const totalCostWeek = rows.reduce((sum, row) => sum + row.costWeek, 0);
  const totalKgMonth = totalKgWeek * WEEKS_PER_MONTH;
  const totalCostMonth = totalCostWeek * WEEKS_PER_MONTH;
  const feedCostPerKg = totalKgMonth > 0 ? totalCostMonth / totalKgMonth : 0;
  const feedConversionFarm = flow.marketKgPerMonth > 0 ? totalKgMonth / flow.marketKgPerMonth : 0;

  const costGroups = rows.reduce((acc, row) => {
    acc[row.group] = (acc[row.group] ?? 0) + row.costWeek;
    return acc;
  }, {});

  return {
    inventory,
    rows,
    assumptions: {
      weeksPerMonth: WEEKS_PER_MONTH,
      boars,
      lactatingSows,
      gestatingSows,
      feedCostMode: parameters?.feed_cost_mode?.active ?? "purchased",
      feedCostModeLabel: getActiveFeedCostModeLabel(parameters)
    },
    totals: {
      totalKgWeek,
      totalKgMonth,
      totalCostWeek,
      totalCostMonth,
      feedCostPerKg,
      feedConversionFarm,
      costGroups
    }
  };
}
