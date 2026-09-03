/**
 * Context-Aware Luna Suggestion Engine
 * Evaluates real user DaySync context data according to strict priority order.
 * Never invents fake tasks, expenses, plans, or splits.
 */
export function evaluateContextualLunaSuggestion({
  tasks = [],
  expenses = [],
  plans = [],
  splits = [],
  startingBalance = 0
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 1. Priority 1: URGENT / OVERDUE TASK
  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  if (overdueTasks.length > 0) {
    const topOverdue = overdueTasks.find(t => t.priority === 'High') || overdueTasks[0];
    return {
      priority: 1,
      category: 'OVERDUE_TASK',
      title: 'Urgent Overdue Task',
      suggestion: `Your task "${topOverdue.title}" is overdue. Finish that first.`,
      actionText: 'View Tasks',
      actionUrl: '/app/task',
      severity: 'danger'
    };
  }

  // 2. Priority 2: TASK DUE SOON / DUE TODAY (Standard Tasks)
  const todayTasks = (tasks || []).filter(t => !t.completed && t.taskType !== 'meeting' && (t.dueDate === todayStr || (!t.dueDate && !t.taskType)));
  const highPriorityToday = todayTasks.find(t => t.priority === 'High');
  if (highPriorityToday) {
    return {
      priority: 2,
      category: 'HIGH_PRIORITY_DUE_SOON',
      title: 'High Priority Task Due Soon',
      suggestion: `Your top task "${highPriorityToday.title}" is due soon. Finish that first.`,
      actionText: 'Open Task',
      actionUrl: '/app/task',
      severity: 'warning'
    };
  }

  // 3. Priority 3: UPCOMING MEETING / REMINDER COMING SOON
  const upcomingMeetings = (tasks || []).filter(t => !t.completed && (t.taskType === 'meeting' || t.meetingPeople));
  if (upcomingMeetings.length > 0) {
    const nextMeeting = upcomingMeetings[0];
    return {
      priority: 3,
      category: 'UPCOMING_MEETING',
      title: 'Upcoming Meeting',
      suggestion: `Meeting "${nextMeeting.title}" is on your schedule today.`,
      actionText: 'View Schedule',
      actionUrl: '/app/task',
      severity: 'info'
    };
  }

  if (todayTasks.length > 0) {
    return {
      priority: 2,
      category: 'TASKS_DUE_TODAY',
      title: `Tasks Scheduled Today (${todayTasks.length})`,
      suggestion: `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today. Start with the highest priority one.`,
      actionText: 'Start Tasks',
      actionUrl: '/app/task',
      severity: 'info'
    };
  }

  // 4. Priority 4: PLAN EXPIRING SOON
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled' && (p.nextDueDate || p.dueDate));
  const expiringSoon = activePlans.find(p => {
    const due = new Date(p.nextDueDate || p.dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });
  if (expiringSoon) {
    return {
      priority: 4,
      category: 'PLAN_EXPIRING',
      title: 'Plan Expiring Soon',
      suggestion: `Your plan "${expiringSoon.name || expiringSoon.description || 'Subscription'}" expires soon. Check whether you want to renew it.`,
      actionText: 'Manage Plans',
      actionUrl: '/app/plans',
      severity: 'warning'
    };
  }

  // 5. Priority 5: FINANCIAL CONCERN (HIGH SPENDING TODAY)
  const todaySpent = (expenses || [])
    .filter(e => e.type !== 'income' && (e.date || e.createdAt || '').startsWith(todayStr))
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  if (todaySpent > 2000) {
    return {
      priority: 5,
      category: 'HIGH_SPENDING',
      title: 'High Spending Alert',
      suggestion: `You've spent ₹${todaySpent.toLocaleString()} today. Keep an eye on the next expense.`,
      actionText: 'View Expenses',
      actionUrl: '/app/expenses',
      severity: 'warning'
    };
  }

  // 6. Priority 6: PENDING SPLIT (SOMEONE OWES YOU MONEY)
  const owedAmount = parseFloat(typeof window !== 'undefined' ? (localStorage.getItem('daysync_splits_owed') || 0) : 0);
  if (owedAmount > 0) {
    return {
      priority: 6,
      category: 'PENDING_SPLIT',
      title: 'Pending Split Balance',
      suggestion: `₹${owedAmount.toLocaleString()} is still owed to you. You may want to settle that split.`,
      actionText: 'View Splits',
      actionUrl: '/app/splits',
      severity: 'info'
    };
  }

  // 7. Priority 7: PROGRESS ENCOURAGEMENT
  const completedToday = (tasks || []).filter(t => t.completed && t.dueDate === todayStr).length;
  if (completedToday > 0) {
    return {
      priority: 7,
      category: 'PROGRESS_ENCOURAGEMENT',
      title: 'Great Progress!',
      suggestion: `Great momentum! You've already completed ${completedToday} task${completedToday > 1 ? 's' : ''} today.`,
      actionText: 'Keep Going',
      actionUrl: '/app/task',
      severity: 'success'
    };
  }

  // 8. Priority 8: GENERAL POSITIVE NEUTRAL SUGGESTION
  return {
    priority: 8,
    category: 'NEUTRAL_POSITIVE',
    title: 'All Clear',
    suggestion: 'Everything looks under control today. Keep the momentum going.',
    actionText: 'Explore Dashboard',
    actionUrl: '/app/dashboard',
    severity: 'neutral'
  };
}
