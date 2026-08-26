import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { useNotifications } from '../../context/NotificationContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
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
  Send
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

// 1. Today's Tasks Widget
export function TodayTasksWidget() {
  const { tasks, toggleTask } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={16} color="var(--accent-primary)" /> TODAY'S TASKS ({todayTasks.length})
        </h3>
        <Link to="/app/task" aria-label="View all tasks" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {todayTasks.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No pending tasks today. Great job! 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {todayTasks.slice(0, 5).map(task => (
            <div key={task.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id, false)}
                  aria-label={`Mark task ${task.title} complete`}
                  style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    border: '2px solid var(--accent-primary)', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.dueTime || 'Today'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Upcoming Reminders Widget
export function UpcomingRemindersWidget() {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate > todayStr).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--accent-primary)" /> UPCOMING REMINDERS ({upcomingReminders.length})
        </h3>
        <Link to="/app/task" aria-label="View all reminders" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Tasks <ArrowRight size={13} />
        </Link>
      </div>

      {upcomingReminders.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No upcoming reminders scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {upcomingReminders.map(rem => (
            <div key={rem.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{rem.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(rem.dueDate)}</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-tertiary)' }}>{rem.category || 'Reminder'}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-danger)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="var(--accent-danger)" /> OVERDUE TASKS ({overdueTasks.length})
        </h3>
      </div>

      {overdueTasks.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No overdue tasks! Everything is up to date. 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {overdueTasks.map(task => (
            <div key={task.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{task.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-danger)' }}>Due: {formatDate(task.dueDate)}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleTask(task.id, false)}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                aria-label={`Done with ${task.title}`}
              >
                Mark Done
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
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled').slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={16} color="var(--accent-primary)" /> UPCOMING PLANS ({activePlans.length})
        </h3>
        <Link to="/app/plans" aria-label="View plans page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Plans <ArrowRight size={13} />
        </Link>
      </div>

      {activePlans.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No active subscriptions or plans.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {activePlans.map(plan => (
            <div key={plan.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{plan.name || plan.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{plan.amount || 0} • {plan.billingCycle || 'Monthly'}</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-tertiary)' }}>
                {plan.nextDueDate ? formatDate(plan.nextDueDate) : 'Active'}
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
  const lifeEvents = (tasks || []).filter(t => t.category === 'LIFE' || t.category === 'Meeting' || t.title.toLowerCase().includes('birthday')).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cake size={16} color="var(--accent-primary)" /> BIRTHDAYS & MEETINGS ({lifeEvents.length})
        </h3>
      </div>

      {lifeEvents.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No upcoming birthdays or meetings scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {lifeEvents.map(evt => (
            <div key={evt.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{evt.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(evt.dueDate)}</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(108, 99, 255, 0.15)', color: 'var(--accent-primary)' }}>Event</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 6. Spending Snapshot Widget
export function SpendingSnapshotWidget() {
  const { expenses } = useLuna();
  const totalSpent = (expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} color="var(--accent-primary)" /> SPENDING SNAPSHOT
        </h3>
        <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Expenses <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Expenses Logged</span>
        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
          ₹{totalSpent.toLocaleString()}
        </div>
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
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <DollarSign size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Monthly Expenses</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
        ₹{monthlyTotal.toLocaleString()}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>This calendar month</span>
    </div>
  );
}

// 8. Today's Spending Widget
export function TodaySpendingWidget() {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTotal = (expenses || []).filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <TrendingUp size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Today's Spending</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
        ₹{todayTotal.toLocaleString()}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Logged today</span>
    </div>
  );
}

// 9. Habit Streak Widget
export function HabitStreakWidget() {
  const { habits } = useLuna();
  const maxStreak = (habits || []).reduce((max, h) => Math.max(max, h.streak || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
        <Flame size={18} color="var(--accent-warning)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Habit Streak</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-warning)' }}>
        {maxStreak} Days
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Top active streak</span>
    </div>
  );
}

// 10. Luna Suggestion Widget
export function LunaSuggestionWidget() {
  const { suggestion } = useLuna();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={16} color="var(--accent-primary)" />
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, fontWeight: '700' }}>
          LUNA FOCUS INSIGHT
        </h3>
      </div>
      <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', flex: 1, display: 'flex', alignItems: 'center' }}>
        {suggestion || "Stay focused on your highest priority tasks today. Luna is here to help!"}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</span>
        </div>
        <span className="badge" style={{ fontSize: '11px', background: unreadCount > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: '#FFFFFF' }}>
          {unreadCount} Unread
        </span>
      </div>
    </div>
  );
}

// 13. Habit Tracker Widget
export function HabitTrackerWidget() {
  const { habits, toggleHabit } = useLuna();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--accent-primary)" /> HABITS ({habits?.length || 0})
        </h3>
        <Link to="/app/habits" aria-label="Habits page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Habits <ArrowRight size={13} />
        </Link>
      </div>

      {(habits || []).length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No habits created yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {habits.slice(0, 4).map(habit => (
            <div key={habit.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{habit.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Streak: {habit.streak || 0} days</div>
              </div>
              <button
                type="button"
                onClick={() => toggleHabit(habit.id)}
                className="btn-secondary"
                aria-label={`Toggle habit ${habit.title}`}
                style={{ fontSize: '11px', padding: '4px 8px' }}
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
  const recentExps = (expenses || []).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} color="var(--accent-primary)" /> RECENT EXPENSES ({recentExps.length})
        </h3>
        <Link to="/app/expenses" aria-label="Expenses page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          All Expenses <ArrowRight size={13} />
        </Link>
      </div>

      {recentExps.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No expenses logged yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {recentExps.map(exp => (
            <div key={exp.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{exp.description || exp.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(exp.date)}</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-danger)' }}>
                -₹{exp.amount}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>QUICK ACTION SHORTCUTS</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {dateStr}
      </div>
    </div>
  );
}

// 17. Split Balances Summary Widget
export function SplitBalancesWidget() {
  const [splits, setSplits] = useState([]);

  useEffect(() => {
    api.getSplits().then(res => setSplits(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Shared Splits</span>
        </div>
        <Link to="/app/splits" aria-label="Splits page" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Splits <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Active Splits: <strong style={{ color: 'var(--text-primary)' }}>{splits.length}</strong>
      </div>
    </div>
  );
}

// Main Widget Component Switcher with Error Boundary Wrap
export function renderWidgetById(id) {
  switch (id) {
    case 'today_tasks':
      return <ErrorBoundary><TodayTasksWidget /></ErrorBoundary>;
    case 'upcoming_reminders':
      return <ErrorBoundary><UpcomingRemindersWidget /></ErrorBoundary>;
    case 'overdue_tasks':
      return <ErrorBoundary><OverdueTasksWidget /></ErrorBoundary>;
    case 'upcoming_plans':
    case 'active_plans':
      return <ErrorBoundary><UpcomingPlansWidget /></ErrorBoundary>;
    case 'birthdays_meetings':
    case 'upcoming_birthdays':
    case 'upcoming_meetings':
      return <ErrorBoundary><BirthdaysMeetingsWidget /></ErrorBoundary>;
    case 'spending_snapshot':
      return <ErrorBoundary><SpendingSnapshotWidget /></ErrorBoundary>;
    case 'monthly_expenses':
      return <ErrorBoundary><MonthlyExpensesWidget /></ErrorBoundary>;
    case 'today_spending':
      return <ErrorBoundary><TodaySpendingWidget /></ErrorBoundary>;
    case 'habit_streak':
      return <ErrorBoundary><HabitStreakWidget /></ErrorBoundary>;
    case 'luna_suggestion':
      return <ErrorBoundary><LunaSuggestionWidget /></ErrorBoundary>;
    case 'ask_luna':
      return <ErrorBoundary><AskLunaWidget /></ErrorBoundary>;
    case 'unread_notifications':
      return <ErrorBoundary><UnreadNotificationsWidget /></ErrorBoundary>;
    case 'today_habits':
    case 'weekly_habits':
      return <ErrorBoundary><HabitTrackerWidget /></ErrorBoundary>;
    case 'recent_expenses':
      return <ErrorBoundary><RecentExpensesWidget /></ErrorBoundary>;
    case 'quick_add':
      return <ErrorBoundary><QuickAddWidget /></ErrorBoundary>;
    case 'clock_date':
    case 'today_date':
      return <ErrorBoundary><ClockDateWidget /></ErrorBoundary>;
    case 'split_balances':
    case 'active_splits':
      return <ErrorBoundary><SplitBalancesWidget /></ErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Widget [{id}]</div>;
  }
}
