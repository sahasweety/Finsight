/**
 * analyticsHelpers.js
 * Pure calculation helpers for the Analytics page.
 * All functions receive the raw transactions array and return derived data.
 * No side-effects, no API calls.
 */

// ── Summary ────────────────────────────────────────────────────────────────

/**
 * Returns { totalIncome, totalExpenses, totalSavings, transactionCount }.
 */
export function calcSummary(transactions) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    totalSavings: totalIncome - totalExpenses,
    transactionCount: transactions.length,
  };
}

// ── Monthly Income vs Expense ───────────────────────────────────────────────

/**
 * Groups transactions by "YYYY-MM" and returns an array sorted chronologically.
 * Each element: { month: "Oct 2025", income: number, expense: number }
 */
export function calcMonthlyData(transactions) {
  const map = {};

  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { key, income: 0, expense: 0 };
    if (t.type === 'income') map[key].income += t.amount;
    else if (t.type === 'expense') map[key].expense += t.amount;
  });

  return Object.values(map)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, income, expense }) => ({
      month: formatMonthLabel(key),
      income,
      expense,
    }));
}

/** "2025-04" → "Apr '25" */
function formatMonthLabel(yyyyMM) {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

// ── Expense by Category ─────────────────────────────────────────────────────

/**
 * Groups expense transactions by category.
 * Returns [{ category: string, amount: number }] sorted descending by amount.
 */
export function calcExpenseByCategory(transactions) {
  const map = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });

  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ── Spending Insights ───────────────────────────────────────────────────────

/**
 * Returns spending insight metrics from expense transactions.
 * { highestCategory, highestExpense, averageExpense }
 * Returns null if there are no expense transactions.
 */
export function calcSpendingInsights(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) return null;

  const byCategory = calcExpenseByCategory(transactions);
  const highestCategory = byCategory[0] ?? null;
  const highestExpense = Math.max(...expenses.map((t) => t.amount));
  const averageExpense =
    expenses.reduce((s, t) => s + t.amount, 0) / expenses.length;

  return {
    highestCategory: highestCategory?.category ?? '—',
    highestCategoryAmount: highestCategory?.amount ?? 0,
    highestExpense,
    averageExpense,
  };
}
