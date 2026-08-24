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
  Calendar
} from 'lucide-react';

export const WIDGET_CATALOG = [
  {
    id: 'today_tasks',
    title: "Today's Tasks",
    description: "See tasks scheduled for today and toggle completion.",
    category: "CORE",
    icon: CheckSquare,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'upcoming_reminders',
    title: "Upcoming Reminders",
    description: "View scheduled upcoming tasks and reminders.",
    category: "CORE",
    icon: Clock,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'overdue_tasks',
    title: "Overdue Tasks",
    description: "Keep track of tasks past their due date.",
    category: "CORE",
    icon: AlertTriangle,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide'
  },
  {
    id: 'upcoming_plans',
    title: "Upcoming Plans",
    description: "View active subscriptions, recharges, and utility plans.",
    category: "PLANS",
    icon: Repeat,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'birthdays_meetings',
    title: "Birthdays & Meetings",
    description: "Never miss upcoming birthdays, events, or meetings.",
    category: "LIFE",
    icon: Cake,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'spending_snapshot',
    title: "Spending Snapshot",
    description: "Check current balance, total spent, and income.",
    category: "FINANCE",
    icon: Wallet,
    supportedSizes: ['small', 'wide', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'luna_suggestion',
    title: "Luna Assistant Focus",
    description: "Personalized daily suggestion and focus insights from Luna.",
    category: "LUNA",
    icon: Sparkles,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'unread_notifications',
    title: "Unread Notifications",
    description: "Stay updated on recent system and reminder alerts.",
    category: "CORE",
    icon: Bell,
    supportedSizes: ['small', 'wide', 'tall'],
    defaultSize: 'wide'
  },
  {
    id: 'today_habits',
    title: "Habit Tracker",
    description: "Track your active daily habits and streak.",
    category: "HABITS",
    icon: Activity,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'recent_expenses',
    title: "Recent Expenses",
    description: "Quick summary of your latest logged transactions.",
    category: "FINANCE",
    icon: CreditCard,
    supportedSizes: ['small', 'wide', 'tall', 'large'],
    defaultSize: 'wide'
  },
  {
    id: 'quick_add',
    title: "Quick Add Shortcuts",
    description: "Instant shortcuts to create tasks, expenses, and plans.",
    category: "UTILITY",
    icon: PlusCircle,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide'
  },
  {
    id: 'clock_date',
    title: "Clock & Date",
    description: "Live time and current calendar date display.",
    category: "UTILITY",
    icon: Calendar,
    supportedSizes: ['small', 'wide'],
    defaultSize: 'small'
  }
];

export const DEFAULT_WIDGET_LAYOUT = [
  { id: 'today_tasks', size: 'wide', visible: true },
  { id: 'upcoming_reminders', size: 'wide', visible: true },
  { id: 'upcoming_plans', size: 'wide', visible: true },
  { id: 'birthdays_meetings', size: 'wide', visible: true },
  { id: 'spending_snapshot', size: 'wide', visible: true },
  { id: 'luna_suggestion', size: 'wide', visible: true }
];
