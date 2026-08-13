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
    <div className="page-container" style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
          Welcome back, {user?.name || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Welcome to DaySync. Here is your overview of tasks, expenses, and AI memory context.
        </p>
      </div>

      {/* 1. DaySync Notice Proactive Alert */}
      {primaryNotice && <NoticeBanner notice={primaryNotice} />}

      {/* 2. Top Summary Cards */}
      <SummaryCards />

      {/* 3. Task Manager Section */}
      <TaskManager />
    </div>
  );
}
