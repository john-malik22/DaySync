import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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

  // Restore authenticated user profile ONLY after successful token verification via api.getMe()
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('luna_token');

      if (!storedToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res && res.user) {
          setUser(res.user);
          setToken(storedToken);
          localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
        } else {
          throw new Error('Invalid user response');
        }
      } catch (err) {
        console.error('Auth initialization response:', err);
        if (err && err.status === 401) {
          console.warn('Token explicitly rejected with HTTP 401 Unauthorized. Clearing session.');
          localStorage.removeItem('luna_token');
          localStorage.removeItem('daysync_user_profile');
          setToken(null);
          setUser(null);
        } else {
          // Temporary network / 500 server error
          // Do NOT set user from cached profile
          console.warn('Temporary network/server error during getMe. User remains unauthenticated.');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
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
