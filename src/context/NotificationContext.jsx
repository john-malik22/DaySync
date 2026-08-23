import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { clientCache } from '../services/clientCache';

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

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in your current browser environment.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreferences({ browser: true });
        new Notification('DaySync Notifications Enabled', {
          body: 'You will now receive alerts for important events and reminders.',
          icon: '/icons/icon-192.png'
        });
        return true;
      } else {
        updatePreferences({ browser: false });
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
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

          if (preferences.browser && 'Notification' in window && Notification.permission === 'granted') {
            newItems.forEach(item => {
              try {
                new Notification(item.title, {
                  body: item.message,
                  icon: '/icons/icon-192.png'
                });
              } catch (e) {}
            });
          }
        }

        return notifList;
      });
    } catch (err) {
      console.warn('Error loading notifications from server:', err);
      setError('Unable to load notifications right now.');

      // Restore user-scoped cached notifications offline
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
  }, [userId, preferences.browser]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && userId && navigator.onLine) {
        fetchNotifications(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, userId]);

  // Reconnect Listener
  useEffect(() => {
    function handleOnline() {
      if (userId) fetchNotifications(true);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchNotifications, userId]);

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
