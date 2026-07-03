import { calculateReproductiveFlow } from "./reproductive-flow.js";

function duration(parameters, key) {
  return Number(parameters.stage_duration_weeks[key].value);
}

export function calculateInventory(parameters) {
  const flow = calculateReproductiveFlow(parameters);
  const breedingSows = Number(parameters.productive_parameters.breeding_sows.value);

  const lactantes = flow.livebornPerWeek * flow.lactationWeeks;

  // Estructura equivalente al tablero: Fase 1 + Fase 2 + Fase 3 + Iniciación.
  const destete =
    (flow.weanedPerWeek * duration(parameters, "phase_1")) +
    (flow.weanedPerWeek * duration(parameters, "phase_2")) +
    (flow.weanedPerWeek * duration(parameters, "phase_3")) +
    (flow.pigsToInitiationPerWeek * duration(parameters, "initiation"));

  // Estructura equivalente al tablero: Crecimiento + Desarrollo + Engorda.
  const engorda =
    (flow.pigsToGrowthPerWeek * duration(parameters, "growth")) +
    (flow.pigsToDevelopmentPerWeek * duration(parameters, "development")) +
    (flow.pigsToFinishingPerWeek * duration(parameters, "finishing"));

  const totalInventory = lactantes + destete + engorda;
  const inventoryPerSow = totalInventory / breedingSows;
  const efficiencyFactor = flow.pigsSoldPerMonth / breedingSows;

  return {
    flow,
    groups: {
      lactantes,
      destete,
      engorda,
      totalInventory,
      inventoryPerSow,
      efficiencyFactor
    }
  };
}
