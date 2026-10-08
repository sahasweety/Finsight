import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AIInsights from '../components/ai/AIInsights';
import { fetchApi } from '../utils/api';
import { formatINR } from '../utils/formatCurrency';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

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
      // 401 is already handled in fetchApi (redirect to /login)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Financial summary ──────────────────────────────────────────────────────
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  // ── Recent 5 transactions (newest first) ──────────────────────────────────
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // ── Date formatter ─────────────────────────────────────────────────────────
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">

        {/* Page heading */}
        <div className="dashboard-heading">
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="dashboard-subtitle">Here's your financial overview</p>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <p>Loading your dashboard…</p>
          </div>
        ) : error ? (
          <div className="error-message dashboard-error">
            <p>{error}</p>
            <button className="btn btn-retry" onClick={loadTransactions}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="summary-grid">
              {/* Total Balance */}
              <div className="summary-card summary-card--balance">
                <div className="summary-icon">💰</div>
                <div className="summary-body">
                  <span className="summary-label">Total Balance</span>
                  <span
                    className={`summary-value ${
                      totalBalance >= 0 ? 'value--positive' : 'value--negative'
                    }`}
                  >
                    {formatINR(Math.abs(totalBalance))}
                    {totalBalance < 0 && (
                      <span className="balance-deficit"> deficit</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Total Income */}
              <div className="summary-card summary-card--income">
                <div className="summary-icon">📈</div>
                <div className="summary-body">
                  <span className="summary-label">Total Income</span>
                  <span className="summary-value value--income">
                    {formatINR(totalIncome)}
                  </span>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="summary-card summary-card--expense">
                <div className="summary-icon">📉</div>
                <div className="summary-body">
                  <span className="summary-label">Total Expenses</span>
                  <span className="summary-value value--expense">
                    {formatINR(totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── AI Insights Section ────────────────────────────────────── */}
            <div className="ai-insights-section">
              <AIInsights />
            </div>

            {/* ── Recent Transactions ────────────────────────────────────── */}
            <div className="card recent-section">
              <div className="recent-header">
                <h3>Recent Transactions</h3>
                <Link to="/transactions" className="view-all-link">
                  View All →
                </Link>
              </div>

              {transactions.length === 0 ? (
                /* ── Empty State ─────────────────────────────────────────── */
                <div className="empty-state">
                  <p className="empty-icon">🧾</p>
                  <p className="empty-title">No transactions yet.</p>
                  <p className="empty-sub">
                    Start by adding your first income or expense.
                  </p>
                  <Link to="/transactions" className="btn btn-add-first">
                    Add Transaction
                  </Link>
                </div>
              ) : (
                <div className="transaction-list">
                  {recentTransactions.map((t) => (
                    <div
                      key={t._id}
                      className={`transaction-item ${t.type}`}
                    >
                      <div className="transaction-info">
                        <div className="transaction-main">
                          <span className="transaction-category">
                            {t.category}
                          </span>
                          <span className="transaction-date">
                            {formatDate(t.date)}
                          </span>
                        </div>
                        {t.description && (
                          <div className="transaction-desc">
                            {t.description}
                          </div>
                        )}
                      </div>
                      <div className="transaction-amount-wrap">
                        <span
                          className={`transaction-amount ${t.type}`}
                        >
                          {t.type === 'income' ? '+' : '−'}
                          {formatINR(t.amount)}
                        </span>
                        <span className="transaction-type-badge">
                          {t.type}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* View all button if more than 5 */}
                  {transactions.length > 5 && (
                    <div className="view-all-wrap">
                      <Link to="/transactions" className="btn btn-view-all">
                        View All {transactions.length} Transactions
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
