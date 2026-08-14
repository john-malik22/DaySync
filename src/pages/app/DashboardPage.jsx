import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CreditCard, Brain, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { tasks, expenses, memories } = useLuna();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  // Task Performance Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Monthly Expenses Metrics
  const savedTarget = localStorage.getItem('luna_monthly_budget_target');
  const budgetTarget = savedTarget ? parseFloat(savedTarget) : 20000;
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
  const budgetPct = Math.min(100, Math.round((totalSpent / budgetTarget) * 100));
  const remainingBudget = Math.max(0, budgetTarget - totalSpent);

  // Memory Performance Metrics
  const totalMemories = memories.length;
  const approvedMemories = memories.filter(m => m.approved).length;

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <PageHeaderRow title={`Hello, ${firstName}`} onSearch={setSearch} />

      {/* Row 1: TASK PERFORMANCE (Left) | MONTHLY EXPENSES (Right) */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* TASK PERFORMANCE Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} color="var(--accent-primary)" /> TASK PERFORMANCE
            </h3>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {taskPct}% Done
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', marginBottom: '14px', textAlign: 'center' }}>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalTasks}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{completedTasks}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{pendingTasks}</div>
            </div>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* MONTHLY EXPENSES Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--accent-primary)" /> MONTHLY EXPENSES
            </h3>
            <span style={{ fontSize: '12px', fontWeight: '700', color: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {budgetPct}% Used
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', marginBottom: '14px', textAlign: 'center' }}>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spent</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalSpent.toLocaleString()}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{budgetTarget.toLocaleString()}</div>
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>₹{remainingBudget.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${budgetPct}%`, height: '100%', background: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Row 2: MEMORY PERFORMANCE (Left) | PROGRESS & SUMMARY (Right) */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* MEMORY PERFORMANCE Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} color="var(--accent-primary)" /> MEMORY PERFORMANCE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)', marginBottom: '14px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Memories</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalMemories}</div>
            </div>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approved Facts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{approvedMemories}</div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            All facts saved by Luna AI are under your explicit consent protection.
          </p>
        </div>

        {/* PROGRESS & SUMMARY Stacked Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* PROGRESS Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-primary)" /> PROGRESS
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span>Completion Index</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{taskPct}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* SUMMARY Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> SUMMARY
            </h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Executive Performance: <strong>{completedTasks}</strong> tasks completed, <strong>₹{totalSpent.toLocaleString()}</strong> spent against target, and <strong>{totalMemories}</strong> AI memory facts saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
