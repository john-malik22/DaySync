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
  Receipt
} from 'lucide-react';

export const WIDGET_CATALOG = [
  // --- CORE WIDGETS ---
  {
    id: 'today_tasks',
    title: "Today's Tasks",
    description: "See tasks scheduled for today and toggle completion.",
    category: "CORE",
    icon: CheckSquare,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'upcoming_reminders',
    title: "Upcoming Reminders",
    description: "View scheduled upcoming tasks and reminders.",
    category: "CORE",
    icon: Clock,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'overdue_tasks',
    title: "Overdue Tasks",
    description: "Keep track of tasks past their due date.",
    category: "CORE",
    icon: AlertTriangle,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'unread_notifications',
    title: "Notifications Alert",
    description: "Stay updated on recent system and reminder alerts.",
    category: "CORE",
    icon: Bell,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- FINANCE WIDGETS ---
  {
    id: 'spending_snapshot',
    title: "Spending Snapshot",
    description: "Check current balance, total spent, and income.",
    category: "FINANCE",
    icon: Wallet,
    supportedSizes: ['small', 'wide', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'recent_expenses',
    title: "Recent Expenses",
    description: "Quick summary of your latest logged transactions.",
    category: "FINANCE",
    icon: CreditCard,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'monthly_expenses',
    title: "Monthly Expenses",
    description: "Track total expense amount logged this month.",
    category: "FINANCE",
    icon: DollarSign,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'today_spending',
    title: "Today's Spending",
    description: "Monitor expenses added today.",
    category: "FINANCE",
    icon: TrendingUp,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small',
    requiredPlan: 'free'
  },
  {
    id: 'expense_breakdown',
    title: "Expense Breakdown",
    description: "Visual summary of expenses by category.",
    category: "FINANCE",
    icon: PieChart,
    supportedSizes: ['wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'remaining_budget',
    title: "Remaining Monthly Budget",
    description: "Track remaining allowance against monthly budget target.",
    category: "FINANCE",
    icon: Wallet,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- PLANS WIDGETS ---
  {
    id: 'upcoming_plans',
    title: "Upcoming Plans",
    description: "View active subscriptions, recharges, and utility plans.",
    category: "PLANS",
    icon: Repeat,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'active_plans',
    title: "Active Subscriptions",
    description: "List of currently active recurring payment plans.",
    category: "PLANS",
    icon: Repeat,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'monthly_plan_cost',
    title: "Monthly Subscription Cost",
    description: "Total monthly expenditure on active plans.",
    category: "PLANS",
    icon: DollarSign,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small',
    requiredPlan: 'free'
  },
  {
    id: 'plan_expiry_countdown',
    title: "Plan Expiry Countdown",
    description: "Countdown to your next expiring utility or subscription plan.",
    category: "PLANS",
    icon: Clock,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- HABITS WIDGETS ---
  {
    id: 'today_habits',
    title: "Habit Tracker",
    description: "Track your active daily habits and streak.",
    category: "HABITS",
    icon: Activity,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'habit_streak',
    title: "Habit Streak Leader",
    description: "View your longest active habit completion streak.",
    category: "HABITS",
    icon: Flame,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small',
    requiredPlan: 'free'
  },
  {
    id: 'weekly_habits',
    title: "Weekly Habit Progress",
    description: "Summary of habit completions for the current week.",
    category: "HABITS",
    icon: Activity,
    supportedSizes: ['wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- LUNA WIDGETS ---
  {
    id: 'luna_suggestion',
    title: "Luna Assistant Focus",
    description: "Personalized daily suggestion and focus insights from Luna.",
    category: "LUNA",
    icon: Sparkles,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'ask_luna',
    title: "Ask Luna Action",
    description: "Quick input field to message Luna AI directly.",
    category: "LUNA",
    icon: MessageSquare,
    supportedSizes: ['wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- LIFE WIDGETS ---
  {
    id: 'birthdays_meetings',
    title: "Birthdays & Meetings",
    description: "Never miss upcoming birthdays, events, or meetings.",
    category: "LIFE",
    icon: Cake,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'upcoming_birthdays',
    title: "Upcoming Birthdays",
    description: "Upcoming friend & family birthdays list.",
    category: "LIFE",
    icon: Cake,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'upcoming_meetings',
    title: "Upcoming Meetings",
    description: "Scheduled calendar meetings and work events.",
    category: "LIFE",
    icon: Briefcase,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },

  // --- UTILITY WIDGETS ---
  {
    id: 'quick_add',
    title: "Quick Add Shortcuts",
    description: "Instant shortcuts to create tasks, expenses, and plans.",
    category: "UTILITY",
    icon: PlusCircle,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'clock_date',
    title: "Clock & Date",
    description: "Live time and current calendar date display.",
    category: "UTILITY",
    icon: Calendar,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small',
    requiredPlan: 'free'
  },
  {
    id: 'today_date',
    title: "Today's Date Banner",
    description: "Full day, month, and date greeting readout.",
    category: "UTILITY",
    icon: Calendar,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small',
    requiredPlan: 'free'
  },

  // --- SPLITS WIDGETS ---
  {
    id: 'split_balances',
    title: "Split Balances Summary",
    description: "Net amount you owe or are owed across shared Splits.",
    category: "SPLITS",
    icon: Users,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  },
  {
    id: 'active_splits',
    title: "Active Shared Splits",
    description: "List of your active group expense Splits.",
    category: "SPLITS",
    icon: Layers,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide',
    requiredPlan: 'free'
  }
];

export const DEFAULT_WIDGET_LAYOUT = [
  { id: 'today_tasks', size: 'wide', visible: true },
  { id: 'upcoming_reminders', size: 'wide', visible: true },
  { id: 'upcoming_plans', size: 'wide', visible: true },
  { id: 'spending_snapshot', size: 'wide', visible: true },
  { id: 'luna_suggestion', size: 'wide', visible: true },
  { id: 'overdue_tasks', size: 'wide', visible: true },
  { id: 'recent_expenses', size: 'wide', visible: true },
  { id: 'birthdays_meetings', size: 'wide', visible: true },
  { id: 'split_balances', size: 'wide', visible: true },
  { id: 'today_habits', size: 'wide', visible: true }
];
