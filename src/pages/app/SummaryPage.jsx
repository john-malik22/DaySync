import React, { useState } from 'react';
import { Calendar, FileText, CheckCircle2, Clock, CreditCard, Sparkles } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function SummaryPage() {
  const { tasks, expenses } = useLuna();
  const [tab, setTab] = useState('Daily'); // 'Daily', 'Weekly', 'Monthly'

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);

  const hasActivity = tasks.length > 0 || expenses.length > 0;

  return (
    <div style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Everyday Summaries</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Synthesized reports of your activities, spending, and task completions.
        </p>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {['Daily', 'Weekly', 'Monthly'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
          >
            {t} Summary
          </button>
        ))}
      </div>

      {/* Summary Card Layout */}
      <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
              YOUR {tab.toUpperCase()} REPORT
            </span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>
              {tab === 'Daily' ? 'Today\'s Overview' : tab === 'Weekly' ? 'This Week\'s Overview' : 'Monthly Performance'}
            </h2>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <Clock size={14} color="var(--accent-primary)" /> Daily Agenda
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>
              {tasks.length > 0 ? `${tasks.length} Time Blocks` : '0 Scheduled'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Noticed Activity</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <CheckCircle2 size={14} color="var(--accent-success)" /> Tasks Status
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{completedTasks} Done</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pendingTasks} pending</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <CreditCard size={14} color="var(--accent-warning)" /> Spending
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>₹{totalSpent.toLocaleString()}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged Expenses</span>
          </div>
        </div>

        {/* AI Dynamic Executive Synthesis */}
        <div style={{
          padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glow)', fontSize: '0.94rem', lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={16} /> Luna Executive Synthesis:
          </strong>
          
          {!hasActivity ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              No activity logged yet. Add your tasks in Planner or record an expense, and Luna will automatically synthesize your daily, weekly, and monthly performance reports!
            </span>
          ) : (
            <span>
              {tab === 'Daily' && `Daily Overview: You have completed ${completedTasks} task(s) with ${pendingTasks} pending, and recorded ₹${totalSpent.toLocaleString()} in expenses today.`}
              {tab === 'Weekly' && `Weekly Performance: Across your active tasks, you completed ${completedTasks} task(s) and logged ₹${totalSpent.toLocaleString()} in spending this week.`}
              {tab === 'Monthly' && `Monthly Executive Report: Overall performance shows ${completedTasks} completed task(s) and ₹${totalSpent.toLocaleString()} total spent.`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
