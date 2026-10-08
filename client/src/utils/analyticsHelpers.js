/**
 * analyticsHelpers.js
 * Pure calculation helpers for the Analytics page.
 * All functions receive the raw transactions array and return derived data.
 * No side-effects, no API calls.
 *
 * Transaction types:
 *   income   — money earned (salary, freelance, interest)
 *   expense  — money spent (food, bills, shopping)
 *   received — money received from another person (friend paid me back)
 *   paid     — money paid/transferred to another person (I paid a friend)
 *
 * Money In  = income + received
 * Money Out = expense + paid
 */

// ── Summary ────────────────────────────────────────────────────────────────

/**
 * Returns { totalIncome, totalExpenses, totalReceived, totalPaid,
 *           totalMoneyIn, totalMoneyOut, totalSavings, transactionCount }.
 */
export function calcSummary(transactions) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = transactions
    .filter((t) => t.type === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMoneyIn = totalIncome + totalReceived;
  const totalMoneyOut = totalExpenses + totalPaid;

  return {
    totalIncome,
    totalExpenses,
    totalReceived,
    totalPaid,
    totalMoneyIn,
    totalMoneyOut,
    totalSavings: totalMoneyIn - totalMoneyOut,
    transactionCount: transactions.length,
  };
}

// ── Monthly Income vs Expense ───────────────────────────────────────────────

/**
 * Groups transactions by "YYYY-MM" and returns an array sorted chronologically.
 * income + received = money in; expense + paid = money out.
 * Each element: { month: "Oct 2025", income: number, expense: number }
 */
export function calcMonthlyData(transactions) {
  const map = {};

  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { key, income: 0, expense: 0 };

    if (t.type === 'income' || t.type === 'received') {
      map[key].income += t.amount;
    } else if (t.type === 'expense' || t.type === 'paid') {
      map[key].expense += t.amount;
    }
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
 * Groups money-out transactions (expense + paid) by category.
 * Returns [{ category: string, amount: number }] sorted descending by amount.
 */
export function calcExpenseByCategory(transactions) {
  const map = {};
  transactions
    .filter((t) => t.type === 'expense' || t.type === 'paid')
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
 * Returns spending insight metrics from money-out transactions (expense + paid).
 * { highestCategory, highestExpense, averageExpense }
 * Returns null if there are no money-out transactions.
 */
export function calcSpendingInsights(transactions) {
  const moneyOut = transactions.filter((t) => t.type === 'expense' || t.type === 'paid');
  if (moneyOut.length === 0) return null;

  const byCategory = calcExpenseByCategory(transactions);
  const highestCategory = byCategory[0] ?? null;
  const highestExpense = Math.max(...moneyOut.map((t) => t.amount));
  const averageExpense =
    moneyOut.reduce((s, t) => s + t.amount, 0) / moneyOut.length;

  return {
    highestCategory: highestCategory?.category ?? '—',
    highestCategoryAmount: highestCategory?.amount ?? 0,
    highestExpense,
    averageExpense,
  };
}
