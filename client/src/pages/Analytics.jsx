import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
} from 'recharts';
import Navbar from '../components/Navbar';
import { fetchApi } from '../utils/api';
import { formatINR } from '../utils/formatCurrency';
import {
  calcSummary,
  calcMonthlyData,
  calcExpenseByCategory,
  calcSpendingInsights,
} from '../utils/analyticsHelpers';

// ── Colour palette for pie slices ──────────────────────────────────────────
const PIE_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

// ── Custom tooltip for bar chart ───────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'income' ? 'Income' : 'Expense'}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Custom tooltip for pie chart ───────────────────────────────────────────
const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{name}</p>
      <p style={{ color: payload[0].payload.fill }}>{formatINR(value)}</p>
    </div>
  );
};

// ── Custom legend for pie chart ────────────────────────────────────────────
const DonutLegend = ({ data }) => (
  <ul className="donut-legend">
    {data.map((d, i) => (
      <li key={d.category} className="donut-legend-item">
        <span
          className="donut-legend-dot"
          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
        />
        <span className="donut-legend-label">{d.category}</span>
        <span className="donut-legend-value">{formatINR(d.amount)}</span>
      </li>
    ))}
  </ul>
);

// ── Main Analytics Component ───────────────────────────────────────────────
const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchApi('/transactions');
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const summary = calcSummary(transactions);
  const monthlyData = calcMonthlyData(transactions);
  const categoryData = calcExpenseByCategory(transactions);
  const insights = calcSpendingInsights(transactions);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderLoadingState = () => (
    <div className="dashboard-loading">
      <div className="loading-spinner" />
      <p>Loading analytics…</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-message dashboard-error">
      <p>{error}</p>
      <button className="btn btn-retry" onClick={loadTransactions}>
        Retry
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <p className="empty-icon">📊</p>
      <p className="empty-title">No transactions yet.</p>
      <p className="empty-sub">Add some transactions to see your analytics.</p>
      <Link to="/transactions" className="btn btn-add-first">
        Add Transaction
      </Link>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">

        {/* Heading */}
        <div className="dashboard-heading">
          <h2>Analytics 📊</h2>
          <p className="dashboard-subtitle">
            A breakdown of your income, expenses, and spending habits.
          </p>
        </div>

        {loading ? renderLoadingState() : error ? renderErrorState() : (
          <>
            {transactions.length === 0 ? renderEmptyState() : (
              <>
                {/* ── 1. Summary Cards ───────────────────────────────────── */}
                <div className="summary-grid analytics-summary-grid">
                  <div className="summary-card summary-card--income">
                    <div className="summary-icon">📈</div>
                    <div className="summary-body">
                      <span className="summary-label">Total Income</span>
                      <span className="summary-value value--income">
                        {formatINR(summary.totalIncome)}
                      </span>
                    </div>
                  </div>

                  <div className="summary-card summary-card--expense">
                    <div className="summary-icon">📉</div>
                    <div className="summary-body">
                      <span className="summary-label">Total Expenses</span>
                      <span className="summary-value value--expense">
                        {formatINR(summary.totalExpenses)}
                      </span>
                    </div>
                  </div>

                  <div className="summary-card summary-card--balance">
                    <div className="summary-icon">💰</div>
                    <div className="summary-body">
                      <span className="summary-label">Total Savings</span>
                      <span
                        className={`summary-value ${
                          summary.totalSavings >= 0
                            ? 'value--positive'
                            : 'value--negative'
                        }`}
                      >
                        {formatINR(Math.abs(summary.totalSavings))}
                        {summary.totalSavings < 0 && (
                          <span className="balance-deficit"> deficit</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="summary-card summary-card--txn">
                    <div className="summary-icon">🔢</div>
                    <div className="summary-body">
                      <span className="summary-label">Transactions</span>
                      <span className="summary-value value--txn">
                        {summary.transactionCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── 2. Monthly Income vs Expense Chart ────────────────── */}
                <div className="card analytics-chart-card">
                  <h3 className="chart-title">Monthly Income vs Expenses</h3>
                  {monthlyData.length === 0 ? (
                    <p className="chart-empty">No monthly data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickFormatter={(v) =>
                            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                          }
                        />
                        <Tooltip content={<BarTooltip />} />
                        <Legend
                          formatter={(value) =>
                            value === 'income' ? 'Income' : 'Expense'
                          }
                        />
                        <Bar
                          dataKey="income"
                          name="income"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expense"
                          name="expense"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* ── 3 & 4. Category Donut + Spending Insights ─────────── */}
                <div className="analytics-bottom-grid">

                  {/* Expense by Category */}
                  <div className="card analytics-chart-card">
                    <h3 className="chart-title">Expenses by Category</h3>
                    {categoryData.length === 0 ? (
                      <div className="chart-empty-state">
                        <p className="empty-icon">🏷️</p>
                        <p className="empty-title">No expense data yet.</p>
                        <p className="empty-sub">
                          Expense categories will appear here once you add
                          expense transactions.
                        </p>
                      </div>
                    ) : (
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="amount"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={95}
                              paddingAngle={3}
                            >
                              {categoryData.map((_, i) => (
                                <Cell
                                  key={`cell-${i}`}
                                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <PieTooltip content={<DonutTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <DonutLegend data={categoryData} />
                      </div>
                    )}
                  </div>

                  {/* Spending Insights */}
                  <div className="card analytics-chart-card">
                    <h3 className="chart-title">Spending Insights</h3>
                    {!insights ? (
                      <div className="chart-empty-state">
                        <p className="empty-icon">💡</p>
                        <p className="empty-title">No expenses recorded.</p>
                        <p className="empty-sub">
                          Insights will appear once you add expense
                          transactions.
                        </p>
                      </div>
                    ) : (
                      <div className="insights-list">
                        <div className="insight-item">
                          <div className="insight-icon">🏆</div>
                          <div className="insight-body">
                            <span className="insight-label">
                              Highest Spending Category
                            </span>
                            <span className="insight-value">
                              {insights.highestCategory}
                            </span>
                            <span className="insight-sub">
                              {formatINR(insights.highestCategoryAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="insight-item">
                          <div className="insight-icon">💸</div>
                          <div className="insight-body">
                            <span className="insight-label">
                              Highest Single Expense
                            </span>
                            <span className="insight-value insight-value--red">
                              {formatINR(insights.highestExpense)}
                            </span>
                          </div>
                        </div>

                        <div className="insight-item">
                          <div className="insight-icon">📐</div>
                          <div className="insight-body">
                            <span className="insight-label">
                              Average Expense
                            </span>
                            <span className="insight-value insight-value--blue">
                              {formatINR(insights.averageExpense)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
