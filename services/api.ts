// API Service for MySQL Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types for API responses
interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Helper function to handle API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
    }

    return response.json();
}

// Auth API
export const authApi = {
    login: (phoneNumber: string, pin: string) =>
        apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber, pin }),
        }),

    register: (name: string, phoneNumber: string, pin: string, photoUrl?: string) =>
        apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, phoneNumber, pin, photoUrl }),
        }),

    getSavedUsers: () => apiCall('/auth/saved-users'),
};

// Transactions API
export const transactionsApi = {
    getAll: (userId: string) => apiCall(`/transactions/${userId}`),

    create: (data: {
        id: string;
        userId: string;
        accountId: string;
        amount: number;
        type: string;
        category: string;
        note?: string;
        date: string;
    }) =>
        apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiCall(`/transactions/${id}`, {
            method: 'DELETE',
        }),
};

// Accounts API
export const accountsApi = {
    getAll: (userId: string) => apiCall(`/accounts/${userId}`),

    create: (data: { id: string; userId: string; name: string; balance: number; icon: string }) =>
        apiCall('/accounts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiCall(`/accounts/${id}`, {
            method: 'DELETE',
        }),
};

// Categories API
export const categoriesApi = {
    getAll: (userId: string) => apiCall(`/categories/${userId}`),

    create: (data: { id: string; userId: string; name: string; icon: string; type: string }) =>
        apiCall('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiCall(`/categories/${id}`, {
            method: 'DELETE',
        }),
};

// Budgets API
export const budgetsApi = {
    getAll: (userId: string) => apiCall(`/budgets/${userId}`),

    create: (data: { id: string; userId: string; category: string; limitAmount: number; icon: string }) =>
        apiCall('/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiCall(`/budgets/${id}`, {
            method: 'DELETE',
        }),
};

// Debts API
export const debtsApi = {
    getAll: (userId: string) => apiCall(`/debts/${userId}`),

    create: (data: { id: string; userId: string; name: string; amount: number; paid?: number; dueDate: string }) =>
        apiCall('/debts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/debts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    pay: (id: string, amount: number, accountId: string) =>
        apiCall(`/debts/${id}/pay`, {
            method: 'POST',
            body: JSON.stringify({ amount, accountId }),
        }),

    delete: (id: string) =>
        apiCall(`/debts/${id}`, {
            method: 'DELETE',
        }),
};

// Credits API
export const creditsApi = {
    getAll: (userId: string) => apiCall(`/credits/${userId}`),

    create: (data: { id: string; userId: string; name: string; amount: number; dueDate: number; isPaidThisMonth?: boolean }) =>
        apiCall('/credits', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/credits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    pay: (id: string, accountId: string) =>
        apiCall(`/credits/${id}/pay`, {
            method: 'POST',
            body: JSON.stringify({ accountId }),
        }),

    delete: (id: string) =>
        apiCall(`/credits/${id}`, {
            method: 'DELETE',
        }),
};

// Bills API
export const billsApi = {
    getAll: (userId: string) => apiCall(`/bills/${userId}`),

    create: (data: { id: string; userId: string; name: string; amount: number; dueDate: number; category?: string }) =>
        apiCall('/bills', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        apiCall(`/bills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    pay: (id: string, accountId: string) =>
        apiCall(`/bills/${id}/pay`, {
            method: 'POST',
            body: JSON.stringify({ accountId }),
        }),

    delete: (id: string) =>
        apiCall(`/bills/${id}`, {
            method: 'DELETE',
        }),
};

// Notifications API
export const notificationsApi = {
    getAll: (userId: string) => apiCall(`/notifications/${userId}`),

    create: (data: { id: string; userId: string; title: string; message: string; type: string; date: string }) =>
        apiCall('/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    markAsRead: (id: string) =>
        apiCall(`/notifications/${id}/read`, {
            method: 'PUT',
        }),

    markAllAsRead: (userId: string) =>
        apiCall(`/notifications/${userId}/read-all`, {
            method: 'PUT',
        }),

    delete: (id: string) =>
        apiCall(`/notifications/${id}`, {
            method: 'DELETE',
        }),

    clearAllRead: (userId: string) =>
        apiCall(`/notifications/${userId}/clear-read`, {
            method: 'DELETE',
        }),
};

// Export all APIs
export const api = {
    auth: authApi,
    transactions: transactionsApi,
    accounts: accountsApi,
    categories: categoriesApi,
    budgets: budgetsApi,
    debts: debtsApi,
    credits: creditsApi,
    bills: billsApi,
    notifications: notificationsApi,
};

export default api;
