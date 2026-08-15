import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
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

  // Sidebar Hide / Show & Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('luna_sidebar_collapsed') === 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer state

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
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

  const fetchData = async () => {
    try {
      const [mems, tsks, exps, ntcs, sug, chat, sums] = await Promise.allSettled([
        api.getMemories(),
        api.getTasks(),
        api.getExpenses(),
        api.getNotices(),
        api.getCurrentSuggestion(),
        api.getChatHistory(),
        api.getSummaries()
      ]);

      if (mems.status === 'fulfilled') setMemories(mems.value);
      if (tsks.status === 'fulfilled') setTasks(tsks.value);
      if (exps.status === 'fulfilled') setExpenses(exps.value);
      if (ntcs.status === 'fulfilled') setNotices(ntcs.value);
      if (sug.status === 'fulfilled') setSuggestion(sug.value);
      if (chat.status === 'fulfilled') setConversations(chat.value);
      if (sums.status === 'fulfilled') setSummaries(sums.value);
    } catch (e) {
      console.error('Error loading Luna context:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendMessage = async (messageText, enableVoice = false) => {
    setLoading(true);
    try {
      const res = await api.sendMessage(messageText);
      setConversations(prev => [...prev, res.userMessage, res.assistantMessage]);

      if (enableVoice && res.assistantMessage && res.assistantMessage.message) {
        voice.speak(res.assistantMessage.message);
      }

      await fetchData();
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Memory Actions
  const addMemory = async (data) => {
    const newMem = await api.createMemory(data);
    await fetchData();
    return newMem;
  };

  const updateMemory = async (id, data) => {
    const updated = await api.updateMemory(id, data);
    await fetchData();
    return updated;
  };

  const deleteMemory = async (id) => {
    await api.deleteMemory(id);
    await fetchData();
  };

  // Task Actions
  const addTask = async (taskData) => {
    const newTask = await api.createTask(taskData);
    await fetchData();
    return newTask;
  };

  const toggleTask = async (id, currentCompleted) => {
    const updated = await api.updateTask(id, { completed: !currentCompleted });
    await fetchData();
    return updated;
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
    await fetchData();
  };

  // Expense Actions
  const addExpense = async (expData) => {
    const newExp = await api.createExpense(expData);
    await fetchData();
    return newExp;
  };

  const updateExpense = async (id, expData) => {
    const updated = await api.updateExpense(id, expData);
    await fetchData();
    return updated;
  };

  const deleteExpense = async (id) => {
    await api.deleteExpense(id);
    await fetchData();
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
        sidebarCollapsed,
        sidebarOpen,
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
        refreshData: fetchData
      }}
    >
      {children}
    </LunaContext.Provider>
  );
}

export function useLuna() {
  return useContext(LunaContext);
}
