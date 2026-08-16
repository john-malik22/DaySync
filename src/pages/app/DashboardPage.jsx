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
      {/* Top Header Row — larger dashboard greeting */}
      <PageHeaderRow title={`Hello, ${firstName}`} onSearch={setSearch} titleStyle={{ fontSize: 'clamp(28px, 5vw, 40px)' }} />

      {/* Dashboard Widgets Grid */}
      <div className="dashboard-grid">
        {/* TASK PERFORMANCE Card */}
        {widgetSettings.task && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} color="var(--accent-primary)" /> TASK PERFORMANCE
              </h3>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
                {taskPct}% Done
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', textAlign: 'center' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--text-primary)' }}>{totalTasks}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Completed</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--accent-primary)' }}>{completedTasks}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--text-primary)' }}>{pendingTasks}</div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY EXPENSES Card */}
        {widgetSettings.expense && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="var(--accent-primary)" /> MONTHLY EXPENSES
              </h3>
              <span style={{ fontSize: '14px', fontWeight: '700', color: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
                {budgetPct}% Used
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)', textAlign: 'center' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalAmount.toLocaleString()}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Spent</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--accent-primary)' }}>₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${budgetPct}%`, height: '100%', background: budgetPct > 85 ? 'var(--accent-danger)' : 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* MEMORY PERFORMANCE Card */}
        {widgetSettings.memory && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '18px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} color="var(--accent-primary)" /> MEMORY PERFORMANCE
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Memories</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--text-primary)' }}>{totalMemories}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Approved Facts</div>
                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: 'var(--accent-primary)' }}>{approvedMemories}</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, marginTop: 'auto', paddingTop: '14px' }}>
              Explicit consent protection active.
            </p>
          </div>
        )}

        {/* HABIT TRACKER PERFORMANCE WIDGET */}
        {widgetSettings.habit && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent-primary)" /> HABIT TRACKER
              </h3>
              <Link to="/app/habits" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                View <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '15px' }}>
              <span style={{ color: 'var(--text-muted)' }}>This Week</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>Completed: {habitChecksDone} / {habitChecksTotal} ({habitPct}%)</span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${habitPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>

            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span>Top Habit:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>Study & Skill Building — 82%</strong>
            </div>
          </div>
        )}

        {/* PROGRESS Card */}
        {widgetSettings.progress && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '18px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="var(--accent-primary)" /> PROGRESS
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' }}>
              <span>Completion Index</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)' }}>{taskPct}%</span>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${taskPct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY Card */}
        {widgetSettings.progress && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '18px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-primary)" /> SUMMARY
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-secondary)', margin: 0, marginTop: 'auto' }}>
              Executive Performance: <strong>{completedTasks}</strong> tasks completed, <strong>₹{totalSpent.toLocaleString()}</strong> spent, and <strong>{totalMemories}</strong> AI memory facts saved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
