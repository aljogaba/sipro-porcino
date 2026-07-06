function getValue(parameters, section, key, fallback = 0) {
  return Number(parameters?.[section]?.[key]?.value ?? fallback);
}

const DEFAULT_WEEKS_PER_MONTH = 4.3;

function pct(value, denominator) {
  return denominator > 0 ? (value / denominator) * 100 : 0;
}

export function calculateEconomicSummary(parameters, feedResult, operationalExpensesResult = null) {
  const weeksPerMonth = feedResult?.assumptions?.weeksPerMonth ?? DEFAULT_WEEKS_PER_MONTH;
  const grossIncomeMonth = feedResult?.inventory?.flow?.grossMonthlyIncome ?? 0;
  const feedCostMonth = feedResult?.totals?.totalCostMonth ?? 0;

  const workers = getValue(parameters, "labor", "workers");
  const weeklySalary = getValue(parameters, "labor", "weekly_salary");
  const laborCostMonth = workers * weeklySalary * weeksPerMonth;

  const medicineTaxesMisc = operationalExpensesResult?.enabled
    ? (operationalExpensesResult.totalMonth ?? 0)
    : getValue(parameters, "other_monthly_costs", "medicine_taxes_misc");
  const extraExpenses = getValue(parameters, "other_monthly_costs", "extra_expenses");
  const nonSelfReplacementExpense = getValue(parameters, "other_monthly_costs", "non_self_replacement_expense");
  const breedingStockExpense = getValue(parameters, "other_monthly_costs", "breeding_stock_expense");

  const expenseRows = [
    { key: "feed", label: "Costo alimento", amount: feedCostMonth, editable: false },
    { key: "labor", label: "Mano de obra", amount: laborCostMonth, editable: true },
    { key: "medicine_taxes_misc", label: "Medicina, impuestos y varios", amount: medicineTaxesMisc, editable: true },
    { key: "extra_expenses", label: "Gastos extras", amount: extraExpenses, editable: true },
    { key: "non_self_replacement_expense", label: "Egreso pie de cría no autorreemplazo", amount: nonSelfReplacementExpense, editable: true },
    { key: "breeding_stock_expense", label: "Egresos pie de cría", amount: breedingStockExpense, editable: true }
  ];

  const totalCostsMonth = expenseRows.reduce((sum, row) => sum + row.amount, 0);
  const profitMonth = grossIncomeMonth - totalCostsMonth;
  const profitWeek = profitMonth / weeksPerMonth;

  return {
    grossIncomeMonth,
    totalCostsMonth,
    profitMonth,
    profitWeek,
    costPercentOfIncome: pct(totalCostsMonth, grossIncomeMonth),
    profitPercentOfIncome: pct(profitMonth, grossIncomeMonth),
    weeksPerMonth,
    expenseRows: expenseRows.map((row) => ({
      ...row,
      percentOfTotalCosts: pct(row.amount, totalCostsMonth),
      percentOfIncome: pct(row.amount, grossIncomeMonth)
    }))
  };
}
