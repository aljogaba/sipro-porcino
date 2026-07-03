const DEFAULT_BATCH_KG = 1000;

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getFeedKgByDiet(feedResult) {
  return (feedResult?.rows ?? []).reduce((acc, row) => {
    acc[row.key] = row.kgMonth ?? 0;
    return acc;
  }, {});
}

function calculateDietCost(dietKey, diet, formulation) {
  const batchKg = num(formulation.batch_size_kg, DEFAULT_BATCH_KG);
  const ingredientCosts = Object.entries(diet.ingredients_kg ?? {}).map(([ingredientKey, kg]) => {
    const ingredient = formulation.ingredients?.[ingredientKey] ?? {};
    const qtyKg = num(kg);
    const price = num(ingredient.price);
    return {
      key: ingredientKey,
      label: ingredient.label ?? ingredientKey,
      kg: qtyKg,
      price,
      cost: qtyKg * price
    };
  });

  const nucleus = formulation.nuclei?.[diet.nucleus_key] ?? {};
  const nucleusKg = num(diet.nucleus_kg);
  const nucleusPrice = num(nucleus.price);
  const nucleusCost = nucleusKg * nucleusPrice;
  const ingredientKg = ingredientCosts.reduce((sum, item) => sum + item.kg, 0);
  const ingredientCost = ingredientCosts.reduce((sum, item) => sum + item.cost, 0);
  const nonWeightCostPerTon = num(diet.non_weight_cost_per_ton);
  const totalKg = ingredientKg + nucleusKg;
  const costPerTon = ingredientCost + nucleusCost + nonWeightCostPerTon;
  const costPerKg = batchKg > 0 ? costPerTon / batchKg : 0;
  const balanceDelta = totalKg - batchKg;

  return {
    key: dietKey,
    label: diet.label ?? dietKey,
    batchKg,
    ingredientCosts,
    nucleus: {
      key: diet.nucleus_key,
      label: nucleus.label ?? diet.nucleus_key,
      kg: nucleusKg,
      price: nucleusPrice,
      cost: nucleusCost
    },
    nonWeightCostPerTon,
    totalKg,
    costPerTon,
    costPerKg,
    balanceDelta,
    isBalanced: Math.abs(balanceDelta) <= 0.01
  };
}

function calculateIngredientBalance(formulation, dietCosts, feedResult) {
  const batchKg = num(formulation.batch_size_kg, DEFAULT_BATCH_KG);
  const kgByDiet = getFeedKgByDiet(feedResult);
  const rows = {};

  const ensureRow = (key, label, type, price) => {
    if (!rows[key]) {
      rows[key] = { key, label, type, price, kgMonth: 0, costMonth: 0 };
    }
    return rows[key];
  };

  dietCosts.forEach((dietCost) => {
    const dietKgMonth = kgByDiet[dietCost.key] ?? 0;
    if (dietKgMonth <= 0 || batchKg <= 0) return;

    dietCost.ingredientCosts.forEach((ingredient) => {
      if (ingredient.kg <= 0) return;
      const kgMonth = (ingredient.kg / batchKg) * dietKgMonth;
      const row = ensureRow(ingredient.key, ingredient.label, "Ingrediente", ingredient.price);
      row.kgMonth += kgMonth;
      row.costMonth += kgMonth * ingredient.price;
    });

    if (dietCost.nucleus.kg > 0) {
      const kgMonth = (dietCost.nucleus.kg / batchKg) * dietKgMonth;
      const row = ensureRow(dietCost.nucleus.key, dietCost.nucleus.label, "Núcleo / dieta completa", dietCost.nucleus.price);
      row.kgMonth += kgMonth;
      row.costMonth += kgMonth * dietCost.nucleus.price;
    }
  });

  const balanceRows = Object.values(rows).filter((row) => row.kgMonth > 0.0001);
  const totalKgMonth = balanceRows.reduce((sum, row) => sum + row.kgMonth, 0);
  const totalCostMonth = balanceRows.reduce((sum, row) => sum + row.costMonth, 0);

  return {
    rows: balanceRows,
    totals: {
      totalKgMonth,
      totalCostMonth
    }
  };
}

export function calculateFeedFormulation(parameters, feedResult = null) {
  const formulation = parameters.feed_formulation ?? {};
  const diets = formulation.diets ?? {};
  const dietCosts = Object.entries(diets).map(([dietKey, diet]) => calculateDietCost(dietKey, diet, formulation));
  const dietCostMap = dietCosts.reduce((acc, diet) => {
    acc[diet.key] = diet.costPerKg;
    return acc;
  }, {});

  return {
    batchKg: num(formulation.batch_size_kg, DEFAULT_BATCH_KG),
    note: formulation.note ?? "",
    diets: dietCosts,
    dietCostMap,
    balance: calculateIngredientBalance(formulation, dietCosts, feedResult)
  };
}
