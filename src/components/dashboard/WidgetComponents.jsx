import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Repeat,
  Cake,
  Users,
  Wallet,
  Sparkles,
  Bell,
  Activity,
  CreditCard,
  PlusCircle,
  Calendar,
  ArrowRight,
  Plus,
  TrendingUp,
  PieChart,
  MessageSquare,
  DollarSign,
  Flame,
  Briefcase,
  Layers,
  Send,
  RotateCcw,
  TrendingDown
} from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// Isolated Widget Error Boundary
export class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[WidgetErrorBoundary] Caught runtime exception in widget:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid var(--accent-danger)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '90px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {this.props.title || 'Widget'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--accent-danger)', marginBottom: '10px' }}>
            Couldn't load this widget.
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 1. Today's Tasks Widget
export function TodayTasksWidget() {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const allTasksToday = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const completedCount = allTasksToday.filter(t => t.completed).length;
  const pendingTasks = allTasksToday.filter(t => !t.completed);
  const nextTask = pendingTasks.find(t => t.priority === 'High') || pendingTasks[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={16} color="var(--accent-primary)" /> TODAY'S TASKS ({allTasksToday.length})
        </h3>
        <Link to="/app/task" aria-label="View all tasks" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View All <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
        {completedCount} completed • {pendingTasks.length} pending
      </div>

      {pendingTasks.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          You're all caught up. 🎉
        </div>
      ) : (
        <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Next Task</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <button
                type="button"
                onClick={() => toggleTask(nextTask.id, false)}
                aria-label={`Mark task ${nextTask.title} complete`}
                style={{
                  width: '16px', height: '16px', borderRadius: '4px',
                  border: '2px solid var(--accent-primary)', background: 'transparent',
                  cursor: 'pointer', flexShrink: 0
                }}
              />
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nextTask.title}
              </span>
            </div>
            <span className="badge" style={{ fontSize: '10px', background: nextTask.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)', color: nextTask.priority === 'High' ? 'var(--accent-danger)' : 'var(--text-secondary)', flexShrink: 0 }}>
              {nextTask.dueTime || 'Today'} • {nextTask.priority || 'Normal'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Upcoming Reminders Widget
export function UpcomingRemindersWidget() {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate >= todayStr).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--accent-primary)" /> UPCOMING REMINDERS ({upcomingReminders.length})
        </h3>
        <Link to="/app/task" aria-label="View all reminders" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {upcomingReminders.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No upcoming reminders scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {upcomingReminders.map(rem => (
            <div key={rem.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rem.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{rem.dueDate === todayStr ? 'Today' : formatDate(rem.dueDate)} {rem.dueTime ? `• ${rem.dueTime}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 3. Overdue Tasks Widget
export function OverdueTasksWidget() {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-danger)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="var(--accent-danger)" /> OVERDUE TASKS ({overdueTasks.length})
        </h3>
      </div>

      {overdueTasks.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No overdue tasks! Everything is up to date. 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {overdueTasks.slice(0, 3).map(task => (
            <div key={task.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{task.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--accent-danger)' }}>Due: {formatDate(task.dueDate)}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleTask(task.id, false)}
                className="btn-secondary"
                style={{ fontSize: '10.5px', padding: '3px 8px' }}
                aria-label={`Done with ${task.title}`}
              >
                Done
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. Upcoming Plans Widget
export function UpcomingPlansWidget() {
  const { plans } = useLuna();
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={16} color="var(--accent-primary)" /> UPCOMING PLANS ({activePlans.length})
        </h3>
        <Link to="/app/plans" aria-label="View plans page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Plans <ArrowRight size={13} />
        </Link>
      </div>

      {activePlans.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No active subscriptions or plans.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activePlans.map(plan => (
            <div key={plan.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{plan.name || plan.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{plan.amount || 0} / {plan.billingCycle || 'month'}</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-tertiary)' }}>
                {plan.nextDueDate ? `Next: ${formatDate(plan.nextDueDate)}` : 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 5. Birthdays & Meetings Widget
export function BirthdaysMeetingsWidget() {
  const { tasks } = useLuna();
  const lifeEvents = (tasks || []).filter(t => t.category === 'LIFE' || t.category === 'Meeting' || (t.title && t.title.toLowerCase().includes('birthday'))).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cake size={16} color="var(--accent-primary)" /> BIRTHDAYS & MEETINGS ({lifeEvents.length})
        </h3>
      </div>

      {lifeEvents.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No upcoming birthdays or meetings.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {lifeEvents.map(evt => (
            <div key={evt.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{evt.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(evt.dueDate)}</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(108, 99, 255, 0.15)', color: 'var(--accent-primary)' }}>Event</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 6. Spending Snapshot Widget (Main values: Spent, Received, Net + Today's detail)
export function SpendingSnapshotWidget() {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalReceived = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netBalance = totalReceived - totalSpent;

  const todaySpent = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} color="var(--accent-primary)" /> SPENDING SNAPSHOT
        </h3>
        <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Expenses <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Spent</span>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-danger)', marginTop: '2px' }}>
            ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Received</span>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '2px' }}>
            ₹{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net</span>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', marginTop: '2px' }}>
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
        <span>Today: <strong>₹{todaySpent.toLocaleString()} spent</strong></span>
      </div>
    </div>
  );
}

// 7. Monthly Expenses Widget
export function MonthlyExpensesWidget() {
  const { expenses } = useLuna();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = (expenses || []).filter(e => {
    if (!e.date || e.type === 'income') return false;
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Monthly Expenses</span>
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
        ₹{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This calendar month</span>
    </div>
  );
}

// 8. Today's Spending Widget
export function TodaySpendingWidget() {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTotal = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Today's Spending</span>
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
        ₹{todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Logged today</span>
    </div>
  );
}

// 9. Habit Streak Widget
export function HabitStreakWidget() {
  const { habits } = useLuna();
  const maxStreak = (habits || []).reduce((max, h) => Math.max(max, h.streak || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Flame size={18} color="var(--accent-warning)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Habit Streak</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-warning)' }}>
        {maxStreak} Days
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top active streak</span>
    </div>
  );
}

// 10. Luna Suggestion Widget (Luna Focus Insight)
export function LunaSuggestionWidget() {
  const { suggestion, resourceLoading, fetchSuggestion } = useLuna();

  useEffect(() => {
    window.__daysync_refetchSuggestion = fetchSuggestion;
    return () => {
      delete window.__daysync_refetchSuggestion;
    };
  }, [fetchSuggestion]);

  if (resourceLoading?.suggestion && !suggestion) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, fontWeight: '700' }}>
            LUNA FOCUS INSIGHT
          </h3>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Analyzing daily focus insights...
        </div>
      </div>
    );
  }

  const insightText = typeof suggestion === 'string'
    ? suggestion
    : (suggestion?.recommendation || suggestion?.text || suggestion?.message || null);

  const whyText = typeof suggestion === 'object' ? suggestion?.why : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, fontWeight: '700' }}>
            LUNA FOCUS INSIGHT
          </h3>
        </div>
        <Link to="/app/task" aria-label="Open Tasks" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Open Tasks <ArrowRight size={12} />
        </Link>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {insightText ? (
          <>
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '600' }}>
              {insightText}
            </div>
            {whyText && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {whyText}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            No focus insight available yet. Complete a few tasks or habits to generate a focus insight.
          </div>
        )}
      </div>
    </div>
  );
}

// 11. Ask Luna Quick Action Widget
export function AskLunaWidget() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    navigate('/app/chat', { state: { initialMessage: msg.trim() } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Ask Luna AI</span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="Ask anything or record a task..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          aria-label="Message Luna AI"
          style={{ flex: 1, padding: '7px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
        <button type="submit" className="btn-primary" aria-label="Send message to Luna" style={{ padding: '7px 12px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// 12. Unread Notifications Widget
export function UnreadNotificationsWidget() {
  const { unreadCount } = useNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</span>
        </div>
        <span className="badge" style={{ fontSize: '11px', background: (unreadCount || 0) > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: '#FFFFFF' }}>
          {unreadCount || 0} Unread
        </span>
      </div>
    </div>
  );
}

// 13. Habit Tracker Widget (3/5 completed • 🔥 7 day streak)
export function HabitTrackerWidget() {
  const { habits, toggleHabit } = useLuna();
  const allHabits = habits || [];
  const completedToday = allHabits.filter(h => h.completedToday).length;
  const maxStreak = allHabits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--accent-primary)" /> HABITS ({allHabits.length})
        </h3>
        <Link to="/app/habits" aria-label="Habits page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Habits <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
        {completedToday} / {allHabits.length} completed • 🔥 {maxStreak} day streak
      </div>

      {allHabits.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No habits created yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {allHabits.slice(0, 3).map(habit => (
            <div key={habit.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{habit.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Streak: {habit.streak || 0} days</div>
              </div>
              <button
                type="button"
                onClick={() => toggleHabit(habit.id)}
                className="btn-secondary"
                aria-label={`Toggle habit ${habit.title}`}
                style={{ fontSize: '10.5px', padding: '3px 8px' }}
              >
                Toggle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 14. Recent Expenses Widget
export function RecentExpensesWidget() {
  const { expenses } = useLuna();
  const recentExps = (expenses || []).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} color="var(--accent-primary)" /> RECENT EXPENSES ({recentExps.length})
        </h3>
        <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Expenses <ArrowRight size={13} />
        </Link>
      </div>

      {recentExps.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          No expenses logged yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recentExps.map(exp => (
            <div key={exp.id} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{exp.description || exp.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(exp.date)}</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: exp.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {exp.type === 'income' ? '+' : '-'}₹{exp.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 15. Quick Add Shortcuts Widget
export function QuickAddWidget() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>QUICK ACTION SHORTCUTS</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate('/app/task')} className="btn-primary" aria-label="Add new task" style={{ flex: 1, padding: '8px 10px', fontSize: '11px', justifyContent: 'center' }}>
          <Plus size={13} /> Task
        </button>
        <button type="button" onClick={() => navigate('/app/expenses')} className="btn-secondary" aria-label="Add new expense" style={{ flex: 1, padding: '8px 10px', fontSize: '11px', justifyContent: 'center' }}>
          <Plus size={13} /> Expense
        </button>
        <button type="button" onClick={() => navigate('/app/plans')} className="btn-secondary" aria-label="Add new plan" style={{ flex: 1, padding: '8px 10px', fontSize: '11px', justifyContent: 'center' }}>
          <Plus size={13} /> Plan
        </button>
      </div>
    </div>
  );
}

// 16. Clock & Date Widget
export function ClockDateWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '2px' }}>
        {dateStr}
      </div>
    </div>
  );
}

// 17. Split Balances Summary Widget
export function SplitBalancesWidget() {
  const [splits, setSplits] = useState([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    api.getSplits()
      .then(res => {
        setSplits(Array.isArray(res) ? res : []);
        setHasError(false);
      })
      .catch(() => setHasError(true));
  }, []);

  if (hasError) {
    throw new Error("Couldn't load Split Balances.");
  }

  const firstSplit = splits[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Shared Splits</span>
        </div>
        <Link to="/app/splits" aria-label="Splits page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Splits <ArrowRight size={13} />
        </Link>
      </div>

      {firstSplit ? (
        <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{firstSplit.name}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{firstSplit.members?.length || 1} members</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)' }}>Active</span>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Active Splits: <strong style={{ color: 'var(--text-primary)' }}>{splits.length}</strong>
        </div>
      )}
    </div>
  );
}

// Main Widget Component Switcher with Isolated Widget Error Boundaries
export function renderWidgetById(id) {
  switch (id) {
    case 'today_tasks':
      return <WidgetErrorBoundary title="Today's Tasks"><TodayTasksWidget /></WidgetErrorBoundary>;
    case 'upcoming_reminders':
      return <WidgetErrorBoundary title="Upcoming Reminders"><UpcomingRemindersWidget /></WidgetErrorBoundary>;
    case 'overdue_tasks':
      return <WidgetErrorBoundary title="Overdue Tasks"><OverdueTasksWidget /></WidgetErrorBoundary>;
    case 'upcoming_plans':
    case 'active_plans':
      return <WidgetErrorBoundary title="Upcoming Plans"><UpcomingPlansWidget /></WidgetErrorBoundary>;
    case 'birthdays_meetings':
    case 'upcoming_birthdays':
    case 'upcoming_meetings':
      return <WidgetErrorBoundary title="Birthdays & Meetings"><BirthdaysMeetingsWidget /></WidgetErrorBoundary>;
    case 'spending_snapshot':
      return <WidgetErrorBoundary title="Spending Snapshot"><SpendingSnapshotWidget /></WidgetErrorBoundary>;
    case 'monthly_expenses':
      return <WidgetErrorBoundary title="Monthly Expenses"><MonthlyExpensesWidget /></WidgetErrorBoundary>;
    case 'today_spending':
      return <WidgetErrorBoundary title="Today's Spending"><TodaySpendingWidget /></WidgetErrorBoundary>;
    case 'habit_streak':
      return <WidgetErrorBoundary title="Habit Streak"><HabitStreakWidget /></WidgetErrorBoundary>;
    case 'luna_suggestion':
      return (
        <WidgetErrorBoundary title="Luna Focus Insight" onRetry={() => window.__daysync_refetchSuggestion && window.__daysync_refetchSuggestion()}>
          <LunaSuggestionWidget />
        </WidgetErrorBoundary>
      );
    case 'ask_luna':
      return <WidgetErrorBoundary title="Ask Luna AI"><AskLunaWidget /></WidgetErrorBoundary>;
    case 'unread_notifications':
      return <WidgetErrorBoundary title="Notifications Alert"><UnreadNotificationsWidget /></WidgetErrorBoundary>;
    case 'today_habits':
    case 'weekly_habits':
      return <WidgetErrorBoundary title="Habit Tracker"><HabitTrackerWidget /></WidgetErrorBoundary>;
    case 'recent_expenses':
      return <WidgetErrorBoundary title="Recent Expenses"><RecentExpensesWidget /></WidgetErrorBoundary>;
    case 'quick_add':
      return <WidgetErrorBoundary title="Quick Action Shortcuts"><QuickAddWidget /></WidgetErrorBoundary>;
    case 'clock_date':
    case 'today_date':
      return <WidgetErrorBoundary title="Clock & Date"><ClockDateWidget /></WidgetErrorBoundary>;
    case 'split_balances':
    case 'active_splits':
      return <WidgetErrorBoundary title="Shared Splits"><SplitBalancesWidget /></WidgetErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Widget [{id}]</div>;
  }
}
