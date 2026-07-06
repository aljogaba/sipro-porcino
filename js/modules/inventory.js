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

  // Estructura equivalente al tablero: Crecimiento + Desarrollo + Finalización.
  const engorda =
    (flow.pigsToGrowthPerWeek * duration(parameters, "growth")) +
    (flow.pigsToDevelopmentPerWeek * duration(parameters, "development")) +
    (flow.pigsToFinishingPerWeek * duration(parameters, "finishing"));

  const totalInventory = lactantes + destete + engorda;
  const inventoryPerSow = totalInventory / breedingSows;
  const efficiencyFactor = flow.pigsSoldPerMonth / breedingSows;

  // Inventario de hembras reproductivas. Se separa del inventario de cerdos en producción
  // para evitar mezclar lechones/finalización con pie de cría. La lógica es equivalente al
  // ciclo reproductivo: lactando + abierta + gestante = vientres del sistema.
  const lactatingFemales = flow.farrowingsPerWeek * flow.lactationWeeks;
  const openFemales = flow.farrowingsPerWeek * (flow.assumptions.openDays / 7);
  const gestatingFemales = Math.max(breedingSows - lactatingFemales - openFemales, 0);

  // Inventario visible de reemplazos. Se muestra por separado y no se suma al inventario
  // productivo ni al consumo de alimento, porque en autorreemplazo esas hembras provienen del
  // propio flujo de producción y no deben generar doble costo alimenticio.
  const femaleReplacementRateAnnual = Number(parameters.breeding_stock?.female_replacement_rate_annual?.value ?? 0);
  const replacementInventoryMonths = Number(parameters.breeding_stock?.replacement_inventory_months?.value ?? 1);
  const replacementFemalesPerMonth = breedingSows * (femaleReplacementRateAnnual / 100) / 12;
  const replacementFemalesInventory = replacementFemalesPerMonth * replacementInventoryMonths;

  return {
    flow,
    groups: {
      lactantes,
      destete,
      engorda,
      totalInventory,
      inventoryPerSow,
      efficiencyFactor,
      breedingFemales: {
        lactating: lactatingFemales,
        open: openFemales,
        gestating: gestatingFemales,
        replacement: replacementFemalesInventory,
        replacementPerMonth: replacementFemalesPerMonth,
        total: breedingSows,
        totalWithReplacement: breedingSows + replacementFemalesInventory
      }
    }
  };
}
