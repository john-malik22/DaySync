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

export const formatDate = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    const fmt = localStorage.getItem('daysync_date_format') || 'DD MMM YYYY';
    if (fmt === 'DD/MM/YYYY') {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    }
    if (fmt === 'MM/DD/YYYY') {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${month}/${day}/${d.getFullYear()}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// Isolated Widget Error Boundary (Keeps fixed size on error)
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
          padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid var(--accent-danger)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', boxSizing: 'border-box'
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
export function TodayTasksWidget({ widgetSize = 'T' }) {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const allTasksToday = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const completedCount = allTasksToday.filter(t => t.completed).length;
  const pendingTasks = allTasksToday.filter(t => !t.completed);

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 4 : 2;
  const displayTasks = pendingTasks.slice(0, maxItems);
  const overflowCount = pendingTasks.length - displayTasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckSquare size={15} color="var(--accent-primary)" /> TODAY'S TASKS ({allTasksToday.length})
          </h3>
          <Link to="/app/task" aria-label="View all tasks" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>
          {completedCount} completed • {pendingTasks.length} pending
        </div>

        {pendingTasks.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            You're all caught up. 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayTasks.map(t => (
              <div key={t.id} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id, false)}
                    aria-label={`Mark task ${t.title} complete`}
                    style={{
                      width: '15px', height: '15px', borderRadius: '3px',
                      border: '2px solid var(--accent-primary)', background: 'transparent',
                      cursor: 'pointer', flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '6px' }}>
                  {t.dueTime || 'Today'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more task{overflowCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// 2. Upcoming Reminders Widget
export function UpcomingRemindersWidget({ widgetSize = 'T' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate >= todayStr);

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 4 : 2;
  const displayReminders = upcomingReminders.slice(0, maxItems);
  const overflowCount = upcomingReminders.length - displayReminders.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="var(--accent-primary)" /> REMINDERS ({upcomingReminders.length})
          </h3>
          <Link to="/app/task" aria-label="View all reminders" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {upcomingReminders.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No upcoming reminders.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayReminders.map(rem => (
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

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more
        </div>
      )}
    </div>
  );
}

// 3. Overdue Tasks Widget
export function OverdueTasksWidget({ widgetSize = 'T' }) {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 4 : 2;
  const displayTasks = overdueTasks.slice(0, maxItems);
  const overflowCount = overdueTasks.length - displayTasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ color: 'var(--accent-danger)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="var(--accent-danger)" /> OVERDUE ({overdueTasks.length})
          </h3>
          <Link to="/app/task" aria-label="View all tasks" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-danger)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {overdueTasks.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No overdue tasks! 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayTasks.map(task => (
              <div key={task.id} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--accent-danger)' }}>Due: {formatDate(task.dueDate)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id, false)}
                  className="btn-secondary"
                  style={{ fontSize: '10px', padding: '3px 7px', flexShrink: 0, marginLeft: '6px' }}
                  aria-label={`Done with ${task.title}`}
                >
                  Done
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--accent-danger)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more overdue
        </div>
      )}
    </div>
  );
}

// 4. Upcoming Plans Widget
export function UpcomingPlansWidget({ widgetSize = 'T' }) {
  const { plans } = useLuna();
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled');

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 3 : 2;
  const displayPlans = activePlans.slice(0, maxItems);
  const overflowCount = activePlans.length - displayPlans.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Repeat size={15} color="var(--accent-primary)" /> UPCOMING PLANS ({activePlans.length})
          </h3>
          <Link to="/app/plans" aria-label="View plans page" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            View Plans <ArrowRight size={12} />
          </Link>
        </div>

        {activePlans.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No active plans.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayPlans.map(plan => (
              <div key={plan.id} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.name || plan.title}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>₹{plan.amount || 0} • {plan.nextDueDate ? formatDate(plan.nextDueDate) : 'Active'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more plan{overflowCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// 5. Birthdays & Meetings Widget
export function BirthdaysMeetingsWidget({ widgetSize = 'T' }) {
  const { tasks } = useLuna();
  const lifeEvents = (tasks || []).filter(t => t.category === 'LIFE' || t.category === 'Meeting' || (t.title && t.title.toLowerCase().includes('birthday')));

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 4 : 2;
  const displayEvents = lifeEvents.slice(0, maxItems);
  const overflowCount = lifeEvents.length - displayEvents.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cake size={15} color="var(--accent-primary)" /> BIRTHDAYS & MEETINGS ({lifeEvents.length})
          </h3>
        </div>

        {lifeEvents.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No upcoming events.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayEvents.map(evt => (
              <div key={evt.id} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(evt.dueDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more
        </div>
      )}
    </div>
  );
}

// 6. Spending Snapshot Widget (Fixed height adapt: S shows summary, W shows Spent/Received/Net, T/L adds breakdown)
export function SpendingSnapshotWidget({ widgetSize = 'W' }) {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalReceived = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netBalance = totalReceived - totalSpent;
  const todaySpent = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wallet size={15} color="var(--accent-primary)" /> SPENDING SNAPSHOT
        </h3>
        <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Expenses <ArrowRight size={12} />
        </Link>
      </div>

      {widgetSize === 'S' ? (
        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Spent</span>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-danger)', marginTop: '2px' }}>
            ₹{totalSpent.toLocaleString()}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Spent</span>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-danger)', marginTop: '2px' }}>
              ₹{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Received</span>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '2px' }}>
              ₹{totalReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Net</span>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', marginTop: '2px' }}>
              {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
        <span>Today: <strong>₹{todaySpent.toLocaleString()} spent</strong></span>
      </div>
    </div>
  );
}

// 7. Monthly Expenses Widget
export function MonthlyExpensesWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = (expenses || []).filter(e => {
    if (!e.date || e.type === 'income') return false;
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <DollarSign size={15} color="var(--accent-primary)" />
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Monthly Expenses</span>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
        ₹{monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>This month</span>
    </div>
  );
}

// 8. Today's Spending Widget
export function TodaySpendingWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTotal = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TrendingUp size={15} color="var(--accent-primary)" />
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Today's Spending</span>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
        ₹{todayTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Logged today</span>
    </div>
  );
}

// 9. Habit Streak Widget
export function HabitStreakWidget({ widgetSize = 'S' }) {
  const { habits } = useLuna();
  const maxStreak = (habits || []).reduce((max, h) => Math.max(max, h.streak || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', textAlign: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Flame size={16} color="var(--accent-warning)" />
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Habit Streak</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-warning)' }}>
        {maxStreak} Days
      </div>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Top active streak</span>
    </div>
  );
}

// 10. Luna Suggestion Widget (Luna Focus Insight)
export function LunaSuggestionWidget({ widgetSize = 'W' }) {
  const { suggestion, resourceLoading, fetchSuggestion } = useLuna();

  useEffect(() => {
    window.__daysync_refetchSuggestion = fetchSuggestion;
    return () => {
      delete window.__daysync_refetchSuggestion;
    };
  }, [fetchSuggestion]);

  if (resourceLoading?.suggestion && !suggestion) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--accent-primary)" />
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, fontWeight: '700' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--accent-primary)" />
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, fontWeight: '700' }}>
            LUNA FOCUS INSIGHT
          </h3>
        </div>
        <Link to="/app/task" aria-label="Open Tasks" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Tasks <ArrowRight size={12} />
        </Link>
      </div>

      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {insightText ? (
          <>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.35', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: widgetSize === 'S' ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {insightText}
            </div>
            {whyText && widgetSize !== 'S' && (
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {whyText}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No focus insight available yet.
          </div>
        )}
      </div>
    </div>
  );
}

// 11. Ask Luna Quick Action Widget
export function AskLunaWidget({ widgetSize = 'W' }) {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    navigate('/app/chat', { state: { initialMessage: msg.trim() } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MessageSquare size={15} color="var(--accent-primary)" />
        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Ask Luna AI</span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="Ask anything..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          aria-label="Message Luna AI"
          style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
        <button type="submit" className="btn-primary" aria-label="Send message to Luna" style={{ padding: '6px 10px' }}>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

// 12. Unread Notifications Widget
export function UnreadNotificationsWidget({ widgetSize = 'S' }) {
  const { unreadCount } = useNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={15} color="var(--accent-primary)" />
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</span>
        </div>
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: (unreadCount || 0) > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
        {unreadCount || 0} Unread
      </div>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>System Alerts</span>
    </div>
  );
}

// 13. Habit Tracker Widget
export function HabitTrackerWidget({ widgetSize = 'S' }) {
  const { habits, toggleHabit } = useLuna();
  const allHabits = habits || [];
  const completedToday = allHabits.filter(h => h.completedToday).length;
  const maxStreak = allHabits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 3 : 2;
  const displayHabits = allHabits.slice(0, maxItems);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} color="var(--accent-primary)" /> HABITS ({allHabits.length})
          </h3>
          <Link to="/app/habits" aria-label="Habits page" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            Habits <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
          {completedToday} / {allHabits.length} completed • 🔥 {maxStreak}d streak
        </div>

        {allHabits.length === 0 ? (
          <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No active habits.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {displayHabits.map(habit => (
              <div key={habit.id} style={{
                padding: '5px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.title}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className="btn-secondary"
                  aria-label={`Toggle habit ${habit.title}`}
                  style={{ fontSize: '10px', padding: '2px 6px', flexShrink: 0, marginLeft: '6px' }}
                >
                  Toggle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 14. Recent Expenses Widget
export function RecentExpensesWidget({ widgetSize = 'T' }) {
  const { expenses } = useLuna();
  const recentExps = (expenses || []);

  const maxItems = widgetSize === 'S' ? 1 : widgetSize === 'W' ? 1 : widgetSize === 'L' ? 4 : 3;
  const displayExpenses = recentExps.slice(0, maxItems);
  const overflowCount = recentExps.length - displayExpenses.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={15} color="var(--accent-primary)" /> RECENT EXPENSES ({recentExps.length})
          </h3>
          <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {recentExps.length === 0 ? (
          <div style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            No recent expenses.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayExpenses.map(exp => (
              <div key={exp.id} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.description || exp.title}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(exp.date)}</div>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: exp.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)', flexShrink: 0, marginLeft: '6px' }}>
                  {exp.type === 'income' ? '+' : '-'}₹{exp.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {overflowCount > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '4px' }}>
          +{overflowCount} more expense{overflowCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// 15. Quick Add Shortcuts Widget
export function QuickAddWidget({ widgetSize = 'S' }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>SHORTCUTS</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate('/app/task')} className="btn-primary" aria-label="Add new task" style={{ flex: 1, padding: '6px 8px', fontSize: '10.5px', justifyContent: 'center' }}>
          <Plus size={12} /> Task
        </button>
        <button type="button" onClick={() => navigate('/app/expenses')} className="btn-secondary" aria-label="Add new expense" style={{ flex: 1, padding: '6px 8px', fontSize: '10.5px', justifyContent: 'center' }}>
          <Plus size={12} /> Expense
        </button>
      </div>
    </div>
  );
}

// 16. Clock & Date Widget
export function ClockDateWidget({ widgetSize = 'S' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '2px' }}>
        {dateStr}
      </div>
    </div>
  );
}

// 17. Split Balances Summary Widget
export function SplitBalancesWidget({ widgetSize = 'S' }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} color="var(--accent-primary)" />
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Shared Splits</span>
        </div>
        <Link to="/app/splits" aria-label="Splits page" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Splits <ArrowRight size={12} />
        </Link>
      </div>

      {firstSplit ? (
        <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstSplit.name}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{firstSplit.members?.length || 1} members</div>
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--accent-primary)', flexShrink: 0 }}>Active</span>
        </div>
      ) : (
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Active Splits: <strong style={{ color: 'var(--text-primary)' }}>{splits.length}</strong>
        </div>
      )}
    </div>
  );
}

// Main Widget Component Switcher with Isolated Fixed-Height Error Boundaries
export function renderWidgetById(id, widgetSize = 'W') {
  switch (id) {
    case 'today_tasks':
      return <WidgetErrorBoundary title="Today's Tasks"><TodayTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_reminders':
      return <WidgetErrorBoundary title="Upcoming Reminders"><UpcomingRemindersWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'overdue_tasks':
      return <WidgetErrorBoundary title="Overdue Tasks"><OverdueTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_plans':
    case 'active_plans':
      return <WidgetErrorBoundary title="Upcoming Plans"><UpcomingPlansWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'birthdays_meetings':
    case 'upcoming_birthdays':
    case 'upcoming_meetings':
      return <WidgetErrorBoundary title="Birthdays & Meetings"><BirthdaysMeetingsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'spending_snapshot':
      return <WidgetErrorBoundary title="Spending Snapshot"><SpendingSnapshotWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'monthly_expenses':
      return <WidgetErrorBoundary title="Monthly Expenses"><MonthlyExpensesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'today_spending':
      return <WidgetErrorBoundary title="Today's Spending"><TodaySpendingWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'habit_streak':
      return <WidgetErrorBoundary title="Habit Streak"><HabitStreakWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'luna_suggestion':
      return (
        <WidgetErrorBoundary title="Luna Focus Insight" onRetry={() => window.__daysync_refetchSuggestion && window.__daysync_refetchSuggestion()}>
          <LunaSuggestionWidget widgetSize={widgetSize} />
        </WidgetErrorBoundary>
      );
    case 'ask_luna':
      return <WidgetErrorBoundary title="Ask Luna AI"><AskLunaWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'unread_notifications':
      return <WidgetErrorBoundary title="Notifications Alert"><UnreadNotificationsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'today_habits':
    case 'weekly_habits':
      return <WidgetErrorBoundary title="Habit Tracker"><HabitTrackerWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'recent_expenses':
      return <WidgetErrorBoundary title="Recent Expenses"><RecentExpensesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'quick_add':
      return <WidgetErrorBoundary title="Quick Action Shortcuts"><QuickAddWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'clock_date':
    case 'today_date':
      return <WidgetErrorBoundary title="Clock & Date"><ClockDateWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'split_balances':
    case 'active_splits':
      return <WidgetErrorBoundary title="Shared Splits"><SplitBalancesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Widget [{id}]</div>;
  }
}
