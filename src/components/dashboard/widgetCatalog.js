import React from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Repeat,
  Cake,
  Wallet,
  Sparkles,
  Bell,
  Activity,
  CreditCard,
  PlusCircle,
  Calendar,
  PieChart,
  DollarSign,
  Flame,
  MessageSquare,
  Users,
  Briefcase,
  Layers,
  Zap,
  TrendingUp,
  Receipt,
  Target,
  Award
} from 'lucide-react';

export const WIDGET_SIZES = {
  S: { label: 'Small (2×2)', cols: 2, rows: 2 },
  W: { label: 'Wide (2×4)', cols: 2, rows: 4 },
  T: { label: 'Tall (4×2)', cols: 4, rows: 2 },
  L: { label: 'Large (4×4)', cols: 4, rows: 4 }
};

export const WIDGET_CATALOG = [
  // 1. Spending Snapshot
  {
    id: 'spending_snapshot',
    title: "Spending Snapshot",
    description: "Check current balance, total spent, and income.",
    category: "FINANCE",
    icon: Wallet,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 2. Upcoming Plans
  {
    id: 'upcoming_plans',
    title: "Upcoming Plans",
    description: "View active subscriptions, recharges, and utility plans.",
    category: "PLANS",
    icon: Repeat,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'T',
    requiredPlan: 'free'
  },
  // 3. Shared Splits
  {
    id: 'split_balances',
    title: "Shared Splits",
    description: "Net amount you owe or are owed across shared Splits.",
    category: "SPLITS",
    icon: Users,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 4. Today's Tasks
  {
    id: 'today_tasks',
    title: "Today's Tasks",
    description: "See tasks scheduled for today and toggle completion.",
    category: "CORE",
    icon: CheckSquare,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'T',
    requiredPlan: 'free'
  },
  // 5. Upcoming Reminders
  {
    id: 'upcoming_reminders',
    title: "Upcoming Reminders",
    description: "View scheduled upcoming tasks and reminders.",
    category: "CORE",
    icon: Clock,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'T',
    requiredPlan: 'free'
  },
  // 6. Luna Focus Insight
  {
    id: 'luna_suggestion',
    title: "Luna Focus Insight",
    description: "Personalized daily suggestion and focus insights from Luna.",
    category: "LUNA",
    icon: Sparkles,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 7. Recent Expenses
  {
    id: 'recent_expenses',
    title: "Recent Expenses",
    description: "Quick summary of your latest logged transactions.",
    category: "FINANCE",
    icon: CreditCard,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 8. Monthly Expenses
  {
    id: 'monthly_expenses',
    title: "Monthly Expenses",
    description: "Track total expense amount logged this month.",
    category: "FINANCE",
    icon: DollarSign,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 9. Today's Spending
  {
    id: 'today_spending',
    title: "Today's Spending",
    description: "Monitor expenses added today.",
    category: "FINANCE",
    icon: TrendingUp,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 10. Overdue Tasks
  {
    id: 'overdue_tasks',
    title: "Overdue Tasks",
    description: "Keep track of tasks past their due date.",
    category: "CORE",
    icon: AlertTriangle,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 11. Notifications
  {
    id: 'unread_notifications',
    title: "Notifications",
    description: "Stay updated on recent system and reminder alerts.",
    category: "CORE",
    icon: Bell,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 12. Habit Streak
  {
    id: 'habit_streak',
    title: "Habit Streak",
    description: "View your longest active habit completion streak.",
    category: "HABITS",
    icon: Flame,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 13. Habits Progress
  {
    id: 'today_habits',
    title: "Habits Progress",
    description: "Track your active daily habits and streak.",
    category: "HABITS",
    icon: Activity,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 14. Upcoming Birthday
  {
    id: 'birthdays_meetings',
    title: "Upcoming Birthday & Events",
    description: "Never miss upcoming birthdays, events, or meetings.",
    category: "LIFE",
    icon: Cake,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 15. Shortcuts
  {
    id: 'quick_add',
    title: "Shortcuts",
    description: "Instant shortcuts to create tasks, expenses, and plans.",
    category: "UTILITY",
    icon: PlusCircle,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 16. Time & Date
  {
    id: 'clock_date',
    title: "Time & Date",
    description: "Live time and current calendar date display.",
    category: "UTILITY",
    icon: Calendar,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 17. Upcoming Meetings
  {
    id: 'upcoming_meetings',
    title: "Upcoming Meetings",
    description: "Scheduled calendar meetings and work events.",
    category: "LIFE",
    icon: Briefcase,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 18. Account Balance
  {
    id: 'account_balance',
    title: "Account Balance",
    description: "Net position: Starting Balance + Received - Spent.",
    category: "FINANCE",
    icon: Wallet,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  },
  // 19. Daily Progress
  {
    id: 'daily_progress',
    title: "Daily Progress",
    description: "Overall completion progress for today's tasks & habits.",
    category: "CORE",
    icon: Target,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W',
    requiredPlan: 'free'
  },
  // 20. Next Important Item
  {
    id: 'next_important_item',
    title: "Next Important Item",
    description: "Single highest-priority task, reminder, or plan.",
    category: "CORE",
    icon: Zap,
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S',
    requiredPlan: 'free'
  }
];

// First-time users get EXACTLY 6 priority widgets in deliberate product order
export const DEFAULT_WIDGET_LAYOUT = [
  { id: 'spending_snapshot', size: 'W', visible: true },
  { id: 'upcoming_plans', size: 'T', visible: true },
  { id: 'split_balances', size: 'S', visible: true },
  { id: 'today_tasks', size: 'T', visible: true },
  { id: 'upcoming_reminders', size: 'T', visible: true },
  { id: 'luna_suggestion', size: 'W', visible: true }
];

// Centralized Switch: Set to false to completely clear the Dashboard grid canvas for widget redesign
export const SHOW_DASHBOARD_WIDGETS = false;

