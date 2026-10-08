import { fetchApi } from '../utils/api';

// Get all budgets
export const getBudgets = async () => {
    return await fetchApi('/budgets', {
        method: 'GET',
    });
};

// Create a new budget
export const createBudget = async (budgetData) => {
    return await fetchApi('/budgets', {
        method: 'POST',
        body: JSON.stringify(budgetData),
    });
};

// Update a budget
export const updateBudget = async (id, budgetData) => {
    return await fetchApi(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(budgetData),
    });
};

// Delete a budget
export const deleteBudget = async (id) => {
    return await fetchApi(`/budgets/${id}`, {
        method: 'DELETE',
    });
};