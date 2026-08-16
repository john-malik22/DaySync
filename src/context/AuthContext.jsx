import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('luna_token') || null);
  const [loading, setLoading] = useState(true);

  // LIGHT MODE IS THE DEFAULT THEME
  const [theme, setTheme] = useState(() => localStorage.getItem('daysync_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('daysync_theme', theme);
  }, [theme]);

  // Restore authenticated user profile from token on mount / refresh
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('luna_token');
      if (storedToken) {
        setToken(storedToken);

        // Pre-populate cached user profile if present
        const cachedUserStr = localStorage.getItem('daysync_user_profile');
        if (cachedUserStr) {
          try {
            setUser(JSON.parse(cachedUserStr));
          } catch (e) {}
        }

        try {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Auth initialization response:', err);
          // Only clear token if server explicitly returned 401 Unauthorized or 403 Forbidden
          if (err && (err.status === 401 || err.status === 403)) {
            console.warn('Token explicitly rejected (401/403). Clearing session.');
            localStorage.removeItem('luna_token');
            localStorage.removeItem('daysync_user_profile');
            setToken(null);
            setUser(null);
          } else {
            // Temporary network failure, server restart, Render sleeping, 500 error, timeout
            // Preserve stored token and user session state
            console.warn('Temporary network/server error during getMe. Preserving token and session.');
          }
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('luna_token', res.token);
      if (res.user) {
        localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.signup({ name, email, password });
      localStorage.setItem('luna_token', res.token);
      if (res.user) {
        localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
      }
      setToken(res.token);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.deleteAccount();
      localStorage.removeItem('luna_token');
      localStorage.removeItem('daysync_user_profile');
      localStorage.removeItem('luna_monthly_budget_target');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('luna_token');
    localStorage.removeItem('daysync_user_profile');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, theme, toggleTheme, login, signup, deleteAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
