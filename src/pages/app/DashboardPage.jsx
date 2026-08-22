import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CreditCard, Brain, CheckCircle2, Sparkles, Activity, ArrowRight, Wallet, Edit2, Check, X } from 'lucide-react';

export function DashboardPage() {
  const { tasks, expenses, memories, routines, startingBalance, updateStartingBalance } = useLuna();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const handleSaveAmount = (e) => {
    e.preventDefault();
    if (!inputAmount) return;
    updateStartingBalance(inputAmount);
    setIsEditingAmount(false);
  };

  const handleStartEdit = () => {
    setInputAmount(startingBalance !== null ? startingBalance.toString() : '');
    setIsEditingAmount(true);
  };

  const handleCancelEdit = () => {
    setIsEditingAmount(false);
  };

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

  // Financial Balance Metrics (Starting Amount + Total Received - Total Spent)
  const totalReceived = expenses.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
  const currentBalance = (startingBalance !== null ? startingBalance : 0) + totalReceived - totalSpent;

  const formattedBalance = currentBalance >= 0 
    ? `+₹${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `-₹${Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formattedSpent = `-₹${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedReceived = `+₹${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Memory Performance Metrics
  const totalMemories = memories.length;
  const approvedMemories = memories.filter(m => m.approved).length;

  // Habit Tracker Performance Metrics (Derived from saved habits or routines)
  const userHabits = (() => {
    try {
      const saved = localStorage.getItem('daysync_habits');
      return saved ? JSON.parse(saved) : (routines || []);
    } catch (e) {
      return routines || [];
    }
  })();
  const totalHabitCount = userHabits.length;
  const habitChecksDone = 0;
  const habitChecksTotal = totalHabitCount * 7;
  const habitPct = habitChecksTotal > 0 ? Math.round((habitChecksDone / habitChecksTotal) * 100) : 0;
  const topHabitTitle = totalHabitCount > 0 ? userHabits[0].title : 'None';

  return (
    <div className="page-container">
      {/* Top Header Row — larger dashboard greeting */}
      <PageHeaderRow title={`Hii, ${firstName}`} onSearch={setSearch} titleStyle={{ fontSize: 'clamp(28px, 5vw, 40px)' }} />

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

        {/* FINANCIAL SUMMARY / TOTAL BALANCE Card */}
        {widgetSettings.expense && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Wallet size={20} color="var(--accent-primary)" /> TOTAL BALANCE
            </h3>

            {/* Account Amount Form or Balance Display */}
            {startingBalance === null || isEditingAmount ? (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                  {startingBalance === null ? 'Starting Account Balance not set' : 'Starting Account Balance'}
                </div>
                <form onSubmit={handleSaveAmount} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 50000)"
                    min="0"
                    step="any"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    required
                    style={{ flex: 1, minHeight: '36px', fontSize: '13px', padding: '4px 10px', minWidth: 0 }}
                  />
                  <button type="submit" className="btn-primary" title="Save" style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px', flexShrink: 0 }}>
                    <Check size={14} /> Save
                  </button>
                  {isEditingAmount && startingBalance !== null && (
                    <button type="button" onClick={handleCancelEdit} className="btn-secondary" title="Cancel" style={{ minHeight: '36px', padding: '0 8px', fontSize: '13px', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  )}
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Wallet size={22} color="var(--accent-primary)" />
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: '800', color: currentBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {formattedBalance}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  title="Edit Total Account Amount"
                  style={{
                    padding: '6px', width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)', background: 'transparent',
                    border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-xs)', textAlign: 'center' }}>
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>SPENT</div>
                  <div style={{ fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', fontWeight: '800', color: 'var(--accent-danger)' }}>{formattedSpent}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>RECEIVED</div>
                  <div style={{ fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', fontWeight: '800', color: 'var(--accent-success)' }}>{formattedReceived}</div>
                </div>
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
              <strong style={{ color: 'var(--accent-primary)' }}>{topHabitTitle}</strong>
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
