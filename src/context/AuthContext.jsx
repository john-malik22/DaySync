import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('luna_token') || null);
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

  // Restore authenticated user profile from token / refresh cookie on mount / refresh / PWA restart
  useEffect(() => {
    const initAuth = async () => {
      let storedToken = localStorage.getItem('luna_token');

      // Step 1: If no access token in localStorage, attempt silent refresh via HttpOnly cookie
      if (!storedToken) {
        try {
          const refreshRes = await api.refresh();
          if (refreshRes && refreshRes.token) {
            storedToken = refreshRes.token;
            localStorage.setItem('luna_token', storedToken);
            if (refreshRes.user) {
              setUser(refreshRes.user);
              localStorage.setItem('daysync_user_profile', JSON.stringify(refreshRes.user));
            }
          }
        } catch (e) {
          // No valid refresh token cookie exists
        }
      }

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
          // If access token expired or returned 401, attempt silent refresh once
          if (err && err.status === 401) {
            try {
              const refreshRes = await api.refresh();
              if (refreshRes && refreshRes.token) {
                setToken(refreshRes.token);
                localStorage.setItem('luna_token', refreshRes.token);
                if (refreshRes.user) {
                  setUser(refreshRes.user);
                  localStorage.setItem('daysync_user_profile', JSON.stringify(refreshRes.user));
                }
              } else {
                throw new Error('Refresh failed');
              }
            } catch (refreshErr) {
              console.warn('Session expired or invalid refresh token. Clearing session.');
              localStorage.removeItem('luna_token');
              localStorage.removeItem('daysync_user_profile');
              setToken(null);
              setUser(null);
            }
          } else {
            // HTTP 500, 502, 503, network failure, fetch failure, timeout, Render cold start
            // Preserve stored token and user session state without logging out
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
