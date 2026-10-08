import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BudgetCard from "../components/budgets/BudgetCard";
import BudgetForm from "../components/budgets/BudgetForm";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";
import { fetchApi } from "../utils/api";

/**
 * For a given budget, sum all expense transactions that match:
 *   - type === "expense"
 *   - category matches (case-insensitive trim)
 *   - date's month === budget.month  (1-based)
 *   - date's year  === budget.year
 */
const computeSpent = (transactions, budget) => {
  const budgetCat = (budget.category || "").trim().toLowerCase();

  return transactions.reduce((sum, t) => {
    if (t.type !== "expense") return sum;

    const txCat = (t.category || "").trim().toLowerCase();
    if (txCat !== budgetCat) return sum;

    const d = new Date(t.date);
    const txMonth = d.getUTCMonth() + 1; // 1-based
    const txYear = d.getUTCFullYear();

    if (txMonth !== budget.month || txYear !== budget.year) return sum;

    return sum + Number(t.amount);
  }, 0);
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  // Load budgets and transactions together on mount
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [budgetData, txData] = await Promise.all([
        getBudgets(),
        fetchApi("/transactions", { cache: "no-store" }),
      ]);

      setBudgets(budgetData.budgets || []);
      setTransactions(txData.transactions || []);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [location.key]);

  const handleSubmit = async (budgetData) => {
    try {
      setError("");

      if (editingBudget) {
        await updateBudget(editingBudget._id, budgetData);
        setEditingBudget(null);
      } else {
        await createBudget(budgetData);
      }

      // Reload only budgets after a write; transactions don't change
      const data = await getBudgets();
      setBudgets(data.budgets || []);
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );
    if (!confirmed) return;

    try {
      setError("");
      await deleteBudget(id);
      const data = await getBudgets();
      setBudgets(data.budgets || []);
    } catch (err) {
      setError(err.message || "Failed to delete budget.");
    }
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="budgets-page">
          {/* Page Header */}
          <div className="budgets-page-header">
            <h1>Budgets</h1>
            <p>Plan and manage your monthly spending limits.</p>
          </div>

          {/* Create / Edit Form */}
          <BudgetForm
        onSubmit={handleSubmit}
        editingBudget={editingBudget}
        onCancel={handleCancelEdit}
      />

      {/* Page-level error */}
      {error && <div className="budgets-error">⚠️ {error}</div>}

      {/* Budget List */}
      <section className="budgets-list-section">
        <div className="budgets-list-header">
          <h2>Your Budgets</h2>
          <span>
            {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="budgets-loading">
            <div className="loading-spinner" />
            Loading budgets…
          </div>
        ) : budgets.length === 0 ? (
          <div className="budgets-empty">
            <div className="budgets-empty-icon">💰</div>
            <h3>No budgets yet</h3>
            <p>Create your first budget using the form above.</p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget._id}
                budget={budget}
                spent={computeSpent(transactions, budget)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          )}
        </section>
      </div>
    </div>
    </div>
  );
};

export default Budgets;
