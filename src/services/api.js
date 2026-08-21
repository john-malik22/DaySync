/**
 * API Service Client for Luna Engine Backend
 */

const configuredApiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const API_BASE =
  configuredApiBase === ''
    ? '/api'
    : configuredApiBase.endsWith('/api')
      ? configuredApiBase
      : `${configuredApiBase}/api`;

function getAuthHeader() {
  const token = localStorage.getItem('luna_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(url, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${res.status}`,
        res.status
      );
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth & Account Management
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  deleteAccount: () => request('/auth/delete-account', { method: 'DELETE' }),
  getMe: () => request('/auth/me'),

  // Chat
  sendMessage: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getChatHistory: () => request('/chat/history'),

  // Memories
  getMemories: () => request('/memories'),
  createMemory: (data) => request('/memories', { method: 'POST', body: JSON.stringify(data) }),
  updateMemory: (id, data) => request(`/memories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMemory: (id) => request(`/memories/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: () => request('/tasks'),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => request('/expenses'),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Intelligence
  getNotices: () => request('/notices'),
  getCurrentSuggestion: () => request('/suggestions/current'),
  getSummaries: () => request('/summaries'),

  // Privacy & Data
  exportData: () => request('/privacy/export', { method: 'POST' }),
  clearHistory: () => request('/privacy/clear-history', { method: 'POST' })
};
