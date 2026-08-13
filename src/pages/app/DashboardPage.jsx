import React from 'react';
import { SummaryCards } from '../../components/dashboard/SummaryCards';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { TaskManager } from '../../components/planner/TaskManager';
import { FinancialInsights } from '../../components/expenses/FinancialInsights';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar } from 'lucide-react';

export function DashboardPage() {
  const { notices } = useLuna();
  const { user } = useAuth();

  const primaryNotice = notices[0];
  const currentDateFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="page-container">
      {/* Header & Date Badge */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1>Welcome back, {user?.name || 'User'} 👋</h1>
          <p>Here is your daily overview of tasks, expenses, and AI memory context.</p>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px',
          fontWeight: '600', color: 'var(--text-secondary)'
        }}>
          <Calendar size={14} color="var(--accent-primary)" />
          {currentDateFormatted}
        </div>
      </div>

      {/* Proactive Notice Banner */}
      {primaryNotice && <NoticeBanner notice={primaryNotice} />}

      {/* Top 3 KPI Cards */}
      <SummaryCards />

      {/* Main Dashboard Layout Split */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
        {/* Left Container: Task Manager & Quick Input */}
        <TaskManager />

        {/* Right Container: Financial & AI Snapshot Widget */}
        <FinancialInsights />
      </div>
    </div>
  );
}
