/**
 * Formats a numeric amount as Indian Rupees (INR) with Indian number grouping.
 * Examples:
 *   formatINR(1500)      → "₹1,500"
 *   formatINR(25000)     → "₹25,000"
 *   formatINR(125000)    → "₹1,25,000"
 *   formatINR(1234567.5) → "₹12,34,567.50"
 *
 * @param {number} amount - The numeric amount to format.
 * @param {boolean} [showPaise=false] - Whether to always show two decimal places (paise).
 * @returns {string} Formatted INR string.
 */
export function formatINR(amount, showPaise = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';

  const num = Number(amount);
  const hasPaise = !Number.isInteger(num);

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: showPaise || hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `₹${formatted}`;
}

export default formatINR;
