import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { useNotifications } from '../../context/NotificationContext';
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
  DollarSign,
  Flame,
  Briefcase,
  RotateCcw,
  Target,
  Zap
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

// 1. SPENDING SNAPSHOT (S Mode: Total Spent)
export function SpendingSnapshotWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const totalSpent = (expenses || [])
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Total Spent
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

// 2. ACCOUNT BALANCE (S Mode: Total Balance)
export function AccountBalanceWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const startingBalance = parseFloat(localStorage.getItem('daysync_starting_balance') || 0);
  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalIncome = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBalance = startingBalance + totalIncome - totalSpent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Total Balance
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-success, #10B981)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

// 3. MONTHLY EXPENSES (S Mode: Monthly Spent)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Monthly Spent
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

// 4. TODAY'S SPENDING (S Mode: Today Spent)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Today Spent
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ${todaySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

// 5. RECENT EXPENSES (S Mode: Latest Expense)
export function RecentExpensesWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { expenses } = useLuna();
  const latestExpense = (expenses || [])
    .filter(e => e.type !== 'income')
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Latest Expense
      </div>
      {latestExpense ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {latestExpense.merchant || latestExpense.category || latestExpense.description || 'Expense'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '2px' }}>
            ${parseFloat(latestExpense.amount).toFixed(2)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>$0.00 logged</div>
      )}
    </div>
  );
}

// 6. UPCOMING PLANS (S Mode: Nearest Plan)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Upcoming Plan
      </div>
      {nearestPlan ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestPlan.name || nearestPlan.title}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '2px' }}>
            {daysRem != null ? `${daysRem} days remaining` : 'Active'}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming plan</div>
      )}
    </div>
  );
}

// 7. SHARED SPLITS (S Mode: Owed & Pay amounts)
export function SplitBalancesWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const owedAmount = parseFloat(localStorage.getItem('daysync_splits_owed') || 0);
  const payAmount = parseFloat(localStorage.getItem('daysync_splits_pay') || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: '4px', padding: '6px 8px' }}>
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        You are owed: <strong style={{ color: 'var(--accent-success, #10B981)', fontWeight: '700' }}>${owedAmount.toFixed(2)}</strong>
      </div>
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        You have to pay: <strong style={{ color: 'var(--accent-danger, #EF4444)', fontWeight: '700' }}>${payAmount.toFixed(2)}</strong>
      </div>
    </div>
  );
}

// 8. TODAY'S TASKS (S Mode: One High Priority Task)
export function TodayTasksWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingToday = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate));

  // Find High Priority task first; fallback to highest available priority
  const priorityTask = pendingToday.find(t => t.priority === 'HIGH' || t.priority === 'High') ||
                       pendingToday.find(t => t.priority === 'MEDIUM' || t.priority === 'Medium') ||
                       pendingToday[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Today's Priority Task
      </div>
      {priorityTask ? (
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {priorityTask.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tasks for today 🎉</div>
      )}
    </div>
  );
}

// 9. OVERDUE TASKS (S Mode: One Overdue Task)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-danger, #EF4444)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Overdue Task
      </div>
      {overdueTask ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {overdueTask.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-danger, #EF4444)', fontWeight: '600', marginTop: '2px' }}>
            {getDaysOverdue(overdueTask.dueDate)} day{getDaysOverdue(overdueTask.dueDate) > 1 ? 's' : ''} overdue
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No overdue tasks 👍</div>
      )}
    </div>
  );
}

// 10. UPCOMING REMINDERS (S Mode: One Nearest Reminder)
export function UpcomingRemindersWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate >= todayStr);
  const nearestReminder = upcomingReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Upcoming Reminder
      </div>
      {nearestReminder ? (
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {nearestReminder.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming reminders</div>
      )}
    </div>
  );
}

// 11. NOTIFICATIONS (S Mode: Latest Notification)
export function UnreadNotificationsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { notifications } = useNotifications();
  const latestNotification = (notifications || [])[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Notification
      </div>
      {latestNotification ? (
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {latestNotification.message || latestNotification.title}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No new notifications</div>
      )}
    </div>
  );
}

// 12. HABIT PROGRESS (S Mode: Habit Completion %)
export function HabitTrackerWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const habits = (tasks || []).filter(t => t.category === 'HABIT' || t.isHabit);
  const completedCount = habits.filter(h => h.completed).length;
  const completionPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Habit Progress
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-primary)' }}>
        {completionPct}%
      </div>
    </div>
  );
}

// 13. HABIT STREAK (S Mode: Continuous Streak Days)
export function HabitStreakWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const streakDays = parseInt(localStorage.getItem('daysync_habit_streak') || '3', 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Habit Streak
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-warning, #F59E0B)' }}>
        {streakDays} Days
      </div>
    </div>
  );
}

// 14. TODAY'S PROGRESS (S Mode: Overall Progress %)
export function DailyProgressWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const doneCount = todayTasks.filter(t => t.completed).length;
  const progressPct = todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Today's Progress
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-success, #10B981)' }}>
        {progressPct}%
      </div>
    </div>
  );
}

// 15. BIRTHDAYS (S Mode: Nearest Birthday)
export function BirthdaysMeetingsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const birthdays = (tasks || []).filter(t => t.title && t.title.toLowerCase().includes('birthday'));
  const nearestBirthday = birthdays[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Next Birthday
      </div>
      {nearestBirthday ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestBirthday.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '600', marginTop: '2px' }}>
            {formatDate(nearestBirthday.dueDate)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming birthdays</div>
      )}
    </div>
  );
}

// 16. MEETINGS (S Mode: Nearest Meeting)
export function UpcomingMeetingsWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const { tasks } = useLuna();

  const meetings = (tasks || []).filter(t => t.category === 'Meeting' || (t.title && t.title.toLowerCase().includes('meeting')));
  const nearestMeeting = meetings[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Next Meeting
      </div>
      {nearestMeeting ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestMeeting.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '600', marginTop: '2px' }}>
            {nearestMeeting.dueTime || formatDate(nearestMeeting.dueDate)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming meetings</div>
      )}
    </div>
  );
}

// 17. TIME & DATE (S Mode: Live Time Large, Date Small)
export function ClockDateWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '4px' }}>
        {dateStr}
      </div>
    </div>
  );
}

// 18. SHORTCUTS (S Mode: One Action Shortcut)
export function QuickAddWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        Quick Action
      </div>
      <Link to="/app/task" className="btn-primary" style={{ fontSize: '11.5px', padding: '6px 10px', textDecoration: 'none', justifyContent: 'center', gap: '4px' }}>
        <Plus size={13} /> Add Task
      </Link>
    </div>
  );
}

// 19. LUNA FOCUS (S Mode: One Concise Actionable Thought)
export function LunaSuggestionWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Sparkles size={12} /> Luna Insight
      </div>
      <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        Focus on your top priority task today.
      </div>
    </div>
  );
}

// 20. IMPORTANT PERSON SPLITS (S Mode: One Person Owed Amount)
export function NextImportantItemWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;

  const importantPerson = JSON.parse(localStorage.getItem('daysync_important_person_split') || '{"name":"Alex","owedAmount":45.00}');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        Important Person
      </div>
      {importantPerson ? (
        <>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {importantPerson.name}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--accent-success, #10B981)', marginTop: '2px' }}>
            Owes ${parseFloat(importantPerson.owedAmount).toFixed(2)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No split balances</div>
      )}
    </div>
  );
}

export function AskLunaWidget({ widgetSize = 'S' }) {
  if (widgetSize !== 'S') return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '6px 8px' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        Ask Luna AI
      </div>
      <Link to="/app/luna" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none', justifyContent: 'center' }}>
        Open Luna Chat
      </Link>
    </div>
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
