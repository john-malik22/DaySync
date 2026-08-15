import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CreditCard, Brain, CheckCircle2, Sparkles, Activity, ArrowRight } from 'lucide-react';

export function DashboardPage() {
  const { tasks, expenses, memories, routines } = useLuna();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  // Widget visibility preferences from localStorage
  const widgetSettings = (() => {
    try {
      const saved = localStorage.getItem('daysync_dashboard_widgets');
      return saved ? JSON.parse(saved) : { task: true, expense: true, memory: true, habit: true, progress: true };
    } catch (e) {
      return { task: true, expense: true, memory: true, habit: true, progress: true };
    }
  })();

  // Task Performance Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Monthly Expenses Metrics (Total Amount & Total Spent ONLY)
  const savedTarget = localStorage.getItem('luna_monthly_budget_target');
  const totalAmount = savedTarget ? parseFloat(savedTarget) : 5528;
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
  const budgetPct = totalAmount > 0 ? Math.min(100, Math.round((totalSpent / totalAmount) * 100)) : 0;

  // Memory Performance Metrics
  const totalMemories = memories.length;
  const approvedMemories = memories.filter(m => m.approved).length;

  // Habit Tracker Performance Metrics (Compact Overview)
  const totalHabitCount = routines ? routines.length : 3;
  const habitChecksDone = 18;
  const habitChecksTotal = totalHabitCount * 7;
  const habitPct = habitChecksTotal > 0 ? Math.round((habitChecksDone / habitChecksTotal) * 100) : 0;

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <PageHeaderRow title={`Hello, ${firstName}`} onSearch={setSearch} />

      {/* Performance Grid: Compact Cards with 12px–16px padding */}
      <div className="grid-2" style={{ alignItems: 'start', gap: 'var(--space-md)' }}>
        {/* TASK PERFORMANCE Card */}
        {widgetSettings.task && (
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} color="var(--accent-primary)" /> TASK PERFORMANCE
              </h3>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {taskPct}% Done
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalTasks}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Completed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{completedTasks}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pending</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{pendingTasks}</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* MONTHLY EXPENSES Card (ONLY Total Amount + Total Spent) */}
        {widgetSettings.expense && (
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} color="var(--accent-primary)" /> MONTHLY EXPENSES
              </h3>
              <span style={{ fontSize: '11px', fontWeight: '700', color: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {budgetPct}% Used
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-xs)', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalAmount.toLocaleString()}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Spent</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${budgetPct}%`, height: '100%', background: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* MEMORY PERFORMANCE Card */}
        {widgetSettings.memory && (
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={16} color="var(--accent-primary)" /> MEMORY PERFORMANCE
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-xs)', marginBottom: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Memories</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalMemories}</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved Facts</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{approvedMemories}</div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Explicit consent protection active.
            </p>
          </div>
        )}

        {/* HABIT TRACKER PERFORMANCE WIDGET */}
        {widgetSettings.habit && (
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--accent-primary)" /> HABIT TRACKER
              </h3>
              <Link to="/app/habits" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                View <ArrowRight size={12} />
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>This Week</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>Completed: {habitChecksDone} / {habitChecksTotal} ({habitPct}%)</span>
            </div>

            <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${habitPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Top Habit:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>Study & Skill Building — 82%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: PROGRESS & SUMMARY Card */}
      {widgetSettings.progress && (
        <div className="grid-2" style={{ alignItems: 'start', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-primary)" /> PROGRESS
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
              <span>Completion Index</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{taskPct}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--accent-primary)" /> SUMMARY
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
              Executive Performance: <strong>{completedTasks}</strong> tasks completed, <strong>₹{totalSpent.toLocaleString()}</strong> spent, and <strong>{totalMemories}</strong> AI memory facts saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
