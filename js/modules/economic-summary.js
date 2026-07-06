function getValue(parameters, section, key, fallback = 0) {
  return Number(parameters?.[section]?.[key]?.value ?? fallback);
}

const DEFAULT_WEEKS_PER_MONTH = 4.3;

function pct(value, denominator) {
  return denominator > 0 ? (value / denominator) * 100 : 0;
}

export function calculateEconomicSummary(parameters, feedResult, operationalExpensesResult = null, breedingStockResult = null) {
  const weeksPerMonth = feedResult?.assumptions?.weeksPerMonth ?? DEFAULT_WEEKS_PER_MONTH;
  const marketIncomeOriginal = feedResult?.inventory?.flow?.grossMonthlyIncome ?? 0;
  const feedCostMonth = feedResult?.totals?.totalCostMonth ?? 0;

  const selfReplacementDeduction = breedingStockResult?.totals?.selfReplacementMarketIncomeDeduction ?? 0;
  const marketIncomeAdjusted = Math.max(marketIncomeOriginal - selfReplacementDeduction, 0);
  const cullIncomeMonth = breedingStockResult?.totals?.cullIncomeMonth ?? 0;
  const grossIncomeMonth = marketIncomeAdjusted + cullIncomeMonth;

  const workers = getValue(parameters, "labor", "workers");
  const weeklySalary = getValue(parameters, "labor", "weekly_salary");
  const laborCostMonth = workers * weeklySalary * weeksPerMonth;

  const medicineTaxesMisc = operationalExpensesResult?.enabled
    ? (operationalExpensesResult.totalMonth ?? 0)
    : getValue(parameters, "other_monthly_costs", "medicine_taxes_misc");
  const extraExpenses = getValue(parameters, "other_monthly_costs", "extra_expenses");
  const breedingStockExpense = breedingStockResult?.enabled
    ? (breedingStockResult.totals?.totalExpenseMonth ?? 0)
    : getValue(parameters, "other_monthly_costs", "breeding_stock_expense");

  const expenseRows = [
    { key: "feed", label: "Costo alimento", amount: feedCostMonth, editable: false },
    { key: "labor", label: "Mano de obra", amount: laborCostMonth, editable: true },
    { key: "medicine_taxes_misc", label: "Medicina, impuestos y varios", amount: medicineTaxesMisc, editable: true },
    { key: "extra_expenses", label: "Gastos extras", amount: extraExpenses, editable: true },
    { key: "breeding_stock_expense", label: "Egresos pie de cría", amount: breedingStockExpense, editable: true }
  ];

  const incomeRows = [
    { key: "market_pigs", label: "Ingreso cerdos a rastro", amount: marketIncomeAdjusted },
    { key: "cull_sows", label: "Ingreso hembras de desecho", amount: cullIncomeMonth }
  ];

  if (selfReplacementDeduction > 0) {
    incomeRows.splice(1, 0, {
      key: "self_replacement_deduction",
      label: "Ajuste autorreemplazo no vendido",
      amount: -selfReplacementDeduction
    });
  }

  const totalCostsMonth = expenseRows.reduce((sum, row) => sum + row.amount, 0);
  const profitMonth = grossIncomeMonth - totalCostsMonth;
  const profitWeek = profitMonth / weeksPerMonth;

  return {
    grossIncomeMonth,
    marketIncomeOriginal,
    marketIncomeAdjusted,
    cullIncomeMonth,
    selfReplacementDeduction,
    totalCostsMonth,
    profitMonth,
    profitWeek,
    costPercentOfIncome: pct(totalCostsMonth, grossIncomeMonth),
    profitPercentOfIncome: pct(profitMonth, grossIncomeMonth),
    weeksPerMonth,
    incomeRows: incomeRows.map((row) => ({
      ...row,
      percentOfIncome: pct(row.amount, grossIncomeMonth)
    })),
    expenseRows: expenseRows.map((row) => ({
      ...row,
      percentOfTotalCosts: pct(row.amount, totalCostsMonth),
      percentOfIncome: pct(row.amount, grossIncomeMonth)
    }))
  };
}
