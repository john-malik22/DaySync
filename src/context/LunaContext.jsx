import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, classifyApiError } from '../services/api';
import { voice } from '../services/voice';
import { useAuth } from './AuthContext';
import { clientCache } from '../services/clientCache';
import { syncQueue } from '../services/syncQueue';
import { evaluateContextualLunaSuggestion } from '../services/lunaEngine';

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
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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
    if (!userId) return;
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
    if (!userId) return;
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
    if (!userId) return;
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
    if (!userId) return;
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

  // Automatically evaluate contextual suggestion when tasks, expenses, or starting balance change
  useEffect(() => {
    if (!userId) return;
    try {
      const computed = evaluateContextualLunaSuggestion({
        tasks,
        expenses,
        startingBalance
      });
      setSuggestion(computed);
      setErrors(prev => ({ ...prev, suggestion: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, suggestion: null }));
    }
  }, [userId, tasks, expenses, startingBalance]);

  const refreshAuxiliaryData = useCallback(async () => {
    if (!userId) return;
    await Promise.allSettled([
      fetchTasks(),
      fetchExpenses(),
      fetchMemories(),
      fetchSummaries(),
      api.getNotices().then(setNotices).catch(() => {})
    ]);
  }, [userId, fetchTasks, fetchExpenses, fetchMemories, fetchSummaries]);

  const fetchAllData = useCallback(async () => {
    if (!userId) return;
    setResourceLoading(prev => ({ ...prev, initial: true }));
    await Promise.allSettled([
      refreshAuxiliaryData(),
      api.getChatHistory().then(setConversations).catch(() => {})
    ]);
    setResourceLoading(prev => ({ ...prev, initial: false }));
  }, [userId, refreshAuxiliaryData]);

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

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
    setIsSendingMessage(true);
    setLoading(true);
    setErrors(prev => ({ ...prev, chat: null }));
    try {
      const res = await api.sendMessage(messageText);

      // 1. Immediately append user & assistant messages to conversation feed
      if (res && res.userMessage && res.assistantMessage) {
        setConversations(prev => [...prev, res.userMessage, res.assistantMessage]);

        if (enableVoice && res.assistantMessage && res.assistantMessage.message) {
          voice.speak(res.assistantMessage.message);
        }
      }

      // 2. Immediately stop message sending state so thinking UI vanishes at exact moment assistant message is rendered
      setIsSendingMessage(false);
      setLoading(false);

      // 3. Trigger auxiliary data refresh (tasks, expenses, etc) asynchronously in background without overwriting chat history
      refreshAuxiliaryData().catch(err => {
        console.warn('[LunaContext] Non-critical background data refresh error after chat message:', err);
      });

      return res;
    } catch (err) {
      setIsSendingMessage(false);
      setLoading(false);
      const classified = classifyApiError(err);
      setErrors(prev => ({ ...prev, chat: classified }));
      throw err;
    }
  };

  // Task Actions (Instant Optimistic UI)
  const addTask = async (taskData) => {
    const tempId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const optimisticTask = {
      id: tempId,
      title: taskData.title || taskData.text || 'Task',
      priority: taskData.priority || 'Medium',
      category: taskData.category || 'General',
      taskType: taskData.taskType || 'task',
      personName: taskData.personName || null,
      meetingPeople: taskData.meetingPeople || null,
      location: taskData.location || null,
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: taskData.dueTime || '19:00',
      timeBlock: taskData.timeBlock || '19:00 - 20:00',
      recurring: taskData.recurring || null,
      subtasks: taskData.subtasks || [],
      completed: false,
      createdAt: new Date().toISOString(),
      ...taskData
    };

    setTasks(prev => [...prev, optimisticTask]);
    clientCache.save(userId, 'tasks', [...tasks, optimisticTask]);

    if (!navigator.onLine) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_TASK', payload: taskData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('offline');
      return optimisticTask;
    }

    try {
      const createdTask = await api.createTask(taskData);
      const finalTask = { ...optimisticTask, ...createdTask, id: createdTask?.id || tempId };
      setTasks(prev => prev.map(t => t.id === tempId ? finalTask : t));
      clientCache.save(userId, 'tasks', tasks.map(t => t.id === tempId ? finalTask : t));
      return finalTask;
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      clientCache.save(userId, 'tasks', tasks.filter(t => t.id !== tempId));
      throw err;
    }
  };

  const updateTask = async (id, taskData) => {
    const previousTasks = [...tasks];
    const newTasks = previousTasks.map(t => t.id === id ? { ...t, ...taskData } : t);
    setTasks(newTasks);
    if (userId) clientCache.save(userId, 'tasks', newTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_TASK', targetId: id, payload: taskData });
      setPendingQueue(updatedQueue);
      return { id, ...taskData };
    }

    try {
      const updated = await api.updateTask(id, taskData);
      if (updated && typeof updated === 'object') {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      }
      return updated;
    } catch (err) {
      setTasks(previousTasks);
      if (userId) clientCache.save(userId, 'tasks', previousTasks);
      throw err;
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    const newCompleted = !currentCompleted;
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
    clientCache.save(userId, 'tasks', updatedTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'TOGGLE_TASK', targetId: id, completed: newCompleted });
      setPendingQueue(updatedQueue);
      return { id, completed: newCompleted };
    }

    try {
      const updated = await api.updateTask(id, { completed: newCompleted });
      return updated;
    } catch (err) {
      setTasks(previousTasks);
      clientCache.save(userId, 'tasks', previousTasks);
      throw err;
    }
  };

  const deleteTask = async (id) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    const remainingTasks = tasks.filter(t => t.id !== id);
    clientCache.save(userId, 'tasks', remainingTasks);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_TASK', targetId: id });
      setPendingQueue(updatedQueue);
      return;
    }

    try {
      await api.deleteTask(id);
    } catch (err) {
      setTasks(previousTasks);
      clientCache.save(userId, 'tasks', previousTasks);
      throw err;
    }
  };

  // Expense Actions (Instant Optimistic UI)
  const addExpense = async (expData) => {
    const tempId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const optimisticExp = {
      id: tempId,
      amount: Number(expData.amount),
      type: expData.type || 'expense',
      category: expData.category || 'Other',
      description: expData.description || expData.note || expData.category || 'Expense',
      date: expData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...expData
    };

    setExpenses(prev => [...prev, optimisticExp]);
    clientCache.save(userId, 'expenses', [...expenses, optimisticExp]);

    if (!navigator.onLine) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'CREATE_EXPENSE', payload: expData, tempId });
      setPendingQueue(updatedQueue);
      setSyncState('offline');
      return optimisticExp;
    }

    try {
      const createdExp = await api.createExpense(expData);
      const finalExp = { ...optimisticExp, ...createdExp, id: createdExp?.id || tempId };
      setExpenses(prev => prev.map(e => e.id === tempId ? finalExp : e));
      clientCache.save(userId, 'expenses', expenses.map(e => e.id === tempId ? finalExp : e));
      return finalExp;
    } catch (err) {
      setExpenses(prev => prev.filter(e => e.id !== tempId));
      clientCache.save(userId, 'expenses', expenses.filter(e => e.id !== tempId));
      throw err;
    }
  };

  const updateExpense = async (id, expData) => {
    const previousExpenses = [...expenses];
    const newExpenses = previousExpenses.map(e => e.id === id ? { ...e, ...expData } : e);
    setExpenses(newExpenses);
    if (userId) clientCache.save(userId, 'expenses', newExpenses);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'UPDATE_EXPENSE', targetId: id, payload: expData });
      setPendingQueue(updatedQueue);
      return { id, ...expData };
    }

    try {
      const updated = await api.updateExpense(id, expData);
      if (updated && typeof updated === 'object') {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
      }
      return updated;
    } catch (err) {
      setExpenses(previousExpenses);
      if (userId) clientCache.save(userId, 'expenses', previousExpenses);
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    const previousExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));
    const remaining = expenses.filter(e => e.id !== id);
    clientCache.save(userId, 'expenses', remaining);

    if (!navigator.onLine || String(id).startsWith('local_')) {
      const updatedQueue = syncQueue.enqueue(userId, { type: 'DELETE_EXPENSE', targetId: id });
      setPendingQueue(updatedQueue);
      return;
    }

    try {
      await api.deleteExpense(id);
    } catch (err) {
      setExpenses(previousExpenses);
      clientCache.save(userId, 'expenses', previousExpenses);
      throw err;
    }
  };

  // Memory Actions (Instant Optimistic UI)
  const addMemory = async (data) => {
    const tempId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const optimisticMem = {
      id: tempId,
      type: data.type || 'Preferences',
      content: data.content,
      confidence: data.confidence || 1.0,
      approved: data.approved !== undefined ? data.approved : true,
      createdAt: new Date().toISOString()
    };

    setMemories(prev => [...prev, optimisticMem]);
    clientCache.save(userId, 'memories', [...memories, optimisticMem]);

    try {
      const newMem = await api.createMemory(data);
      const finalMem = { ...optimisticMem, ...newMem, id: newMem?.id || tempId };
      setMemories(prev => prev.map(m => m.id === tempId ? finalMem : m));
      return finalMem;
    } catch (err) {
      setMemories(prev => prev.filter(m => m.id !== tempId));
      throw err;
    }
  };

  const updateMemory = async (id, data) => {
    const previous = [...memories];
    setMemories(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));

    try {
      const updated = await api.updateMemory(id, data);
      return updated;
    } catch (err) {
      setMemories(previous);
      throw err;
    }
  };

  const deleteMemory = async (id) => {
    const previous = [...memories];
    setMemories(prev => prev.filter(m => m.id !== id));

    try {
      await api.deleteMemory(id);
    } catch (err) {
      setMemories(previous);
      throw err;
    }
  };

  const clearChatHistory = async () => {
    await api.clearHistory();
    setConversations([]);
    if (userId) clientCache.save(userId, 'chat_history', []);
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
        isSendingMessage,
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
        clearChatHistory,
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