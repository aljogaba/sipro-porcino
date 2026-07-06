function getValue(parameters, section, key, fallback = 0) {
  return Number(parameters?.[section]?.[key]?.value ?? fallback);
}

function pct(value, denominator) {
  return denominator > 0 ? (value / denominator) * 100 : 0;
}

export function calculateBreedingStock(parameters, feedResult = null) {
  const config = parameters?.breeding_stock ?? {};
  const breedingSows = getValue(parameters, "productive_parameters", "breeding_sows", 0);
  const replacementRateAnnual = getValue(parameters, "breeding_stock", "female_replacement_rate_annual", 0);
  const replacementInventoryMonths = getValue(parameters, "breeding_stock", "replacement_inventory_months", 1);
  const mode = config?.replacement_mode?.value ?? "self";

  const femalesReplacementMonth = breedingSows * (replacementRateAnnual / 100) / 12;
  const femalesCullMonth = femalesReplacementMonth;
  const replacementInventory = femalesReplacementMonth * replacementInventoryMonths;

  const replacementWeight = getValue(parameters, "breeding_stock", "female_replacement_weight", 0);
  const selfCostPerKg = getValue(parameters, "breeding_stock", "self_replacement_cost_per_kg", 0);
  const externalFemalePrice = getValue(parameters, "breeding_stock", "external_female_price", 0);

  const selfFemaleUnitCost = replacementWeight * selfCostPerKg;
  const femaleUnitCost = mode === "external" ? externalFemalePrice : selfFemaleUnitCost;
  const femaleReplacementExpenseMonth = femalesReplacementMonth * femaleUnitCost;

  const cullWeight = getValue(parameters, "breeding_stock", "cull_sow_weight", 0);
  const cullPricePerKg = getValue(parameters, "breeding_stock", "cull_sow_price_per_kg", 0);
  const cullIncomeMonth = femalesCullMonth * cullWeight * cullPricePerKg;

  const boarInventory = getValue(parameters, "breeding_stock", "boar_inventory", breedingSows / 20);
  const boarReplacementRateAnnual = getValue(parameters, "breeding_stock", "boar_replacement_rate_annual", 0);
  const boarUnitPrice = getValue(parameters, "breeding_stock", "boar_unit_price", 0);
  const boarsReplacementMonth = boarInventory * (boarReplacementRateAnnual / 100) / 12;
  const boarReplacementExpenseMonth = boarsReplacementMonth * boarUnitPrice;

  // Solo en autorreemplazo se descuenta económicamente la venta a rastro de las hembras seleccionadas
  // del propio flujo. Los indicadores productivos se conservan sin modificación.
  const marketWeight = getValue(parameters, "productive_parameters", "market_weight", 0);
  const salePricePerKg = getValue(parameters, "productive_parameters", "sale_price_per_kg", 0);
  const selfReplacementMarketIncomeDeduction = mode === "self"
    ? femalesReplacementMonth * marketWeight * salePricePerKg
    : 0;

  const totalExpenseMonth = femaleReplacementExpenseMonth + boarReplacementExpenseMonth;
  const netImpactMonth = cullIncomeMonth - totalExpenseMonth - selfReplacementMarketIncomeDeduction;
  const pigsSoldPerMonth = feedResult?.inventory?.flow?.pigsSoldPerMonth ?? 0;
  const costPerPigSold = pigsSoldPerMonth > 0 ? totalExpenseMonth / pigsSoldPerMonth : 0;

  return {
    enabled: config.enabled !== false,
    mode,
    breedingSows,
    replacementRateAnnual,
    female: {
      replacementPerMonth: femalesReplacementMonth,
      cullPerMonth: femalesCullMonth,
      replacementInventory,
      replacementInventoryMonths,
      replacementWeight,
      selfCostPerKg,
      selfUnitCost: selfFemaleUnitCost,
      externalUnitCost: externalFemalePrice,
      unitCost: femaleUnitCost,
      replacementExpenseMonth: femaleReplacementExpenseMonth,
      cullWeight,
      cullPricePerKg,
      cullIncomeMonth,
      selfReplacementMarketIncomeDeduction
    },
    boar: {
      inventory: boarInventory,
      replacementRateAnnual: boarReplacementRateAnnual,
      replacementPerMonth: boarsReplacementMonth,
      unitPrice: boarUnitPrice,
      replacementExpenseMonth: boarReplacementExpenseMonth
    },
    totals: {
      totalExpenseMonth,
      cullIncomeMonth,
      selfReplacementMarketIncomeDeduction,
      netImpactMonth,
      costPerPigSold,
      femalePercentOfBreedingSowsPerMonth: pct(femalesReplacementMonth, breedingSows)
    }
  };
}
