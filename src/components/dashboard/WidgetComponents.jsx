import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { useNotifications } from '../../context/NotificationContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
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
  Plus
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
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={17} color="var(--accent-primary)" /> TODAY'S TASKS ({todayTasks.length})
        </h3>
        <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={17} color="var(--accent-primary)" /> UPCOMING REMINDERS ({upcomingReminders.length})
        </h3>
        <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Tasks <ArrowRight size={13} />
        </Link>
      </div>

      {upcomingReminders.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No upcoming reminders scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {upcomingReminders.map(task => (
            <div key={task.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>{formatDate(task.dueDate)}</span>
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
        <h3 style={{ color: 'var(--accent-danger)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={17} color="var(--accent-danger)" /> OVERDUE TASKS ({overdueTasks.length})
        </h3>
        <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Tasks <ArrowRight size={13} />
        </Link>
      </div>

      {overdueTasks.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No overdue tasks! You're all caught up. ✨
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {overdueTasks.slice(0, 5).map(task => (
            <div key={task.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id, false)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    border: '2px solid var(--accent-danger)', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-danger)', fontWeight: '700' }}>Due {formatDate(task.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. Upcoming Plans Widget
export function UpcomingPlansWidget() {
  const { expenses } = useLuna();
  const activePlans = (expenses || []).filter(e => e.isPlan || e.isRecurring || e.frequency || ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category)).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={17} color="var(--accent-primary)" /> UPCOMING PLANS ({activePlans.length})
        </h3>
        <Link to="/app/plans" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View Plans <ArrowRight size={13} />
        </Link>
      </div>

      {activePlans.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No active plans or subscriptions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {activePlans.map(plan => (
            <div key={plan.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{plan.description || plan.category}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{plan.amount} / {plan.frequency || 'month'}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-warning)', fontWeight: '700' }}>{formatDate(plan.endDate || plan.nextDueDate)}</span>
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
  const items = (tasks || []).filter(t => t.taskType === 'birthday' || t.taskType === 'meeting' || t.isBirthday || t.isMeeting || (t.title && (t.title.toLowerCase().includes('birthday') || t.title.toLowerCase().includes('meeting')))).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cake size={17} color="var(--accent-primary)" /> BIRTHDAYS & MEETINGS ({items.length})
        </h3>
        <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Add <ArrowRight size={13} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No upcoming birthdays or meetings recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {items.map(item => (
            <div key={item.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.taskType === 'birthday' || item.isBirthday ? <Cake size={15} color="var(--accent-warning)" /> : <Users size={15} color="var(--accent-primary)" />}
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>{formatDate(item.dueDate || item.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 6. Spending Snapshot Widget
export function SpendingSnapshotWidget() {
  const { expenses, startingBalance } = useLuna();
  const totalReceived = (expenses || []).filter(e => e.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((a, b) => a + (b.amount || 0), 0);
  const currentBalance = (startingBalance !== null ? startingBalance : 0) + totalReceived - totalSpent;

  const formattedBalance = currentBalance >= 0 
    ? `+₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `-₹${Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formattedSpent = `-₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedReceived = `+₹${totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={17} color="var(--accent-primary)" /> SPENDING SNAPSHOT
        </h3>
        <Link to="/app/expenses" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Expenses <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 'auto' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</span>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
            {formattedBalance}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>SPENT</span>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-danger)' }}>{formattedSpent}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>RECEIVED</span>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-success)' }}>{formattedReceived}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Luna Suggestion Widget
export function LunaSuggestionWidget() {
  const { tasks, expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasksCount = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate)).length;
  const activePlansCount = (expenses || []).filter(e => e.isPlan || e.isRecurring).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={17} color="var(--accent-primary)" /> LUNA ASSISTANT FOCUS
        </h3>
        <Link to="/app/chat" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Chat <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{
        padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.5', flex: 1,
        display: 'flex', alignItems: 'center'
      }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          🧠 <strong>Luna Focus:</strong> You have {todayTasksCount} task(s) for today and {activePlansCount} active plan(s). Ask Luna to organize your schedule or add recurring items anytime!
        </p>
      </div>
    </div>
  );
}

// 8. Unread Notifications Widget
export function UnreadNotificationsWidget() {
  const { notifications, unreadCount } = useNotifications ? useNotifications() : { notifications: [], unreadCount: 0 };
  const unreadItems = (notifications || []).filter(n => !n.read).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={17} color="var(--accent-primary)" /> UNREAD ALERTS ({unreadCount})
        </h3>
        <Link to="/app/settings" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Settings <ArrowRight size={13} />
        </Link>
      </div>

      {unreadItems.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          All caught up! No unread notifications. 🔔
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {unreadItems.map(item => (
            <div key={item.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', fontSize: '12px'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 9. Habit Tracker Widget
export function HabitTrackerWidget() {
  const { routines } = useLuna();
  const habitList = (routines || []).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color="var(--accent-primary)" /> HABIT TRACKER ({habitList.length})
        </h3>
        <Link to="/app/habits" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Habits <ArrowRight size={13} />
        </Link>
      </div>

      {habitList.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No active habits added yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {habitList.map(h => (
            <div key={h.id || h.name} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{h.name || h.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>🔥 {h.streak || 0}d streak</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 10. Recent Expenses Widget
export function RecentExpensesWidget() {
  const { expenses } = useLuna();
  const recentList = (expenses || []).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={17} color="var(--accent-primary)" /> RECENT TRANSACTIONS
        </h3>
        <Link to="/app/expenses" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          History <ArrowRight size={13} />
        </Link>
      </div>

      {recentList.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No expenses recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {recentList.map(exp => (
            <div key={exp.id} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{exp.description || exp.category}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(exp.date)}</div>
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

// 11. Quick Add Widget
export function QuickAddWidget() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={17} color="var(--accent-primary)" /> QUICK ACTIONS
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', flex: 1, alignItems: 'center' }}>
        <button
          onClick={() => navigate('/app/task')}
          className="btn-secondary"
          style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
        >
          <Plus size={14} /> Add Task
        </button>
        <button
          onClick={() => navigate('/app/expenses')}
          className="btn-secondary"
          style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
        >
          <Plus size={14} /> Add Expense
        </button>
        <button
          onClick={() => navigate('/app/plans')}
          className="btn-secondary"
          style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
        >
          <Plus size={14} /> Add Plan
        </button>
        <button
          onClick={() => navigate('/app/habits')}
          className="btn-secondary"
          style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
        >
          <Plus size={14} /> Add Habit
        </button>
      </div>
    </div>
  );
}

// 12. Clock & Date Widget
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
      return <ErrorBoundary><UpcomingPlansWidget /></ErrorBoundary>;
    case 'birthdays_meetings':
      return <ErrorBoundary><BirthdaysMeetingsWidget /></ErrorBoundary>;
    case 'spending_snapshot':
      return <ErrorBoundary><SpendingSnapshotWidget /></ErrorBoundary>;
    case 'luna_suggestion':
      return <ErrorBoundary><LunaSuggestionWidget /></ErrorBoundary>;
    case 'unread_notifications':
      return <ErrorBoundary><UnreadNotificationsWidget /></ErrorBoundary>;
    case 'today_habits':
      return <ErrorBoundary><HabitTrackerWidget /></ErrorBoundary>;
    case 'recent_expenses':
      return <ErrorBoundary><RecentExpensesWidget /></ErrorBoundary>;
    case 'quick_add':
      return <ErrorBoundary><QuickAddWidget /></ErrorBoundary>;
    case 'clock_date':
      return <ErrorBoundary><ClockDateWidget /></ErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Widget [{id}]</div>;
  }
}
