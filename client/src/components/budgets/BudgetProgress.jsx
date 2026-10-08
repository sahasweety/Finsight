import React from "react";

/**
 * BudgetProgress — visual spend bar + spend/remaining numbers.
 *
 * Props:
 *   spent      {number}  total spent in this budget's category + month/year
 *   amount     {number}  budget limit
 */
const BudgetProgress = ({ spent, amount }) => {
  const pct = amount > 0 ? (spent / amount) * 100 : 0;
  const isOver = pct > 100;

  // Visual bar is capped at 100%; label shows real %
  const barWidth = Math.min(pct, 100);

  const formatINR = (n) =>
    "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="budget-progress">
      {/* Spend row */}
      <div className="budget-progress-row">
        <span className="budget-progress-label">Spent</span>
        <span className={`budget-progress-amounts${isOver ? " over-budget" : ""}`}>
          {formatINR(spent)}{" "}
          <span className="budget-progress-of">/ {formatINR(amount)}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="budget-progress-track" aria-label={`${Math.round(pct)}% of budget spent`}>
        <div
          className={`budget-progress-fill${isOver ? " budget-progress-fill--over" : ""}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Status line */}
      <div className="budget-progress-status">
        {isOver ? (
          <span className="budget-status--over">
            ⚠️ Over budget · {formatINR(spent - amount)} over ({Math.round(pct)}%)
          </span>
        ) : (
          <span className="budget-status--ok">
            {formatINR(amount - spent)} remaining · {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default BudgetProgress;
