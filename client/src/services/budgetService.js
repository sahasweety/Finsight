const API_URL = "http://localhost:5000/api/budgets";

// Get all budgets
export const getBudgets = async () => {
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch budgets");
    }

    return data;
};

// Create a new budget
export const createBudget = async (budgetData) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify(budgetData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create budget");
    }

    return data;
};

// Update a budget
export const updateBudget = async (id, budgetData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify(budgetData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to update budget");
    }

    return data;
};

// Delete a budget
export const deleteBudget = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete budget");
    }

    return data;
};