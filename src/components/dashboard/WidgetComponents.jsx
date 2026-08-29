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
  TrendingDown,
  Target,
  Zap,
  Award
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

// 1. Today's Tasks Widget (S=1 top priority task, W/T/L=multi-task list)
export function TodayTasksWidget({ widgetSize = 'T' }) {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const allTasksToday = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const completedCount = allTasksToday.filter(t => t.completed).length;
  const pendingTasks = allTasksToday.filter(t => !t.completed);

  // Highest priority task first: High > Medium > Low
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  const sortedPending = [...pendingTasks].sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
  const topTask = sortedPending[0];

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Today's Task
        </div>
        {topTask ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topTask.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px',
                background: topTask.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)',
                color: topTask.priority === 'High' ? 'var(--accent-danger)' : 'var(--text-secondary)'
              }}>
                {topTask.priority || 'Task'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{topTask.dueTime || 'Today'}</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No tasks for today. 🎉
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayTasks = pendingTasks.slice(0, maxItems);
  const overflowCount = pendingTasks.length - displayTasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '2px' }}>
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
  const nextReminder = upcomingReminders[0];

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Reminder
        </div>
        {nextReminder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextReminder.title}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', fontWeight: '600' }}>
              {nextReminder.dueTime || (nextReminder.dueDate === todayStr ? 'Today' : formatDate(nextReminder.dueDate))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No reminder.
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayReminders = upcomingReminders.slice(0, maxItems);
  const overflowCount = upcomingReminders.length - displayReminders.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '2px' }}>
          +{overflowCount} more
        </div>
      )}
    </div>
  );
}

// 3. Overdue Tasks Widget
export function OverdueTasksWidget({ widgetSize = 'T' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  const topOverdue = overdueTasks[0];

  if (widgetSize === 'S') {
    const calculateOverdueDays = (dueDateStr) => {
      if (!dueDateStr) return 'Overdue';
      const diffTime = Math.abs(new Date(todayStr) - new Date(dueDateStr));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Overdue Task
        </div>
        {topOverdue ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topOverdue.title}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--accent-danger)', fontWeight: '700' }}>
              {calculateOverdueDays(topOverdue.dueDate)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No overdue task! 🎉
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayTasks = overdueTasks.slice(0, maxItems);
  const overflowCount = overdueTasks.length - displayTasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--accent-danger)', textAlign: 'right', paddingTop: '2px' }}>
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
  const todayStr = new Date().toISOString().split('T')[0];

  // Expiring soonest plan
  const sortedPlans = [...activePlans].sort((a, b) => new Date(a.nextDueDate || '9999-12-31') - new Date(b.nextDueDate || '9999-12-31'));
  const nearestPlan = sortedPlans[0];

  if (widgetSize === 'S') {
    const calculateDaysLeft = (dueDateStr) => {
      if (!dueDateStr) return 'Active';
      const diffTime = new Date(dueDateStr) - new Date(todayStr);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Expired';
      if (diffDays === 0) return 'Expires today';
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Upcoming Plan
        </div>
        {nearestPlan ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nearestPlan.name || nearestPlan.title}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', fontWeight: '700' }}>
              {calculateDaysLeft(nearestPlan.nextDueDate)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No upcoming plan.
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayPlans = activePlans.slice(0, maxItems);
  const overflowCount = activePlans.length - displayPlans.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '2px' }}>
          +{overflowCount} more plan{overflowCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// 5. Birthdays & Events Widget
export function BirthdaysMeetingsWidget({ widgetSize = 'T' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const birthdays = (tasks || []).filter(t => (t.category === 'LIFE' || (t.title && t.title.toLowerCase().includes('birthday'))) && !t.completed);
  const nextBirthday = birthdays[0];

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Upcoming Birthday
        </div>
        {nextBirthday ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextBirthday.title}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', fontWeight: '700' }}>
              {nextBirthday.dueDate === todayStr ? 'Today' : formatDate(nextBirthday.dueDate)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No upcoming birthday.
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayEvents = birthdays.slice(0, maxItems);
  const overflowCount = birthdays.length - displayEvents.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '2px' }}>
          +{overflowCount} more
        </div>
      )}
    </div>
  );
}

// 6. Spending Snapshot Widget (S=1 value, W=vertical stack, T=horizontal grid, L=full overview)
export function SpendingSnapshotWidget({ widgetSize = 'W' }) {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalReceived = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netBalance = totalReceived - totalSpent;
  const todaySpent = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: widgetSize === 'T' || widgetSize === 'L' ? '1fr 1fr 1fr' : '1fr', gap: '6px' }}>
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

      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Monthly Spent
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
          ₹{monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', alignItems: 'center' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
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

      <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        {insightText ? (
          <>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '600' }}>
              {insightText}
            </div>
            {whyText && widgetSize !== 'S' && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
  const { notifications, unreadCount } = useNotifications();
  const latestNotification = (notifications || [])[0];

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Notification
        </div>
        {latestNotification ? (
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
            {latestNotification.message || latestNotification.title}
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No notification.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
  const { habits } = useLuna();
  const allHabits = habits || [];
  const completedToday = allHabits.filter(h => h.completedToday).length;
  const progressPct = allHabits.length > 0 ? Math.round((completedToday / allHabits.length) * 100) : 0;

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Habit Progress
        </div>
        {allHabits.length > 0 ? (
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
            {progressPct}%
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No habits yet.
          </div>
        )}
      </div>
    );
  }

  const maxStreak = allHabits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayHabits = allHabits.slice(0, maxItems);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
  const spentExpenses = (expenses || []).filter(e => e && e.type !== 'income');
  const latestSpent = spentExpenses[0];

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Recent Expense
        </div>
        {latestSpent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {latestSpent.description || latestSpent.title}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-danger)' }}>
              -₹{parseFloat(latestSpent.amount || 0).toLocaleString()}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No recent expenses.
          </div>
        )}
      </div>
    );
  }

  const maxItems = widgetSize === 'W' ? 2 : widgetSize === 'T' ? 3 : 4;
  const displayExpenses = spentExpenses.slice(0, maxItems);
  const overflowCount = spentExpenses.length - displayExpenses.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingTop: '2px' }}>
          +{overflowCount} more expense{overflowCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// 15. Quick Add Shortcuts Widget
export function QuickAddWidget({ widgetSize = 'S' }) {
  const navigate = useNavigate();

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Shortcut
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/task')}
          className="btn-primary"
          aria-label="Add new task"
          style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', justifyContent: 'center', fontWeight: '700' }}
        >
          <Plus size={13} /> Add Task
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '4px' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
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
    return (
      <div style={{ fontSize: '11.5px', color: 'var(--accent-danger)' }}>
        Couldn't load splits.
      </div>
    );
  }

  const owedTotal = splits.reduce((acc, s) => acc + (parseFloat(s.owedToYou || 0)), 0);
  const payTotal = splits.reduce((acc, s) => acc + (parseFloat(s.youOwe || 0)), 0);

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Shared Splits
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
            <span style={{ color: 'var(--text-muted)' }}>Owed:</span>
            <span style={{ color: 'var(--accent-success)' }}>₹{owedTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
            <span style={{ color: 'var(--text-muted)' }}>Pay:</span>
            <span style={{ color: 'var(--accent-danger)' }}>₹{payTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  const firstSplit = splits[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

// 18. Account Balance Widget (Net = Starting Balance + Received - Spent)
export function AccountBalanceWidget({ widgetSize = 'S' }) {
  const { expenses, startingBalance } = useLuna();
  const totalSpent = (expenses || []).filter(e => e && e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalReceived = (expenses || []).filter(e => e && e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const currentBalance = (startingBalance !== null ? startingBalance : 0) + totalReceived - totalSpent;

  if (widgetSize === 'S') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Total Balance
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
          {currentBalance >= 0 ? '+' : ''}₹{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Wallet size={15} color="var(--accent-primary)" />
        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Account Balance</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
        {currentBalance >= 0 ? '+' : ''}₹{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
        <span>Received: +₹{totalReceived.toLocaleString()}</span>
        <span>Spent: -₹{totalSpent.toLocaleString()}</span>
      </div>
    </div>
  );
}

// 19. Daily Progress Widget
export function DailyProgressWidget({ widgetSize = 'S' }) {
  const { tasks, habits } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const completedTasks = todayTasks.filter(t => t.completed).length;

  const allHabits = habits || [];
  const completedHabits = allHabits.filter(h => h.completedToday).length;

  const totalItems = todayTasks.length + allHabits.length;
  const completedItems = completedTasks + completedHabits;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Target size={15} color="var(--accent-primary)" />
        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Daily Progress</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
        {progressPct}% Done
      </div>
      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
        Tasks: {completedTasks}/{todayTasks.length} • Habits: {completedHabits}/{allHabits.length}
      </div>
    </div>
  );
}

// 20. Next Important Item / Important Person Splits Widget
export function NextImportantItemWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const [splits, setSplits] = useState([]);

  useEffect(() => {
    api.getSplits()
      .then(res => setSplits(Array.isArray(res) ? res : []))
      .catch(() => setSplits([]));
  }, []);

  const owedSplit = splits.find(s => parseFloat(s.owedToYou || 0) > 0);
  const pendingTasks = (tasks || []).filter(t => !t.completed);
  const pendingHigh = pendingTasks.filter(t => t.priority === 'High');
  const nextItem = pendingHigh.length > 0 ? pendingHigh[pendingHigh.length - 1] : pendingTasks[0];

  if (widgetSize === 'S') {
    if (owedSplit) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {owedSplit.personName || owedSplit.name || 'Important Person'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Owes you</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-success)' }}>
              ₹{parseFloat(owedSplit.owedToYou || 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Next Important
        </div>
        {nextItem ? (
          <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nextItem.title}
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            No pending items.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={15} color="var(--accent-warning)" />
        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Next Important</span>
      </div>

      {nextItem ? (
        <div style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nextItem.title}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {nextItem.dueDate ? formatDate(nextItem.dueDate) : 'Today'} {nextItem.dueTime ? `• ${nextItem.dueTime}` : ''}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          No pending items.
        </div>
      )}
    </div>
  );
}

// Centralized Layout-Design Flag: Set to true to render active widget content inside cards
export const SHOW_WIDGET_CONTENT = true;


// Main Widget Component Switcher with Isolated Fixed-Height Error Boundaries
export function renderWidgetById(id, widgetSize = 'W') {
  if (!SHOW_WIDGET_CONTENT) {
    return null;
  }

  switch (id) {
    case 'today_tasks':
      return <WidgetErrorBoundary title="Today's Tasks"><TodayTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_reminders':
      return <WidgetErrorBoundary title="Upcoming Reminders"><UpcomingRemindersWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'overdue_tasks':
      return <WidgetErrorBoundary title="Overdue Tasks"><OverdueTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_plans':
    case 'active_plans':
    case 'monthly_plan_cost':
    case 'plan_expiry_countdown':
      return <WidgetErrorBoundary title="Upcoming Plans"><UpcomingPlansWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'birthdays_meetings':
    case 'upcoming_birthdays':
      return <WidgetErrorBoundary title="Birthdays & Meetings"><BirthdaysMeetingsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'spending_snapshot':
    case 'expense_breakdown':
    case 'remaining_budget':
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
    case 'upcoming_meetings':
      return <WidgetErrorBoundary title="Upcoming Meetings"><BirthdaysMeetingsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'account_balance':
      return <WidgetErrorBoundary title="Account Balance"><AccountBalanceWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'daily_progress':
      return <WidgetErrorBoundary title="Daily Progress"><DailyProgressWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'next_important_item':
      return <WidgetErrorBoundary title="Next Important Item"><NextImportantItemWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'split_balances':
    case 'active_splits':
      return <WidgetErrorBoundary title="Shared Splits"><SplitBalancesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Widget [{id}]</div>;
  }
}
