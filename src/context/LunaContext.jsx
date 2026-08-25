import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, classifyApiError } from '../services/api';
import { voice } from '../services/voice';
import { useAuth } from './AuthContext';
import { clientCache } from '../services/clientCache';

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

  const fetchSuggestion = useCallback(async () => {
    if (!userId) return;
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
  }, [userId]);

  const fetchAllData = useCallback(async () => {
    if (!userId) return;
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
  }, [userId, fetchTasks, fetchExpenses, fetchMemories, fetchSummaries, fetchSuggestion]);

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId, fetchAllData]);

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

  // Task Actions
  const addTask = async (taskData) => {
    const newTask = await api.createTask(taskData);
    await fetchTasks();
    return newTask;
  };

  const toggleTask = async (id, currentCompleted) => {
    const updated = await api.updateTask(id, { completed: !currentCompleted });
    await fetchTasks();
    return updated;
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
    await fetchTasks();
  };

  // Expense Actions
  const addExpense = async (expData) => {
    const newExp = await api.createExpense(expData);
    await fetchExpenses();
    return newExp;
  };

  const updateExpense = async (id, expData) => {
    const updated = await api.updateExpense(id, expData);
    await fetchExpenses();
    return updated;
  };

  const deleteExpense = async (id) => {
    await api.deleteExpense(id);
    await fetchExpenses();
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
        toggleTask,
        deleteTask,
        addExpense,
        updateExpense,
        deleteExpense,
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
