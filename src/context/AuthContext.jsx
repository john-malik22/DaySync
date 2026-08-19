import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const DEFAULT_USER = { id: 'usr_default', name: 'User', email: 'user@daysync.app' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('daysync_user_profile');
      return cached ? JSON.parse(cached) : DEFAULT_USER;
    } catch (e) {
      return DEFAULT_USER;
    }
  });
  const [token, setToken] = useState('daysync_default_active_token');
  const [loading, setLoading] = useState(false);

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

  // Non-blocking user profile initialization
  useEffect(() => {
    api.getMe()
      .then(res => {
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
        }
      })
      .catch(() => {});
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

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('luna_token');
      localStorage.removeItem('daysync_user_profile');
      setToken(null);
      setUser(null);
    }
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
