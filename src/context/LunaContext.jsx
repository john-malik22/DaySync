import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, classifyApiError } from '../services/api';
import { voice } from '../services/voice';

const LunaContext = createContext();

export function LunaProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [memories, setMemories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Dedicated Resource Fetchers with error tracking
  const fetchTasks = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, tasks: true }));
    try {
      const data = await api.getTasks();
      setTasks(data);
      setErrors(prev => ({ ...prev, tasks: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, tasks: classifyApiError(err) }));
    } finally {
      setResourceLoading(prev => ({ ...prev, tasks: false }));
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, expenses: true }));
    try {
      const data = await api.getExpenses();
      setExpenses(data);
      setErrors(prev => ({ ...prev, expenses: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, expenses: classifyApiError(err) }));
    } finally {
      setResourceLoading(prev => ({ ...prev, expenses: false }));
    }
  }, []);

  const fetchMemories = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, memories: true }));
    try {
      const data = await api.getMemories();
      setMemories(data);
      setErrors(prev => ({ ...prev, memories: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, memories: classifyApiError(err) }));
    } finally {
      setResourceLoading(prev => ({ ...prev, memories: false }));
    }
  }, []);

  const fetchSummaries = useCallback(async () => {
    setResourceLoading(prev => ({ ...prev, summaries: true }));
    try {
      const data = await api.getSummaries();
      setSummaries(data);
      setErrors(prev => ({ ...prev, summaries: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, summaries: classifyApiError(err) }));
    } finally {
      setResourceLoading(prev => ({ ...prev, summaries: false }));
    }
  }, []);

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
    try {
      const newMem = await api.createMemory(data);
      await fetchMemories();
      return newMem;
    } catch (err) {
      throw err;
    }
  };

  const updateMemory = async (id, data) => {
    try {
      const updated = await api.updateMemory(id, data);
      await fetchMemories();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteMemory = async (id) => {
    try {
      await api.deleteMemory(id);
      await fetchMemories();
    } catch (err) {
      throw err;
    }
  };

  // Task Actions
  const addTask = async (taskData) => {
    try {
      const newTask = await api.createTask(taskData);
      await fetchTasks();
      return newTask;
    } catch (err) {
      throw err;
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    try {
      const updated = await api.updateTask(id, { completed: !currentCompleted });
      await fetchTasks();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      throw err;
    }
  };

  // Expense Actions
  const addExpense = async (expData) => {
    try {
      const newExp = await api.createExpense(expData);
      await fetchExpenses();
      return newExp;
    } catch (err) {
      throw err;
    }
  };

  const updateExpense = async (id, expData) => {
    try {
      const updated = await api.updateExpense(id, expData);
      await fetchExpenses();
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      throw err;
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
