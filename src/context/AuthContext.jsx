import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { clientCache } from '../services/clientCache';
import { authStorage } from '../services/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const lastVerifyTimestamp = useRef(0);

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

  // Fast Session Restore & Silent Background Authentication
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = await authStorage.getToken();
      const cachedUser = await authStorage.getUserProfile();

      const isValidToken = storedToken &&
        typeof storedToken === 'string' &&
        storedToken !== 'null' &&
        storedToken !== 'undefined' &&
        storedToken.trim().length > 0;

      if (!isValidToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const cleanToken = storedToken.trim();

      // Step 1: RESTORE SESSION IMMEDIATELY
      setToken(cleanToken);
      setUser(cachedUser || { id: 'cached_user', name: 'User' });
      setLoading(false);

      // Step 2: SILENT BACKGROUND SESSION VERIFICATION
      verifySessionInBackground(cleanToken, cachedUser);
    };

    initAuth();

    function handleAuthExpired() {
      authStorage.clearSession();
      setToken(null);
      setUser(null);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('daysync_auth_expired', handleAuthExpired);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('daysync_auth_expired', handleAuthExpired);
      }
    };
  }, []);

  const verifySessionInBackground = async (storedToken, cachedUser) => {
    // Prevent duplicated session verification requests within 30 seconds
    if (Date.now() - lastVerifyTimestamp.current < 30000) return;
    lastVerifyTimestamp.current = Date.now();

    setIsVerifyingSession(true);
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        setToken(storedToken);
        await authStorage.setSession(storedToken, res.user);
      }
    } catch (err) {
      console.warn('Background auth verification status:', err);
      if (err && (err.status === 401 || err.status === 403)) {
        console.warn('Token explicitly rejected by server (401/403). Expiring session.');
        if (cachedUser?.id) clientCache.clearUserCache(cachedUser.id);
        await authStorage.clearSession();
        setToken(null);
        setUser(null);
      } else {
        // Network loss / backend timeout / Render cold start -> Keep user in app safely!
        console.warn('Network offline or backend timeout. Preserving cached authenticated session.');
      }
    } finally {
      setIsVerifyingSession(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSession = (newToken, newUser) => {
    authStorage.setSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token && res.user) {
      await authStorage.setSession(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
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
      await authStorage.clearSession();
      try { localStorage.removeItem('luna_monthly_budget_target'); } catch (e) {}
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
      authStorage.updateUserProfile(merged);
      return merged;
    });
  };

  const logout = async () => {
    if (user?.id) clientCache.clearUserCache(user.id);
    await authStorage.clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isVerifyingSession,
      theme,
      toggleTheme,
      login,
      signup,
      setSession,
      deleteAccount,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}