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
  plan: true,
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

          const isQuietHours = () => {
            if (localStorage.getItem('daysync_quiet_hours_enabled') !== 'true') {
              return false;
            }

            const startStr = localStorage.getItem('daysync_quiet_hours_start') || '22:00';
            const endStr = localStorage.getItem('daysync_quiet_hours_end') || '08:00';

            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = startH * 60 + (startM || 0);
            const endMinutes = endH * 60 + (endM || 0);

            if (startMinutes === endMinutes) return false;
            if (startMinutes < endMinutes) {
              return currentMinutes >= startMinutes && currentMinutes < endMinutes;
            } else {
              return currentMinutes >= startMinutes || currentMinutes < endMinutes;
            }
          };

          if (!isQuietHours() && preferences.browser && 'Notification' in window && Notification.permission === 'granted') {
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

  // SMART REMINDER & NOTIFICATION TIMING ENGINE
  const evaluateSmartReminders = useCallback(() => {
    if (!userId) return;

    // 1. Check Notification Preferences
    let settings = {
      masterPush: true,
      taskDue: true,
      taskOverdue: true,
      planExpiry: true,
      planPayment: true,
      habitReminders: true,
      splitUpdates: true
    };
    try {
      const savedSettings = localStorage.getItem('daysync_notif_settings');
      if (savedSettings) settings = { ...settings, ...JSON.parse(savedSettings) };
    } catch (e) {}

    if (settings.masterPush === false) return;

    // 2. Check Quiet Hours
    const isQuietHours = () => {
      if (localStorage.getItem('daysync_quiet_hours_enabled') !== 'true') return false;

      const startStr = localStorage.getItem('daysync_quiet_hours_start') || '22:00';
      const endStr = localStorage.getItem('daysync_quiet_hours_end') || '08:00';

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      if (startMinutes === endMinutes) return false;
      if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
    };

    const quiet = isQuietHours();

    // 3. Load user-scoped cached tasks and expenses
    const cachedTasks = clientCache.load(userId, 'tasks')?.data || [];
    const cachedExpenses = clientCache.load(userId, 'expenses')?.data || [];

    const now = new Date();
    const newGeneratedNotifs = [];

    const isAlreadyNotified = (key) => {
      return localStorage.getItem(`daysync_notified_${userId}_${key}`) === 'true';
    };

    const markNotified = (key) => {
      localStorage.setItem(`daysync_notified_${userId}_${key}`, 'true');
    };

    // A. Evaluate Tasks, Meetings, Birthdays, Reminders
    cachedTasks.forEach(task => {
      if (task.completed || task.isPaused) return;

      const taskType = task.taskType || 'task';
      const isHighPriority = task.priority === 'High';

      if (!settings.taskDue && !settings.taskOverdue) return;

      const dueStr = task.dueDate || task.date;
      if (!dueStr) return;

      const dueTimeStr = task.dueTime || '09:00';
      const [hours, mins] = dueTimeStr.split(':').map(Number);
      const targetDate = new Date(dueStr);
      targetDate.setHours(hours || 9, mins || 0, 0, 0);

      const diffMs = targetDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      let stage = null;
      let title = '';
      let message = '';

      if (diffMins < -5) {
        // OVERDUE
        if (!settings.taskOverdue) return;
        stage = 'OVERDUE';
        title = `⚠️ Overdue: ${task.title || 'Task'}`;
        message = `Your ${taskType === 'birthday' ? 'birthday reminder' : taskType === 'meeting' ? 'meeting' : 'task'} was due ${Math.abs(Math.floor(diffMins / 60))} hours ago.`;
      } else if (diffMins >= -5 && diffMins <= 15) {
        // DUE NOW
        if (!settings.taskDue) return;
        stage = 'DUE_NOW';
        title = `⏰ Due Now: ${task.title || 'Task'}`;
        message = taskType === 'birthday' ? `Wish ${task.personName || 'them'} a Happy Birthday today!` : taskType === 'meeting' ? `Meeting starting now (${task.dueTime || 'now'}).` : `Time to complete "${task.title}".`;
      } else if (diffMins > 15 && diffMins <= 60 && isHighPriority) {
        // DUE SOON (High Priority)
        if (!settings.taskDue) return;
        stage = 'DUE_SOON';
        title = `🔥 High Priority Due Soon: ${task.title}`;
        message = `Important item due in ${diffMins} minutes.`;
      } else if (diffMins > 60 && diffMins <= 1440 && (taskType === 'meeting' || taskType === 'birthday')) {
        // UPCOMING (1 day before)
        if (!settings.taskDue) return;
        stage = 'UPCOMING';
        title = `📅 Upcoming ${taskType === 'birthday' ? 'Birthday' : 'Meeting'}: ${task.title || task.personName}`;
        message = `Scheduled for ${task.dueDate || 'tomorrow'}.`;
      }

      if (stage) {
        const dedupKey = `task_${task.id}_${stage}`;
        if (!isAlreadyNotified(dedupKey)) {
          // If in quiet hours, only allow High priority or Overdue items
          if (quiet && !isHighPriority && stage !== 'OVERDUE') {
            return;
          }

          markNotified(dedupKey);

          const notif = {
            id: `smart_task_${task.id}_${stage}_${Date.now()}`,
            title,
            message,
            category: taskType === 'birthday' ? 'Birthday' : taskType === 'meeting' ? 'Meeting' : 'Task',
            priority: isHighPriority || stage === 'OVERDUE' ? 'High' : 'Normal',
            createdAt: new Date().toISOString(),
            read: false,
            isSmart: true
          };

          newGeneratedNotifs.push(notif);
        }
      }
    });

    // B. Evaluate Plans, Subscriptions, Recharges
    if (settings.planExpiry || settings.planPayment) {
      cachedExpenses.forEach(plan => {
        if (plan.isPaused) return;

        const isPlan = plan.isPlan || plan.isRecurring || ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(plan.category);
        if (!isPlan) return;

        const endDateStr = plan.endDate || plan.nextDueDate || plan.date;
        if (!endDateStr) return;

        const endDate = new Date(endDateStr);
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let stage = null;
        let title = '';
        let message = '';

        if (diffDays < 0 && Math.abs(diffDays) <= 30) {
          stage = 'EXPIRED';
          title = `⚠️ Plan Expired: ${plan.description || plan.category}`;
          message = `Your ${plan.category} plan expired on ${endDateStr.split('T')[0]}.`;
        } else if (diffDays >= 0 && diffDays <= 3) {
          stage = 'DUE_SOON';
          title = `🔔 Plan Renewal Due: ${plan.description || plan.category}`;
          message = `Renewal of ₹${plan.amount || 0} due in ${diffDays === 0 ? 'today' : diffDays + ' days'}.`;
        } else if (diffDays > 3 && diffDays <= 7) {
          stage = 'UPCOMING';
          title = `📅 Upcoming Plan Renewal: ${plan.description || plan.category}`;
          message = `Payment due on ${endDateStr.split('T')[0]}.`;
        }

        if (stage) {
          const dedupKey = `plan_${plan.id}_${stage}`;
          if (!isAlreadyNotified(dedupKey)) {
            if (quiet) return;

            markNotified(dedupKey);

            const notif = {
              id: `smart_plan_${plan.id}_${stage}_${Date.now()}`,
              title,
              message,
              category: 'Plan',
              priority: stage === 'EXPIRED' ? 'High' : 'Normal',
              createdAt: new Date().toISOString(),
              read: false,
              isSmart: true
            };

            newGeneratedNotifs.push(notif);
          }
        }
      });
    }

    if (newGeneratedNotifs.length > 0) {
      setNotifications(prev => [...newGeneratedNotifs, ...prev]);
      setNewArrival(true);
      setTimeout(() => setNewArrival(false), 3000);

      if (!quiet && preferences.browser && 'Notification' in window && Notification.permission === 'granted') {
        newGeneratedNotifs.forEach(item => {
          try {
            new Notification(item.title, {
              body: item.message,
              icon: '/icons/icon-192.png'
            });
          } catch (e) {}
        });
      }
    }
  }, [userId, preferences.browser]);

  // Run Smart Reminder evaluation periodically
  useEffect(() => {
    evaluateSmartReminders();

    const interval = setInterval(() => {
      evaluateSmartReminders();
    }, 30000);

    return () => clearInterval(interval);
  }, [evaluateSmartReminders]);

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
        clearNotifications,
        evaluateSmartReminders
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
