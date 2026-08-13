import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('luna_token') || null);
  const [loading, setLoading] = useState(true);
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
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          localStorage.removeItem('luna_token');
          setToken(null);
          setUser(null);
        }
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
      localStorage.removeItem('luna_monthly_budget_target');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('luna_token');
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
