import React, { useEffect, useState } from "react";

const categories = [
  "Food",
  "Entertainment",
  "Shopping",
  "Transport",
  "Bills",
  "Health",
  "Education",
  "Travel",
  "Other",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BudgetForm = ({ onSubmit, editingBudget, onCancel }) => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category);
      setAmount(editingBudget.amount);
      setMonth(editingBudget.month);
      setYear(editingBudget.year);
    } else {
      setCategory("");
      setAmount("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
    }

    setError("");
  }, [editingBudget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!category || !amount || !month || !year) {
      setError("Please fill in all fields.");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        category,
        amount: Number(amount),
        month: Number(month),
        year: Number(year),
      });

      // Reset form only on create (not edit — parent clears editingBudget)
      if (!editingBudget) {
        setCategory("");
        setAmount("");
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(editingBudget);

  return (
    <div className={`budget-form-card card${isEditing ? " budget-form-card--editing" : ""}`}>
      <div className="budget-form-header">
        <div>
          <h2 className="budget-form-title">
            {isEditing ? "✏️ Edit Budget" : "➕ Create Budget"}
          </h2>
          <p className="budget-form-subtitle">
            {isEditing
              ? `Editing ${editingBudget.category} — ${MONTH_NAMES[editingBudget.month - 1]} ${editingBudget.year}`
              : "Set a spending limit for a category and month."}
          </p>
        </div>
      </div>

      {error && (
        <div className="budget-form-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="budget-form-grid">
          <div className="form-group">
            <label htmlFor="budget-category">Category</label>
            <select
              id="budget-category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="budget-amount">Amount (₹)</label>
            <input
              id="budget-amount"
              type="number"
              className="form-control"
              min="1"
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget-month">Month</label>
            <select
              id="budget-month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="budget-year">Year</label>
            <input
              id="budget-year"
              type="number"
              className="form-control"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="budget-form-actions">
          <button
            type="submit"
            className="btn budget-form-submit"
            disabled={submitting}
          >
            {submitting
              ? isEditing
                ? "Updating…"
                : "Adding…"
              : isEditing
              ? "Update Budget"
              : "Add Budget"}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary budget-form-cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
