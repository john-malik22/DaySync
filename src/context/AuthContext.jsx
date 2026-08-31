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

    // Dynamic Mobile & PWA Status Bar Color and Icon Appearance Sync
    const isDark = theme === 'dark';
    const statusBarColor = isDark ? '#0E0E10' : '#F6F3EC';

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', statusBarColor);

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
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

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('luna_token', res.token);
    if (res.user) {
      localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
    }
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.signup({ name, email, password });
    localStorage.setItem('luna_token', res.token);
    if (res.user) {
      localStorage.setItem('daysync_user_profile', JSON.stringify(res.user));
    }
    setToken(res.token);
    setUser(res.user);
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

  const updateUser = (updatedUserObj) => {
    if (!updatedUserObj) return;
    setUser(prev => {
      const merged = { ...prev, ...updatedUserObj };
      localStorage.setItem('daysync_user_profile', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    if (user?.id) clientCache.clearUserCache(user.id);
    localStorage.removeItem('luna_token');
    localStorage.removeItem('daysync_user_profile');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, theme, toggleTheme, login, signup, deleteAccount, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
