import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { TaskManager } from '../../components/planner/TaskManager';
import { FinancialInsights } from '../../components/expenses/FinancialInsights';
import { MemoryCenter } from '../../components/memory/MemoryCenter';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, CreditCard, Sparkles, Brain } from 'lucide-react';

export function DashboardPage() {
  const { tasks, expenses, memories } = useLuna();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="page-container">
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title={`Hello ${user?.name || 'User'}`} onSearch={setSearch} />

      {/* Wireframe Row 1: TASK (Left) | MONTHLY EXPENSES (Right) */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* TASK Section */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>TASK</h3>
          <TaskManager searchFilter={search} />
        </div>

        {/* MONTHLY EXPENSES Section */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>MONTHLY EXPENSES</h3>
          <FinancialInsights />
        </div>
      </div>

      {/* Wireframe Row 2: REMEMBER (Left) | PROGRESS & SUMMARY (Right) */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* REMEMBER Section */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>REMEMBER</h3>
          <MemoryCenter searchFilter={search} />
        </div>

        {/* PROGRESS & SUMMARY Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* PROGRESS Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-primary)" /> PROGRESS
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Task Completion Rate</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{taskPct}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {completedTasks} of {totalTasks} tasks completed today
            </div>
          </div>

          {/* SUMMARY Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> SUMMARY
            </h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Overall status shows <strong>{completedTasks}</strong> tasks done, <strong>₹{totalSpent.toLocaleString()}</strong> spent, and <strong>{memories.length}</strong> facts saved in memory context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
