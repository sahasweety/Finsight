import React from "react";
import BudgetProgress from "./BudgetProgress";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORY_ICONS = {
  Food: "🍽️",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Transport: "🚗",
  Bills: "🧾",
  Health: "❤️",
  Education: "📚",
  Travel: "✈️",
  Other: "📦",
};

const CATEGORY_COLORS = {
  Food: "#f59e0b",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Transport: "#3b82f6",
  Bills: "#6b7280",
  Health: "#ef4444",
  Education: "#10b981",
  Travel: "#06b6d4",
  Other: "#2563eb",
};

const BudgetCard = ({ budget, spent = 0, onEdit, onDelete }) => {
  const icon = CATEGORY_ICONS[budget.category] || "📦";
  const color = CATEGORY_COLORS[budget.category] || "#2563eb";
  const monthName = MONTH_NAMES[(budget.month || 1) - 1];

  return (
    <div className="budget-card" style={{ "--budget-accent": color }}>
      {/* Card top row: icon + action buttons */}
      <div className="budget-card-top">
        <span className="budget-category-icon">{icon}</span>
        <div className="budget-card-actions">
          <button
            className="btn-small btn-edit"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.category} budget`}
          >
            ✏️ Edit
          </button>
          <button
            className="btn-small btn-danger"
            onClick={() => onDelete(budget._id)}
            aria-label={`Delete ${budget.category} budget`}
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Category name + period */}
      <div className="budget-card-body">
        <h3 className="budget-card-category">{budget.category}</h3>
        <p className="budget-card-period">
          {monthName} {budget.year}
        </p>
      </div>

      {/* Budget limit footer */}
      <div className="budget-card-footer">
        <span className="budget-card-label">Budget Limit</span>
        <span className="budget-card-amount">
          ₹{Number(budget.amount).toLocaleString("en-IN")}
        </span>
      </div>

      {/* Spend progress */}
      <BudgetProgress spent={spent} amount={budget.amount} />
    </div>
  );
};

export default BudgetCard;
