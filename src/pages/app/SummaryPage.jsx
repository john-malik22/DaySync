import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { Clock, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { ErrorState } from '../../components/common/ErrorState';

export function SummaryPage() {
  const { tasks, expenses, errors, resourceLoading, fetchSummaries } = useLuna();
  const [tab, setTab] = useState('Daily');
  const [search, setSearch] = useState('');

  const summaryError = errors?.summaries || errors?.tasks || errors?.expenses;

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);

  const hasActivity = tasks.length > 0 || expenses.length > 0;

  return (
    <div className="page-container">
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title="Summary" onSearch={setSearch} />

      {/* Tab Selector */}
      <div className="scroll-row">
        {['Daily', 'Weekly', 'Monthly'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 16px', minHeight: '36px', fontSize: '13px' }}
          >
            {t}
          </button>
        ))}
      </div>

      {summaryError ? (
        <ErrorState
          title={summaryError.title}
          message={summaryError.message}
          onRetry={fetchSummaries}
          isRetrying={resourceLoading?.summaries}
        />
      ) : (
        <div className="glass-card animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              YOUR {tab.toUpperCase()} REPORT
            </span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '2px' }}>
              {tab === 'Daily' ? "Today's Overview" : tab === 'Weekly' ? "This Week's Overview" : 'Monthly Performance'}
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
              <Clock size={14} color="var(--accent-primary)" /> Tasks
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {tasks.length} Total
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pendingTasks} Pending</span>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
              <CheckCircle2 size={14} color="var(--accent-primary)" /> Status
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>{completedTasks} Done</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pendingTasks} pending</span>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
              <CreditCard size={14} color="var(--accent-warning)" /> Spending
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-warning)' }}>₹{totalSpent.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Logged Expenses</span>
          </div>
        </div>

        {/* Luna Executive Synthesis */}
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.5'
        }}>
          <strong style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={15} /> Luna Executive Synthesis:
          </strong>
          
          {!hasActivity ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              No activity logged yet. Add your tasks or record an expense, and Luna will automatically synthesize your performance reports!
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
      )}
    </div>
  );
}
