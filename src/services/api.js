/**
 * API Service Client for Luna Engine Backend
 * Global Error Classification & Timeout Control
 */

const DEFAULT_REMOTE_BACKEND = 'https://daysync-1.onrender.com';

export function getApiBase() {
  const envApiBase = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL || '') : '';
  if (envApiBase) {
    const cleanEnv = envApiBase.replace(/\/+$/, '');
    return cleanEnv.endsWith('/api') ? cleanEnv : `${cleanEnv}/api`;
  }

  // Detect if running inside Capacitor Android / native platform
  const isCapacitorNative = typeof window !== 'undefined' && (
    Boolean(window.Capacitor?.isNativePlatform()) ||
    window.Capacitor?.platform === 'android' ||
    window.Capacitor?.platform === 'ios' ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !import.meta.env.DEV)
  );

  if (isCapacitorNative) {
    const cleanRemote = DEFAULT_REMOTE_BACKEND.replace(/\/+$/, '');
    return cleanRemote.endsWith('/api') ? cleanRemote : `${cleanRemote}/api`;
  }

  // Web / PWA / Vercel relative path
  return '/api';
}

function getAuthHeader() {
  const token = localStorage.getItem('luna_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  constructor(message, status, type = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
  }
}

export function classifyApiError(err) {
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  // 1. Device is completely offline
  if (isOffline || err?.type === 'OFFLINE') {
    return {
      type: 'OFFLINE',
      title: "You're offline right now.",
      message: 'This action needs an internet connection.',
      canRetry: true
    };
  }

  // 2. Render Cold Start / Timeout
  if (err?.status === 408 || err?.type === 'TIMEOUT' || err?.name === 'AbortError') {
    return {
      type: 'TIMEOUT',
      title: 'DaySync is taking a little longer to connect.',
      message: 'The server may be starting up. Please try again.',
      canRetry: true
    };
  }

  // 3. Server Unreachable / Backend Outage (Internet ✅, Backend ❌)
  if (err?.type === 'SERVER_UNAVAILABLE' || err?.type === 'NETWORK' || (err?.status === 0 && !err?.type) || err?.message?.includes('Failed to fetch') || err?.status >= 500 || err?.type === 'SERVER') {
    return {
      type: 'SERVER_UNAVAILABLE',
      title: "DaySync couldn't reach the server right now.",
      message: 'Please check your connection or try again in a moment.',
      canRetry: true
    };
  }

  // 4. Session Expired
  if (err?.status === 401 || err?.type === 'UNAUTHORIZED') {
    return {
      type: 'UNAUTHORIZED',
      title: 'Your session has expired.',
      message: 'Please log in again to continue.',
      canRetry: false
    };
  }

  // 5. Not Found
  if (err?.status === 404 || err?.type === 'NOT_FOUND') {
    return {
      type: 'NOT_FOUND',
      title: "We couldn't find what you're looking for.",
      message: 'The requested item or page could not be located.',
      canRetry: false
    };
  }

  // 6. Validation Error
  return {
    type: 'VALIDATION',
    title: err?.message || 'Something went wrong.',
    message: err?.message || 'Please verify your information and try again.',
    canRetry: true
  };
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  };

  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}${url}`, config);
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const rawMsg = errorData.error || errorData.message;

      let errorType = 'UNKNOWN';
      if (res.status === 401) {
        errorType = 'UNAUTHORIZED';
        try {
          localStorage.removeItem('luna_token');
          localStorage.removeItem('daysync_user_profile');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('daysync_auth_expired'));
          }
        } catch (e) {}
      }
      else if (res.status === 404) errorType = 'NOT_FOUND';
      else if (res.status >= 500) errorType = 'SERVER_UNAVAILABLE';
      else if (rawMsg) errorType = 'VALIDATION';

      let userMsg = rawMsg;
      if (!userMsg) {
        if (res.status === 401) userMsg = 'Your session has expired. Please log in again.';
        else if (res.status === 404) userMsg = "The requested endpoint or resource was not found.";
        else if (res.status >= 500) userMsg = `Server error (${res.status}). Please try again in a moment.`;
        else userMsg = `Request failed (${res.status}). Please try again.`;
      }

      throw new ApiError(userMsg, res.status, errorType);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('DaySync is taking a little longer to connect.', 408, 'TIMEOUT');
    }

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline) {
      throw new ApiError("You're offline right now.", 0, 'OFFLINE');
    }

    throw new ApiError("DaySync couldn't reach the server right now.", 0, 'SERVER_UNAVAILABLE');
  }
}

export const api = {
  // Auth & Account Management
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  deleteAccount: () => request('/auth/delete-account', { method: 'DELETE' }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  sendEmailOTP: (data) => request('/auth/send-email-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmailOTP: (data) => request('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify(data) }),

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

  // Notifications System
  getNotifications: () => request('/notifications'),
  createNotification: (data) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearNotifications: () => request('/notifications/clear-all', { method: 'DELETE' }),

  // Intelligence
  getNotices: () => request('/notices'),
  getCurrentSuggestion: () => request('/suggestions/current'),
  getSummaries: () => request('/summaries'),

  // Privacy & Data
  exportData: () => request('/privacy/export', { method: 'POST' }),
  clearHistory: () => request('/privacy/clear-history', { method: 'POST' }),

  // Splits Shared Expenses
  getSplits: () => request('/splits'),
  createSplit: (data) => request('/splits', { method: 'POST', body: JSON.stringify(data) }),
  getSplitById: (id) => request(`/splits/${id}`),
  updateSplit: (id, data) => request(`/splits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSplit: (id) => request(`/splits/${id}`, { method: 'DELETE' }),

  previewSplit: (code) => request(`/splits/preview/${encodeURIComponent(code)}`),
  joinSplit: (code) => request('/splits/join', { method: 'POST', body: JSON.stringify({ code }) }),
  regenerateSplitCode: (splitId) => request(`/splits/${splitId}/regenerate-code`, { method: 'POST' }),

  inviteSplitMember: (id, targetUser) => request(`/splits/${id}/invitations`, { method: 'POST', body: JSON.stringify({ targetUser }) }),
  getMySplitInvitations: () => request('/split-invites/my-invites'),
  acceptSplitInvitation: (token) => request(`/split-invites/${token}/accept`, { method: 'POST' }),
  declineSplitInvitation: (token) => request(`/split-invites/${token}/decline`, { method: 'POST' }),

  addSplitExpense: (splitId, data) => request(`/splits/${splitId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  updateSplitExpense: (splitId, expenseId, data) => request(`/splits/${splitId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSplitExpense: (splitId, expenseId) => request(`/splits/${splitId}/expenses/${expenseId}`, { method: 'DELETE' }),

  createSplitSettlement: (splitId, data) => request(`/splits/${splitId}/settlements`, { method: 'POST', body: JSON.stringify(data) })
};
