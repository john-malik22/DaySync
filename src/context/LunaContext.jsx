import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, classifyApiError } from '../services/api';
import { voice } from '../services/voice';
import { useAuth } from './AuthContext';
import { clientCache } from '../services/clientCache';
import { syncQueue } from '../services/syncQueue';

const LunaContext = createContext();

export function LunaProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [conversations, setConversations] = useState([]);
  const [memories, setMemories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync state tracking: 'synced' | 'offline' | 'syncing' | 'pending' | 'failed'
  const [syncState, setSyncState] = useState(() => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'));
  const [pendingQueue, setPendingQueue] = useState([]);

  // Stale cache tracking
  const [lastSyncedAt, setLastSyncedAt] = useState({
    tasks: null,
    expenses: null,
    memories: null,
    summaries: null
  });

  const [isFromCache, setIsFromCache] = useState({
    tasks: false,
    expenses: false,
    memories: false,
    summaries: false
  });

  // Granular resource error & loading state management
  const [errors, setErrors] = useState({
    tasks: null,
    expenses: null,
    memories: null,
    summaries: null,
    suggestion: null,
    chat: null
  });

  const [resourceLoading, setResourceLoading] = useState({
    initial: true,
    tasks: false,
    expenses: false,
    memories: false,
    summaries: false,
    suggestion: false,
    chat: false
  });

  // Sidebar Hide / Show & Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('luna_sidebar_collapsed') === 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Single Shared Starting Account Balance
  const [startingBalance, setStartingBalanceState] = useState(() => {
    const saved = localStorage.getItem('daysync_starting_account_amount') || localStorage.getItem('luna_monthly_budget_target');
    return saved !== null && saved !== '' ? parseFloat(saved) : null;
  });

  const updateStartingBalance = (amount) => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val >= 0) {
      setStartingBalanceState(val);
      localStorage.setItem('daysync_starting_account_amount', val.toString());
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const nextState = !prev;
        localStorage.setItem('luna_sidebar_collapsed', nextState.toString());
        return nextState;
      });
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Dedicated Resource Fetchers with safe user-scoped client caching
  const fetchTasks = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, tasks: true }));
    try {
      const data = await api.getTasks();
      setTasks(data);
      setErrors(prev => ({ ...prev, tasks: null }));
      setIsFromCache(prev => ({ ...prev, tasks: false }));
      const now = Date.now();
      setLastSyncedAt(prev => ({ ...prev, tasks: now }));
      if (userId) clientCache.save(userId, 'tasks', data);
    } catch (err) {
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, tasks: classified }));

      // Fall back to safe user-scoped cache if available
      if (userId) {
        const cached = clientCache.load(userId, 'tasks');
        if (cached && Array.isArray(cached.data)) {
          setTasks(cached.data);
          setIsFromCache(prev => ({ ...prev, tasks: true }));
          setLastSyncedAt(prev => ({ ...prev, tasks: cached.timestamp }));
        }
      }
    } finally {
      setResourceLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [userId]);

  const fetchExpenses = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, expenses: true }));
    try {
      const data = await api.getExpenses();
      setExpenses(data);
      setErrors(prev => ({ ...prev, expenses: null }));
      setIsFromCache(prev => ({ ...prev, expenses: false }));
      const now = Date.now();
      setLastSyncedAt(prev => ({ ...prev, expenses: now }));
      if (userId) clientCache.save(userId, 'expenses', data);
    } catch (err) {
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, expenses: classified }));

      if (userId) {
        const cached = clientCache.load(userId, 'expenses');
        if (cached && Array.isArray(cached.data)) {
          setExpenses(cached.data);
          setIsFromCache(prev => ({ ...prev, expenses: true }));
          setLastSyncedAt(prev => ({ ...prev, expenses: cached.timestamp }));
        }
      }
    } finally {
      setResourceLoading(prev => ({ ...prev, expenses: false }));
    }
  }, [userId]);

  const fetchMemories = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, memories: true }));
    try {
      const data = await api.getMemories();
      setMemories(data);
      setErrors(prev => ({ ...prev, memories: null }));
      setIsFromCache(prev => ({ ...prev, memories: false }));
      const now = Date.now();
      setLastSyncedAt(prev => ({ ...prev, memories: now }));
      if (userId) clientCache.save(userId, 'memories', data);
    } catch (err) {
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, memories: classified }));

      if (userId) {
        const cached = clientCache.load(userId, 'memories');
        if (cached && Array.isArray(cached.data)) {
          setMemories(cached.data);
          setIsFromCache(prev => ({ ...prev, memories: true }));
          setLastSyncedAt(prev => ({ ...prev, memories: cached.timestamp }));
        }
      }
    } finally {
      setResourceLoading(prev => ({ ...prev, memories: false }));
    }
  }, [userId]);

  const fetchSummaries = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, summaries: true }));
    try {
      const data = await api.getSummaries();
      setSummaries(data);
      setErrors(prev => ({ ...prev, summaries: null }));
      setIsFromCache(prev => ({ ...prev, summaries: false }));
      const now = Date.now();
      setLastSyncedAt(prev => ({ ...prev, summaries: now }));
      if (userId) clientCache.save(userId, 'summaries', data);
    } catch (err) {
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, summaries: classified }));

      if (userId) {
        const cached = clientCache.load(userId, 'summaries');
        if (cached && cached.data) {
          setSummaries(cached.data);
          setIsFromCache(prev => ({ ...prev, summaries: true }));
          setLastSyncedAt(prev => ({ ...prev, summaries: cached.timestamp }));
        }
      }
    } finally {
      setResourceLoading(prev => ({ ...prev, summaries: false }));
    }
  }, [userId]);

  const fetchSuggestion = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, suggestion: true }));
    try {
      const data = await api.getCurrentSuggestion();
      setSuggestion(data);
      setErrors(prev => ({ ...prev, suggestion: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, suggestion: classifyApiError(err) }));
    } finally {
      setResourceLoading(prev => ({ ...prev, suggestion: false }));
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, initial: true }));
    await Promise.allSettled([
      fetchTasks(),
      fetchExpenses(),
      fetchMemories(),
      fetchSummaries(),
      fetchSuggestion(),
      api.getNotices().then(setNotices).catch(() => {}),
      api.getChatHistory().then(setConversations).catch(() => {})
    ]);
    setResourceLoading(prev => ({ ...prev, initial: false }));
  }, [fetchTasks, fetchExpenses, fetchMemories, fetchSummaries, fetchSuggestion]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Reconnect Listener: Auto-refetch safe GET queries when internet is restored
  useEffect(() => {
    function handleOnline() {
      console.log('DaySync reconnected to internet. Auto-refreshing read data...');
      fetchAllData();
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchAllData]);

  const sendMessage = async (messageText, enableVoice = false) => {
    setLoading(true);
    setErrors(prev => ({ ...prev, chat: null }));
    try {
      const res = await api.sendMessage(messageText);
      setConversations(prev => [...prev, res.userMessage, res.assistantMessage]);

      if (enableVoice && res.assistantMessage && res.assistantMessage.message) {
        voice.speak(res.assistantMessage.message);
      }

      await fetchAllData();
      return res;
    } catch (err) {
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, chat: classified }));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Memory Actions
  const addMemory = async (data) => {
    const newMem = await api.createMemory(data);
    await fetchMemories();
    return newMem;
  };

  const updateMemory = async (id, data) => {
    const updated = await api.updateMemory(id, data);
    await fetchMemories();
    return updated;
  };

  const deleteMemory = async (id) => {
    await api.deleteMemory(id);
    await fetchMemories();
  };

  // Process pending offline sync queue
  const processPendingSyncQueue = useCallback(async () => {
    if (!userId) return;
    const items = syncQueue.getPending(userId);
    setPendingQueue(items);

    if (items.length === 0) {
      if (navigator.onLine) setSyncState('synced');
      return;
    }

    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setSyncState('syncing');

    const processedIds = [];
    let hasError = false;

    for (const item of items) {
      try {
        if (item.type === 'CREATE_TASK') {
          await api.createTask(item.payload);
        } else if (item.type === 'TOGGLE_TASK') {
          await api.updateTask(item.targetId, { completed: item.completed });
        } else if (item.type === 'DELETE_TASK') {
          await api.deleteTask(item.targetId);
        } else if (item.type === 'CREATE_EXPENSE') {
          await api.createExpense(item.payload);
        } else if (item.type === 'UPDATE_EXPENSE') {
          await api.updateExpense(item.targetId, item.payload);
        } else if (item.type === 'DELETE_EXPENSE') {
          await api.deleteExpense(item.targetId);
        }
        processedIds.push(item.id);
      } catch (err) {
        console.warn('Sync attempt failed for item:', item, err);
        hasError = true;
        break;
      }
    }

    if (processedIds.length > 0) {
      syncQueue.removeItems(userId, processedIds);
    }

    const remaining = syncQueue.getPending(userId);
    setPendingQueue(remaining);

    if (remaining.length === 0) {
      setSyncState('synced');
      fetchTasks();
      fetchExpenses();
    } else if (hasError) {
      setSyncState('failed');
    }
  }, [userId, fetchTasks, fetchExpenses]);

  // Handle network status changes & auto-sync
  useEffect(() => {
    if (userId) {
      const remaining = syncQueue.getPending(userId);
      setPendingQueue(remaining);
      if (remaining.length > 0) {
        setSyncState(!navigator.onLine ? 'offline' : 'pending');
      }
    }

    function handleOnline() {
      processPendingSyncQueue();
    }

    function handleOffline() {
      setSyncState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, processPendingSyncQueue]);

  // Task Actions (Offline resilient)
  const addTask = async (taskData) => {
    if (!navigator.onLine) {
      const tempId = `local_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTask = {
        id: tempId,
        text: taskData.text,
        completed: false,
        type: taskData.type || 'task',
        dueDate: taskData.dueDate || new Date().toISOString(),
        isLocal: true,
        createdAt: new Date().toISOString()
      };

      setTasks(prev => [newTask, ...prev]);
      clientCache.save(userId, 'tasks', [newTask, ...tasks]);
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_TASK', payload: taskData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return newTask;
    }

    try {
      const newTask = await api.createTask(taskData);
      await fetchTasks();
      return newTask;
    } catch (err) {
      const tempId = `local_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTask = {
        id: tempId,
        text: taskData.text,
        completed: false,
        type: taskData.type || 'task',
        dueDate: taskData.dueDate || new Date().toISOString(),
        isLocal: true,
        createdAt: new Date().toISOString()
      };

      setTasks(prev => [newTask, ...prev]);
      clientCache.save(userId, 'tasks', [newTask, ...tasks]);
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_TASK', payload: taskData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
      return newTask;
    }
  };

  const updateTask = async (id, taskData) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...taskData } : t));
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...taskData } : t);
    clientCache.save(userId, 'tasks', updatedTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_TASK', targetId: id, payload: taskData });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return { id, ...taskData };
    }

    try {
      const updated = await api.updateTask(id, taskData);
      await fetchTasks();
      return updated;
    } catch (err) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_TASK', targetId: id, payload: taskData });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
      return { id, ...taskData };
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    const newCompleted = !currentCompleted;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
    clientCache.save(userId, 'tasks', updatedTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'TOGGLE_TASK', targetId: id, completed: newCompleted });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return { id, completed: newCompleted };
    }

    try {
      const updated = await api.updateTask(id, { completed: newCompleted });
      await fetchTasks();
      return updated;
    } catch (err) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'TOGGLE_TASK', targetId: id, completed: newCompleted });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
      return { id, completed: newCompleted };
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const remainingTasks = tasks.filter(t => t.id !== id);
    clientCache.save(userId, 'tasks', remainingTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_TASK', targetId: id });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return;
    }

    try {
      await api.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_TASK', targetId: id });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
    }
  };

  // Expense Actions (Offline resilient)
  const addExpense = async (expData) => {
    if (!navigator.onLine) {
      const tempId = `local_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newExp = {
        id: tempId,
        amount: Number(expData.amount),
        type: expData.type || 'EXPENSE',
        category: expData.category || 'General',
        note: expData.note || '',
        date: expData.date || new Date().toISOString(),
        isLocal: true
      };

      setExpenses(prev => [newExp, ...prev]);
      clientCache.save(userId, 'expenses', [newExp, ...expenses]);
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_EXPENSE', payload: expData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return newExp;
    }

    try {
      const newExp = await api.createExpense(expData);
      await fetchExpenses();
      return newExp;
    } catch (err) {
      const tempId = `local_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newExp = {
        id: tempId,
        amount: Number(expData.amount),
        type: expData.type || 'EXPENSE',
        category: expData.category || 'General',
        note: expData.note || '',
        date: expData.date || new Date().toISOString(),
        isLocal: true
      };

      setExpenses(prev => [newExp, ...prev]);
      clientCache.save(userId, 'expenses', [newExp, ...expenses]);
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_EXPENSE', payload: expData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
      return newExp;
    }
  };

  const updateExpense = async (id, expData) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expData } : e));
    const updatedExps = expenses.map(e => e.id === id ? { ...e, ...expData } : e);
    clientCache.save(userId, 'expenses', updatedExps);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_EXPENSE', targetId: id, payload: expData });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return { id, ...expData };
    }

    try {
      const updated = await api.updateExpense(id, expData);
      await fetchExpenses();
      return updated;
    } catch (err) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_EXPENSE', targetId: id, payload: expData });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
      return { id, ...expData };
    }
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const remaining = expenses.filter(e => e.id !== id);
    clientCache.save(userId, 'expenses', remaining);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_EXPENSE', targetId: id });
      setPendingQueue(updatedQueue);
      setSyncState('pending');
      return;
    }

    try {
      await api.deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_EXPENSE', targetId: id });
      setPendingQueue(updatedQueue);
      setSyncState('failed');
    }
  };

  return (
    <LunaContext.Provider
      value={{
        conversations,
        memories,
        tasks,
        expenses,
        notices,
        summaries,
        suggestion,
        loading,
        errors,
        resourceLoading,
        lastSyncedAt,
        isFromCache,
        sidebarCollapsed,
        sidebarOpen,
        startingBalance,
        updateStartingBalance,
        toggleSidebar,
        closeSidebar,
        sendMessage,
        addMemory,
        updateMemory,
        deleteMemory,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        addExpense,
        updateExpense,
        deleteExpense,
        syncState,
        pendingQueueCount: pendingQueue.length,
        retrySync: processPendingSyncQueue,
        fetchTasks,
        fetchExpenses,
        fetchMemories,
        fetchSummaries,
        fetchSuggestion,
        refreshData: fetchAllData
      }}
    >
      {children}
    </LunaContext.Provider>
  );
}

export function useLuna() {
  return useContext(LunaContext);
}
