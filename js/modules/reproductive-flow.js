import { percentToProportion, survivalFromMortality } from "../utils/validators.js";

function value(parameters, section, key) {
  return Number(parameters[section][key].value);
}

export function calculateReproductiveFlow(parameters) {
  const p = parameters.productive_parameters;
  const duration = parameters.stage_duration_weeks;

  const breedingSows = Number(p.breeding_sows.value);
  const parityRate = Number(p.parity_rate.value);
  const fertilityRate = Number(p.fertility_rate.value);
  const lactationDays = Number(p.lactation_days.value);
  const openDays = Number(p.open_days?.value ?? 7);
  const livebornPerSow = Number(p.liveborn_per_sow.value);

  const mortalityMaternity = Number(p.mortality_maternity.value);
  const mortalityWeaning = Number(p.mortality_weaning.value);
  const mortalityInitiation = Number(p.mortality_initiation.value);
  const mortalityGrowth = Number(p.mortality_growth.value);
  const mortalityDevelopment = Number(p.mortality_development.value);
  const mortalityFinishing = Number(p.mortality_finishing.value);

  const marketWeight = Number(p.market_weight.value);
  const salePricePerKg = Number(p.sale_price_per_kg.value);

  const weeksPerMonth = 4.3;
  const gestationDays = Number(parameters.technical_parameters?.gestation_days?.value ?? 115);
  const lactationWeeks = lactationDays / 7;

  const cycleWeeks = (gestationDays + lactationDays + openDays) / 7;
  const servedSowsPerWeek = breedingSows / cycleWeeks;
  const farrowingsPerWeek = servedSowsPerWeek * percentToProportion(parityRate);
  const livebornPerWeek = farrowingsPerWeek * livebornPerSow;

  const weanedPerWeek = livebornPerWeek * survivalFromMortality(mortalityMaternity);
  const pigsToInitiationPerWeek = weanedPerWeek * survivalFromMortality(mortalityWeaning);
  const pigsToGrowthPerWeek = pigsToInitiationPerWeek * survivalFromMortality(mortalityInitiation);
  const pigsToDevelopmentPerWeek = pigsToGrowthPerWeek * survivalFromMortality(mortalityGrowth);
  const pigsToFinishingPerWeek = pigsToDevelopmentPerWeek * survivalFromMortality(mortalityDevelopment);
  const pigsToMarketPerWeek = pigsToFinishingPerWeek * survivalFromMortality(mortalityFinishing);

  const pigsSoldPerMonth = pigsToMarketPerWeek * weeksPerMonth;
  const marketKgPerMonth = pigsSoldPerMonth * marketWeight;
  const grossMonthlyIncome = marketKgPerMonth * salePricePerKg;

  const totalMortalityPercent = mortalityMaternity + mortalityWeaning + mortalityInitiation + mortalityGrowth + mortalityDevelopment + mortalityFinishing;
  const globalSurvival = (100 - totalMortalityPercent) / 100;

  const totalProductionWeeks = lactationWeeks
    + Number(duration.phase_1.value)
    + Number(duration.phase_2.value)
    + Number(duration.phase_3.value)
    + Number(duration.initiation.value)
    + Number(duration.growth.value)
    + Number(duration.development.value)
    + Number(duration.finishing.value);

  const daysToMarket = totalProductionWeeks * 7;
  const farrowingsPerSowPerYear = (farrowingsPerWeek * 52) / breedingSows;
  const weanedPerLitter = pigsToInitiationPerWeek / farrowingsPerWeek;
  const weanedPerSowPerYear = weanedPerLitter * farrowingsPerSowPerYear;

  // Fórmula auditada en Excel: (LNV * supervivencia global por suma de mortalidades) * partos/hembra/año.
  const pigsSoldPerSowPerYear = (livebornPerSow * globalSurvival) * farrowingsPerSowPerYear;

  return {
    assumptions: {
      gestationDays,
      openDays,
      weeksPerMonth,
      fertilityRateStoredForReview: fertilityRate
    },
    cycleWeeks,
    lactationWeeks,
    totalProductionWeeks,
    daysToMarket,
    totalMortalityPercent,
    globalSurvival,
    servedSowsPerWeek,
    farrowingsPerWeek,
    livebornPerWeek,
    weanedPerWeek,
    pigsToInitiationPerWeek,
    pigsToGrowthPerWeek,
    pigsToDevelopmentPerWeek,
    pigsToFinishingPerWeek,
    pigsToMarketPerWeek,
    pigsSoldPerMonth,
    marketKgPerMonth,
    grossMonthlyIncome,
    farrowingsPerSowPerYear,
    weanedPerLitter,
    weanedPerSowPerYear,
    pigsSoldPerSowPerYear
  };
}
