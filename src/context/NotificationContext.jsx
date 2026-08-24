import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { clientCache } from '../services/clientCache';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeUserToPush,
  unsubscribeUserFromPush
} from '../services/pushNotification';

const NotificationContext = createContext();

const DEFAULT_PREFERENCES = {
  enabled: true,
  daily: true,
  task: true,
  habit: true,
  goal: true,
  budget: true,
  luna: true,
  system: true,
  update: true,
  browser: false
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [newArrival, setNewArrival] = useState(false);

  // Web Push State
  const [pushSupported] = useState(() => isPushSupported());
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_notification_prefs');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch (e) {
      return DEFAULT_PREFERENCES;
    }
  });

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('daysync_notification_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync Push Status with backend & browser
  const refreshPushStatus = useCallback(async () => {
    if (!userId || !pushSupported) return;
    const perm = getNotificationPermission();
    setPushPermission(perm);

    try {
      const status = await api.getPushStatus();
      setPushEnabled(Boolean(status?.enabled));
      if (status?.enabled) {
        updatePreferences({ browser: true });
      }
    } catch (e) {
      // Offline or network error
    }
  }, [userId, pushSupported]);

  const enablePush = async () => {
    if (!pushSupported) {
      return { success: false, error: 'Push notifications are not supported on this device/browser.' };
    }

    setPushLoading(true);
    try {
      const result = await subscribeUserToPush();
      setPushPermission(getNotificationPermission());
      if (result.success) {
        setPushEnabled(true);
        updatePreferences({ browser: true });
      }
      return result;
    } finally {
      setPushLoading(false);
    }
  };

  const disablePush = async () => {
    setPushLoading(true);
    try {
      const result = await unsubscribeUserFromPush();
      setPushEnabled(false);
      updatePreferences({ browser: false });
      return result;
    } finally {
      setPushLoading(false);
    }
  };

  const requestBrowserPermission = async () => {
    const res = await enablePush();
    return res.success;
  };

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const data = await api.getNotifications();
      const notifList = Array.isArray(data) ? data : [];
      setIsFromCache(false);

      if (userId) clientCache.save(userId, 'notifications', notifList);

      setNotifications(prev => {
        const prevIds = new Set(prev.map(n => n.id));
        const newItems = notifList.filter(n => !n.read && !prevIds.has(n.id));

        if (newItems.length > 0) {
          setNewArrival(true);
          setTimeout(() => setNewArrival(false), 3000);
        }

        return notifList;
      });
    } catch (err) {
      console.warn('Error loading notifications from server:', err);
      setError('Unable to load notifications right now.');

      if (userId) {
        const cached = clientCache.load(userId, 'notifications');
        if (cached && Array.isArray(cached.data)) {
          setNotifications(cached.data);
          setIsFromCache(true);
        }
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    refreshPushStatus();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && userId && navigator.onLine) {
        fetchNotifications(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, refreshPushStatus, userId]);

  // Reconnect Listener
  useEffect(() => {
    function handleOnline() {
      if (userId) {
        fetchNotifications(true);
        refreshPushStatus();
      }
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchNotifications, refreshPushStatus, userId]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.deleteNotification(id);
    } catch (err) {
      fetchNotifications(true);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      await api.clearNotifications();
    } catch (err) {
      fetchNotifications(true);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        isFromCache,
        newArrival,
        preferences,
        updatePreferences,
        requestBrowserPermission,
        pushSupported,
        pushPermission,
        pushEnabled,
        pushLoading,
        enablePush,
        disablePush,
        refreshPushStatus,
        refreshNotifications: () => fetchNotifications(false),
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
