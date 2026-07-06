function rowAmount(row) {
  const quantity = Number(row?.quantity ?? 0);
  const unitCost = Number(row?.unit_cost ?? 0);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) return 0;
  return quantity * unitCost;
}

function pct(value, denominator) {
  return denominator > 0 ? (value / denominator) * 100 : 0;
}

export function calculateOperationalExpenses(parameters) {
  const config = parameters?.operational_expenses ?? {};
  const categories = config.categories ?? {};

  const categoryRows = Object.entries(categories).map(([categoryKey, category]) => {
    const rows = (category.rows ?? []).map((row, index) => {
      const amount = rowAmount(row);
      return {
        categoryKey,
        rowIndex: index,
        concept: row.concept ?? "",
        quantity: Number(row.quantity ?? 0),
        unitCost: Number(row.unit_cost ?? 0),
        amount
      };
    });

    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    return {
      key: categoryKey,
      label: category.label ?? categoryKey,
      note: category.note ?? "",
      rows,
      total
    };
  });

  const totalMonth = categoryRows.reduce((sum, category) => sum + category.total, 0);

  return {
    enabled: config.enabled !== false,
    totalMonth,
    categoryRows: categoryRows.map((category) => ({
      ...category,
      percentOfTotal: pct(category.total, totalMonth)
    }))
  };
}
