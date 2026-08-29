import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Plus,
  RotateCcw
} from 'lucide-react';

export const SHOW_WIDGET_CONTENT = true;

export const formatDate = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    console.error(`[WidgetErrorBoundary] Caught exception in widget:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '8px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--accent-danger)' }}>Couldn't load widget</div>
          <button type="button" onClick={this.handleRetry} style={{ fontSize: '10px', marginTop: '4px', cursor: 'pointer' }}>
            <RotateCcw size={10} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Common S Inner Surface Container Wrapper
const SmallWidgetWrapper = ({ label, labelColor = 'var(--text-muted)', bgTint, borderTint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
    <div style={{ fontSize: '11px', fontWeight: '700', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {label}
    </div>
    <div style={{
      background: bgTint,
      border: `1px solid ${borderTint}`,
      borderRadius: 'var(--radius-sm, 8px)',
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '66px',
      boxSizing: 'border-box'
    }}>
      {children}
    </div>
  </div>
);

// 1. SPENDING SNAPSHOT (S Mode: Total Spent - Soft Pink/Red Tint)
export function SpendingSnapshotWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const totalSpent = (expenses || [])
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <SmallWidgetWrapper label="TOTAL SPENT" bgTint="rgba(239, 68, 68, 0.08)" borderTint="rgba(239, 68, 68, 0.18)">
      <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-danger, #EF4444)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </SmallWidgetWrapper>
  );
}

// 2. ACCOUNT BALANCE (S Mode: Total Balance - Soft Teal/Green Tint)
export function AccountBalanceWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const startingBalance = parseFloat(localStorage.getItem('daysync_starting_balance') || 0);
  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalIncome = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBalance = startingBalance + totalIncome - totalSpent;

  return (
    <SmallWidgetWrapper label="TOTAL BALANCE" bgTint="rgba(16, 185, 129, 0.08)" borderTint="rgba(16, 185, 129, 0.18)">
      <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-success, #10B981)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </SmallWidgetWrapper>
  );
}

// 3. MONTHLY EXPENSES (S Mode: Monthly Spent - Soft Purple Tint)
export function MonthlyExpensesWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySpent = (expenses || []).filter(e => {
    if (e.type === 'income') return false;
    const d = new Date(e.date || e.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <SmallWidgetWrapper label="MONTHLY SPENT" bgTint="rgba(139, 92, 246, 0.08)" borderTint="rgba(139, 92, 246, 0.18)">
      <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-purple, #8B5CF6)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </SmallWidgetWrapper>
  );
}

// 4. TODAY'S SPENDING (S Mode: Today Spent - Soft Orange/Red Tint)
export function TodaySpendingWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySpent = (expenses || []).filter(e => {
    if (e.type === 'income') return false;
    const dateStr = (e.date || e.createdAt || '').split('T')[0];
    return dateStr === todayStr;
  }).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <SmallWidgetWrapper label="TODAY SPENT" bgTint="rgba(249, 115, 22, 0.08)" borderTint="rgba(249, 115, 22, 0.18)">
      <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-warning, #F97316)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        ${todaySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </SmallWidgetWrapper>
  );
}

// 5. RECENT EXPENSES (S Mode: Latest Expense - Soft Blue Tint)
export function RecentExpensesWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const latestExpense = (expenses || [])
    .filter(e => e.type !== 'income')
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];

  return (
    <SmallWidgetWrapper label="RECENT EXPENSE" bgTint="rgba(59, 130, 246, 0.08)" borderTint="rgba(59, 130, 246, 0.18)">
      {latestExpense ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {latestExpense.merchant || latestExpense.category || latestExpense.description || 'Expense'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary, #3B82F6)', flexShrink: 0 }}>
            ${parseFloat(latestExpense.amount).toFixed(2)}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent expense</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 6. UPCOMING PLANS (S Mode: Nearest Plan - Soft Indigo/Purple Tint)
export function UpcomingPlansWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { plans } = useLuna();
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled');
  const nearestPlan = activePlans.sort((a, b) => new Date(a.nextDueDate || a.dueDate) - new Date(b.nextDueDate || b.dueDate))[0];

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRem = nearestPlan ? getDaysRemaining(nearestPlan.nextDueDate || nearestPlan.dueDate) : null;

  return (
    <SmallWidgetWrapper label="UPCOMING PLAN" bgTint="rgba(99, 102, 241, 0.08)" borderTint="rgba(99, 102, 241, 0.18)">
      {nearestPlan ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestPlan.name || nearestPlan.title}
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-primary, #6366F1)', marginTop: '2px' }}>
            {daysRem != null ? `${daysRem} days left` : 'Active'}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming plan</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 7. SHARED SPLITS (S Mode: Owed & Pay amounts - Soft Teal Tint)
export function SplitBalancesWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const owedAmount = parseFloat(localStorage.getItem('daysync_splits_owed') || 0);
  const payAmount = parseFloat(localStorage.getItem('daysync_splits_pay') || 0);

  return (
    <SmallWidgetWrapper label="SHARED SPLITS" bgTint="rgba(20, 184, 166, 0.08)" borderTint="rgba(20, 184, 166, 0.18)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Owed: <strong style={{ color: 'var(--accent-success, #10B981)', fontWeight: '800' }}>${owedAmount.toFixed(2)}</strong>
        </div>
        <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Pay: <strong style={{ color: 'var(--accent-danger, #EF4444)', fontWeight: '800' }}>${payAmount.toFixed(2)}</strong>
        </div>
      </div>
    </SmallWidgetWrapper>
  );
}

// 8. TODAY'S TASKS (S Mode: One Task - Soft Purple Tint)
export function TodayTasksWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingToday = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate));

  const priorityTask = pendingToday.find(t => t.priority === 'HIGH' || t.priority === 'High') ||
                       pendingToday.find(t => t.priority === 'MEDIUM' || t.priority === 'Medium') ||
                       pendingToday[0];

  return (
    <SmallWidgetWrapper label="TODAY'S TASK" bgTint="rgba(168, 85, 247, 0.08)" borderTint="rgba(168, 85, 247, 0.18)">
      {priorityTask ? (
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {priorityTask.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No task today 🎉</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 9. OVERDUE TASKS (S Mode: One Overdue Task - Soft Red/Pink Tint)
export function OverdueTasksWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  const overdueTask = overdueTasks[0];

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 1;
    const diff = new Date() - new Date(dueDate);
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <SmallWidgetWrapper label="OVERDUE TASK" labelColor="var(--accent-danger, #EF4444)" bgTint="rgba(239, 68, 68, 0.1)" borderTint="rgba(239, 68, 68, 0.22)">
      {overdueTask ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {overdueTask.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-danger, #EF4444)', fontWeight: '700', marginTop: '2px' }}>
            {getDaysOverdue(overdueTask.dueDate)} day{getDaysOverdue(overdueTask.dueDate) > 1 ? 's' : ''} overdue
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No overdue tasks 👍</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 10. UPCOMING REMINDERS (S Mode: One Reminder - Soft Amber Tint)
export function UpcomingRemindersWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate >= todayStr);
  const nearestReminder = upcomingReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  return (
    <SmallWidgetWrapper label="REMINDER" bgTint="rgba(245, 158, 11, 0.08)" borderTint="rgba(245, 158, 11, 0.18)">
      {nearestReminder ? (
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {nearestReminder.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No reminder</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 11. NOTIFICATIONS (S Mode: Latest Notification - Soft Blue/Purple Tint)
export function UnreadNotificationsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { notifications } = useNotifications();
  const latestNotification = (notifications || [])[0];

  return (
    <SmallWidgetWrapper label="NOTIFICATION" bgTint="rgba(99, 102, 241, 0.08)" borderTint="rgba(99, 102, 241, 0.18)">
      {latestNotification ? (
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {latestNotification.message || latestNotification.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notifications</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 12. HABIT PROGRESS (S Mode: Completion % - Soft Teal/Green Tint)
export function HabitTrackerWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const habits = (tasks || []).filter(t => t.category === 'HABIT' || t.isHabit);
  const completedCount = habits.filter(h => h.completed).length;
  const completionPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <SmallWidgetWrapper label="HABIT PROGRESS" bgTint="rgba(16, 185, 129, 0.08)" borderTint="rgba(16, 185, 129, 0.18)">
      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-success, #10B981)', textAlign: 'center' }}>
        {completionPct}%
      </div>
    </SmallWidgetWrapper>
  );
}

// 13. HABIT STREAK (S Mode: Streak Days - Soft Orange Tint)
export function HabitStreakWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const streakDays = parseInt(localStorage.getItem('daysync_habit_streak') || '10', 10);

  return (
    <SmallWidgetWrapper label="HABIT STREAK" bgTint="rgba(249, 115, 22, 0.08)" borderTint="rgba(249, 115, 22, 0.18)">
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-warning, #F97316)', textAlign: 'center' }}>
        {streakDays} Days
      </div>
    </SmallWidgetWrapper>
  );
}

// 14. TODAY'S PROGRESS (S Mode: Progress % - Soft Indigo Tint)
export function DailyProgressWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const doneCount = todayTasks.filter(t => t.completed).length;
  const progressPct = todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 75;

  return (
    <SmallWidgetWrapper label="TODAY'S PROGRESS" bgTint="rgba(99, 102, 241, 0.08)" borderTint="rgba(99, 102, 241, 0.18)">
      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-primary, #6366F1)', textAlign: 'center' }}>
        {progressPct}%
      </div>
    </SmallWidgetWrapper>
  );
}

// 15. BIRTHDAYS (S Mode: Nearest Birthday - Soft Pink Tint)
export function BirthdaysMeetingsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const birthdays = (tasks || []).filter(t => t.title && t.title.toLowerCase().includes('birthday'));
  const nearestBirthday = birthdays[0];

  return (
    <SmallWidgetWrapper label="BIRTHDAY" bgTint="rgba(236, 72, 153, 0.08)" borderTint="rgba(236, 72, 153, 0.18)">
      {nearestBirthday ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestBirthday.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-pink, #EC4899)', fontWeight: '700', marginTop: '2px' }}>
            {formatDate(nearestBirthday.dueDate)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No birthday</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 16. MEETINGS (S Mode: Nearest Meeting - Soft Blue Tint)
export function UpcomingMeetingsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const meetings = (tasks || []).filter(t => t.category === 'Meeting' || (t.title && t.title.toLowerCase().includes('meeting')));
  const nearestMeeting = meetings[0];

  return (
    <SmallWidgetWrapper label="MEETING" bgTint="rgba(59, 130, 246, 0.08)" borderTint="rgba(59, 130, 246, 0.18)">
      {nearestMeeting ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestMeeting.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary, #3B82F6)', fontWeight: '700', marginTop: '2px' }}>
            {nearestMeeting.dueTime || formatDate(nearestMeeting.dueDate)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No meeting</div>
      )}
    </SmallWidgetWrapper>
  );
}

// 17. TIME & DATE (S Mode: Live Time Large, Date Small - Soft Indigo Tint)
export function ClockDateWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SmallWidgetWrapper label="TIME & DATE" bgTint="rgba(99, 102, 241, 0.08)" borderTint="rgba(99, 102, 241, 0.18)">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '21px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {timeStr}
        </div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '2px' }}>
          {dateStr}
        </div>
      </div>
    </SmallWidgetWrapper>
  );
}

// 18. SHORTCUTS (S Mode: One Shortcut Action - Soft Purple Tint)
export function QuickAddWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  return (
    <SmallWidgetWrapper label="SHORTCUT" bgTint="rgba(139, 92, 246, 0.08)" borderTint="rgba(139, 92, 246, 0.18)">
      <Link to="/app/task" className="btn-primary" style={{ fontSize: '11.5px', padding: '6px 10px', textDecoration: 'none', justifyContent: 'center', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
        <Plus size={13} /> Add Task
      </Link>
    </SmallWidgetWrapper>
  );
}

// 19. LUNA FOCUS (S Mode: One Concise Actionable Thought - Soft Lavender Tint)
export function LunaSuggestionWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  return (
    <SmallWidgetWrapper label="LUNA FOCUS" labelColor="var(--accent-primary)" bgTint="rgba(168, 85, 247, 0.08)" borderTint="rgba(168, 85, 247, 0.18)">
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        Focus on your top priority today.
      </div>
    </SmallWidgetWrapper>
  );
}

// 20. IMPORTANT PERSON SPLITS (S Mode: Person Owed Amount - Soft Teal Tint)
export function NextImportantItemWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const importantPerson = JSON.parse(localStorage.getItem('daysync_important_person_split') || '{"name":"Alex","owedAmount":45.00}');

  return (
    <SmallWidgetWrapper label="IMPORTANT PERSON" bgTint="rgba(20, 184, 166, 0.08)" borderTint="rgba(20, 184, 166, 0.18)">
      {importantPerson ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {importantPerson.name}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-success, #10B981)', marginTop: '2px' }}>
            Owes ${parseFloat(importantPerson.owedAmount).toFixed(2)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No split balances</div>
      )}
    </SmallWidgetWrapper>
  );
}

export function AskLunaWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  return (
    <SmallWidgetWrapper label="ASK LUNA AI" bgTint="rgba(168, 85, 247, 0.08)" borderTint="rgba(168, 85, 247, 0.18)">
      <Link to="/app/luna" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none', justifyContent: 'center' }}>
        Open Luna Chat
      </Link>
    </SmallWidgetWrapper>
  );
}

export function renderWidgetById(id, widgetSize) {
  switch (id) {
    case 'spending_snapshot':
    case 'expense_breakdown':
    case 'remaining_budget':
      return <WidgetErrorBoundary title="Spending Snapshot"><SpendingSnapshotWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'account_balance':
      return <WidgetErrorBoundary title="Account Balance"><AccountBalanceWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'monthly_expenses':
    case 'monthly_summary':
      return <WidgetErrorBoundary title="Monthly Expenses"><MonthlyExpensesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'today_spending':
    case 'budget_overview':
      return <WidgetErrorBoundary title="Today's Spending"><TodaySpendingWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'recent_expenses':
    case 'recent_transactions':
      return <WidgetErrorBoundary title="Recent Expenses"><RecentExpensesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_plans':
    case 'active_plans':
    case 'monthly_plan_cost':
    case 'plan_expiry_countdown':
      return <WidgetErrorBoundary title="Upcoming Plans"><UpcomingPlansWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'split_balances':
    case 'active_splits':
      return <WidgetErrorBoundary title="Shared Splits"><SplitBalancesWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'today_tasks':
      return <WidgetErrorBoundary title="Today's Tasks"><TodayTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'overdue_tasks':
    case 'category_breakdown':
      return <WidgetErrorBoundary title="Overdue Tasks"><OverdueTasksWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_reminders':
      return <WidgetErrorBoundary title="Upcoming Reminders"><UpcomingRemindersWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'unread_notifications':
    case 'notifications_widget':
      return <WidgetErrorBoundary title="Notifications"><UnreadNotificationsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'today_habits':
    case 'weekly_habits':
    case 'habit_tracker':
      return <WidgetErrorBoundary title="Habit Progress"><HabitTrackerWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'habit_streak':
    case 'savings_goal':
      return <WidgetErrorBoundary title="Habit Streak"><HabitStreakWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'daily_progress':
    case 'weekly_activity':
      return <WidgetErrorBoundary title="Daily Progress"><DailyProgressWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'birthdays_meetings':
    case 'upcoming_birthdays':
    case 'calendar_events':
      return <WidgetErrorBoundary title="Birthdays"><BirthdaysMeetingsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'upcoming_meetings':
    case 'time_breakdown':
      return <WidgetErrorBoundary title="Upcoming Meetings"><UpcomingMeetingsWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'clock_date':
    case 'today_date':
    case 'shortcuts_widget':
      return <WidgetErrorBoundary title="Time & Date"><ClockDateWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'quick_add':
      return <WidgetErrorBoundary title="Shortcuts"><QuickAddWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'luna_suggestion':
      return <WidgetErrorBoundary title="Luna Focus Insight"><LunaSuggestionWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'ask_luna':
      return <WidgetErrorBoundary title="Ask Luna AI"><AskLunaWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    case 'next_important_item':
      return <WidgetErrorBoundary title="Important Person Splits"><NextImportantItemWidget widgetSize={widgetSize} /></WidgetErrorBoundary>;
    default:
      return <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '4px' }}>Widget [{id}]</div>;
  }
}
