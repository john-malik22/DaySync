import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { clientCache } from '../services/clientCache';

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

  // Restore authenticated session safely
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('luna_token');
      const storedProfileRaw = localStorage.getItem('daysync_user_profile');
      let cachedUser = null;

      try {
        if (storedProfileRaw) cachedUser = JSON.parse(storedProfileRaw);
      } catch (e) {}

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
        } else if (cachedUser) {
          setUser(cachedUser);
          setToken(storedToken);
        } else {
          throw new Error('Invalid user response');
        }
      } catch (err) {
        console.warn('Auth initialization response:', err);
        if (err && err.status === 401) {
          console.warn('Token explicitly rejected with HTTP 401 Unauthorized. Clearing session.');
          if (cachedUser?.id) clientCache.clearUserCache(cachedUser.id);
          localStorage.removeItem('luna_token');
          localStorage.removeItem('daysync_user_profile');
          setToken(null);
          setUser(null);
        } else if (storedToken && cachedUser) {
          // Network loss / backend outage / Render cold start
          // Preserve session and user profile so user remains logged in offline!
          console.warn('Network or server error during session verification. Restoring cached authenticated session.');
          setToken(storedToken);
          setUser(cachedUser);
        } else {
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

  const setSession = (newToken, newUser) => {
    localStorage.setItem('luna_token', newToken);
    if (newUser) {
      localStorage.setItem('daysync_user_profile', JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token && res.user) {
      setSession(res.token, res.user);
    }
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.signup({ name, email, password });
    return res;
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      if (user?.id) clientCache.clearUserCache(user.id);
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
    if (user?.id) clientCache.clearUserCache(user.id);
    localStorage.removeItem('luna_token');
    localStorage.removeItem('daysync_user_profile');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, theme, toggleTheme, login, signup, setSession, deleteAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
