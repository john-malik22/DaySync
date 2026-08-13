import React from 'react';
import { SummaryCards } from '../../components/dashboard/SummaryCards';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { TaskManager } from '../../components/planner/TaskManager';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';

export function DashboardPage() {
  const { notices } = useLuna();
  const { user } = useAuth();

  const primaryNotice = notices[0];

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="page-header">
        <h1>Welcome back, {user?.name || 'User'} 👋</h1>
        <p>Here is your daily overview of tasks, expenses, and AI memory context.</p>
      </div>

      {/* Notice Banner */}
      {primaryNotice && <NoticeBanner notice={primaryNotice} />}

      {/* Summary Cards */}
      <SummaryCards />

      {/* Task Manager */}
      <TaskManager />
    </div>
  );
}
