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
  Plus,
  TrendingUp,
  DollarSign,
  Flame,
  Briefcase,
  RotateCcw,
  Target,
  Zap,
  Award
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

// Common S Inner Surface Wrapper
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

// 1. SPENDING SNAPSHOT (S, W, T, L)
export function SpendingSnapshotWidget({ widgetSize = 'W' }) {
  const { expenses } = useLuna();
  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalIncome = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const net = totalIncome - totalSpent;
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySpent = (expenses || []).filter(e => e.type !== 'income' && (e.date || e.createdAt || '').startsWith(todayStr)).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="TOTAL SPENT" bgTint="rgba(239, 68, 68, 0.08)" borderTint="rgba(239, 68, 68, 0.18)">
        <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-danger, #EF4444)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          SPENDING SNAPSHOT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL SPENT</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-danger)' }}>${totalSpent.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>RECEIVED</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-success)' }}>${totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>NET</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${net.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          SPENDING BREAKDOWN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Spent</span>
            <strong style={{ color: 'var(--accent-danger)' }}>${totalSpent.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Received</span>
            <strong style={{ color: 'var(--accent-success)' }}>${totalIncome.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Net Position</span>
            <strong style={{ color: net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${net.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Today Spent</span>
            <strong>${todaySpent.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  }

  // L Size: Complete Overview
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        FINANCIAL OVERVIEW
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Spent</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-danger)' }}>${totalSpent.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Received</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-success)' }}>${totalIncome.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Position</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${net.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Today Spent</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>${todaySpent.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// 2. ACCOUNT BALANCE (S, W, T, L)
export function AccountBalanceWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const startingBalance = parseFloat(localStorage.getItem('daysync_starting_balance') || 0);
  const totalSpent = (expenses || []).filter(e => e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalIncome = (expenses || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBalance = startingBalance + totalIncome - totalSpent;

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="TOTAL BALANCE" bgTint="rgba(16, 185, 129, 0.08)" borderTint="rgba(16, 185, 129, 0.18)">
        <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-success, #10B981)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ACCOUNT BALANCES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>STARTING</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>${startingBalance.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>INCOME</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-success)' }}>+${totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>BALANCE</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-success)' }}>${totalBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ACCOUNT SUMMARY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Main Account</span>
            <strong style={{ color: 'var(--accent-success)' }}>${totalBalance.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Received</span>
            <strong style={{ color: 'var(--accent-success)' }}>+${totalIncome.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Spent</span>
            <strong style={{ color: 'var(--accent-danger)' }}>-${totalSpent.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE ACCOUNT OVERVIEW
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Account Balance</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-success)' }}>${totalBalance.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Starting Balance</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>${startingBalance.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Income</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-success)' }}>${totalIncome.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Spent</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-danger)' }}>${totalSpent.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// 3. MONTHLY EXPENSES (S, W, T, L)
export function MonthlyExpensesWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySpent = (expenses || []).filter(e => {
    if (e.type === 'income') return false;
    const d = new Date(e.date || e.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="MONTHLY SPENT" bgTint="rgba(139, 92, 246, 0.08)" borderTint="rgba(139, 92, 246, 0.18)">
        <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-purple, #8B5CF6)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          PERIOD SPENDING COMPARISON
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>THIS WEEK</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>${(monthlySpent * 0.25).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>THIS MONTH</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-purple)' }}>${monthlySpent.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>EST. YEAR</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)' }}>${(monthlySpent * 12).toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          MONTHLY SPENDING DETAILS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>This Month</span>
            <strong style={{ color: 'var(--accent-purple)' }}>${monthlySpent.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>This Week</span>
            <strong>${(monthlySpent * 0.25).toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Top Category</span>
            <strong>Food & Dining</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE MONTHLY REPORT
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This Month</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-purple)' }}>${monthlySpent.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weekly Average</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>${(monthlySpent / 4).toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top Category</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Food & Living</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Month Progress</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-purple)' }}>Active</div>
        </div>
      </div>
    </div>
  );
}

// 4. TODAY'S SPENDING (S, W, T, L)
export function TodaySpendingWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySpent = (expenses || []).filter(e => {
    if (e.type === 'income') return false;
    const dateStr = (e.date || e.createdAt || '').split('T')[0];
    return dateStr === todayStr;
  }).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="TODAY SPENT" bgTint="rgba(249, 115, 22, 0.08)" borderTint="rgba(249, 115, 22, 0.18)">
        <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--accent-warning, #F97316)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          ${todaySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          DAILY SPENDING HISTORY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>TODAY</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-warning)' }}>${todaySpent.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>YESTERDAY</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>$0.00</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>DAY BEFORE</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>$0.00</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          TODAY'S SPENDING ANALYSIS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Today</span>
            <strong style={{ color: 'var(--accent-warning)' }}>${todaySpent.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Yesterday</span>
            <span>$0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Top Category</span>
            <span>General</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE DAILY SPENDING REPORT
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Today Spent</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-warning)' }}>${todaySpent.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction Count</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{(expenses || []).length} logged</div>
        </div>
      </div>
    </div>
  );
}

// 5. RECENT EXPENSES (S, W, T, L)
export function RecentExpensesWidget({ widgetSize = 'S' }) {
  const { expenses } = useLuna();
  const recentList = (expenses || [])
    .filter(e => e.type !== 'income')
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const latestExpense = recentList[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = recentList.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          RECENT EXPENSES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(exp => (
            <div key={exp.id || exp.createdAt}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {exp.merchant || exp.category || 'Expense'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                ${parseFloat(exp.amount).toFixed(2)}
              </div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent transactions</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = recentList.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          RECENT TRANSACTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(exp => (
            <div key={exp.id || exp.createdAt} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{exp.merchant || exp.category || 'Expense'}</span>
              <strong style={{ color: 'var(--accent-primary)' }}>${parseFloat(exp.amount).toFixed(2)}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent transactions</div>}
        </div>
      </div>
    );
  }

  // L Size: Full Transaction History
  const items = recentList.slice(0, 5);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        TRANSACTION HISTORY
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(exp => (
          <div key={exp.id || exp.createdAt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{exp.merchant || exp.category || 'Expense'}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(exp.date || exp.createdAt)}</div>
            </div>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>${parseFloat(exp.amount).toFixed(2)}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent transactions</div>}
      </div>
    </div>
  );
}

// 6. UPCOMING PLANS (S, W, T, L)
export function UpcomingPlansWidget({ widgetSize = 'S' }) {
  const { plans } = useLuna();
  const activePlans = (plans || []).filter(p => p.status !== 'cancelled');
  const nearestPlan = activePlans.sort((a, b) => new Date(a.nextDueDate || a.dueDate) - new Date(b.nextDueDate || b.dueDate))[0];

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRem = nearestPlan ? getDaysRemaining(nearestPlan.nextDueDate || nearestPlan.dueDate) : null;

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = activePlans.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          UPCOMING PLANS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(plan => (
            <div key={plan.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plan.name || plan.title}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {getDaysRemaining(plan.nextDueDate || plan.dueDate)} days left
              </div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active plans</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = activePlans.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ACTIVE SUBSCRIPTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(plan => (
            <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{plan.name || plan.title}</span>
              <strong style={{ color: 'var(--accent-primary)' }}>${plan.amount || 0}/mo</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active plans</div>}
        </div>
      </div>
    );
  }

  const items = activePlans.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE PLANS OVERVIEW
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(plan => (
          <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{plan.name || plan.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Next bill: {formatDate(plan.nextDueDate)}</div>
            </div>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>${plan.amount || 0}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active plans</div>}
      </div>
    </div>
  );
}

// 7. SHARED SPLITS (S, W, T, L)
export function SplitBalancesWidget({ widgetSize = 'S' }) {
  const owedAmount = parseFloat(localStorage.getItem('daysync_splits_owed') || 0);
  const payAmount = parseFloat(localStorage.getItem('daysync_splits_pay') || 0);
  const netSplit = owedAmount - payAmount;

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          SPLIT BALANCES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>OWED</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-success)' }}>${owedAmount.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>YOU PAY</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-danger)' }}>${payAmount.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>NET</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: netSplit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${netSplit.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          SPLIT SUMMARY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>You Are Owed</span>
            <strong style={{ color: 'var(--accent-success)' }}>${owedAmount.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>You Have To Pay</span>
            <strong style={{ color: 'var(--accent-danger)' }}>${payAmount.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Net Balance</span>
            <strong style={{ color: netSplit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${netSplit.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE SPLITS OVERVIEW
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Owed to You</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-success)' }}>${owedAmount.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total You Owe</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-danger)' }}>${payAmount.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Settlement</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: netSplit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${netSplit.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Balanced</div>
        </div>
      </div>
    </div>
  );
}

// 8. TODAY'S TASKS (S, W, T, L)
export function TodayTasksWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingToday = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate));

  const priorityTask = pendingToday.find(t => t.priority === 'HIGH' || t.priority === 'High') ||
                       pendingToday.find(t => t.priority === 'MEDIUM' || t.priority === 'Medium') ||
                       pendingToday[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = pendingToday.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          TODAY'S PENDING TASKS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(t => (
            <div key={t.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-purple)' }}>{t.priority || 'Normal'}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tasks for today 🎉</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = pendingToday.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          TASK LIST BY PRIORITY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{t.title}</span>
              <strong style={{ color: 'var(--accent-purple)' }}>{t.priority || 'Normal'}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tasks for today 🎉</div>}
        </div>
      </div>
    );
  }

  const items = pendingToday.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE TASKS OVERVIEW
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Due: {t.dueTime || 'Today'}</div>
            </div>
            <strong style={{ color: 'var(--accent-purple)' }}>{t.priority || 'Normal'}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tasks for today 🎉</div>}
      </div>
    </div>
  );
}

// 9. OVERDUE TASKS (S, W, T, L)
export function OverdueTasksWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  const overdueTask = overdueTasks[0];

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 1;
    const diff = new Date() - new Date(dueDate);
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = overdueTasks.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          URGENT OVERDUE TASKS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(t => (
            <div key={t.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-danger)', fontWeight: '700' }}>{getDaysOverdue(t.dueDate)}d overdue</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No overdue tasks 👍</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = overdueTasks.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          OVERDUE TASKS LIST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{t.title}</span>
              <strong style={{ color: 'var(--accent-danger)' }}>{getDaysOverdue(t.dueDate)}d late</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No overdue tasks 👍</div>}
        </div>
      </div>
    );
  }

  const items = overdueTasks.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE OVERDUE OVERVIEW
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-danger)' }}>Due: {formatDate(t.dueDate)}</div>
            </div>
            <strong style={{ color: 'var(--accent-danger)' }}>{getDaysOverdue(t.dueDate)} days late</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No overdue tasks 👍</div>}
      </div>
    </div>
  );
}

// 10. UPCOMING REMINDERS (S, W, T, L)
export function UpcomingRemindersWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingReminders = (tasks || []).filter(t => !t.completed && t.dueDate && t.dueDate >= todayStr);
  const nearestReminder = upcomingReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = upcomingReminders.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          UPCOMING REMINDERS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(rem => (
            <div key={rem.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rem.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-warning)' }}>{formatDate(rem.dueDate)}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No reminders</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = upcomingReminders.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          REMINDER TIMELINE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(rem => (
            <div key={rem.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{rem.title}</span>
              <strong style={{ color: 'var(--accent-warning)' }}>{formatDate(rem.dueDate)}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No reminders</div>}
        </div>
      </div>
    );
  }

  const items = upcomingReminders.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE REMINDERS SCHEDULE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(rem => (
          <div key={rem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{rem.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Date: {formatDate(rem.dueDate)}</div>
            </div>
            <strong style={{ color: 'var(--accent-warning)' }}>{rem.dueTime || 'All Day'}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No reminders</div>}
      </div>
    </div>
  );
}

// 11. NOTIFICATIONS (S, W, T, L)
export function UnreadNotificationsWidget({ widgetSize = 'S' }) {
  const { notifications } = useNotifications();
  const latestNotification = (notifications || [])[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = (notifications || []).slice(0, 2);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          LATEST NOTIFICATIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(n => (
            <div key={n.id || n.title}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || 'Alert'}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notifications</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = (notifications || []).slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          NOTIFICATIONS FEED
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(n => (
            <div key={n.id || n.title} style={{ fontSize: '12px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{n.title || 'System Alert'}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{n.message}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notifications</div>}
        </div>
      </div>
    );
  }

  const items = (notifications || []).slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE NOTIFICATION CENTER
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(n => (
          <div key={n.id || n.title} style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{n.title || 'System Alert'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.message}</div>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notifications</div>}
      </div>
    </div>
  );
}

// 12. HABIT PROGRESS (S, W, T, L)
export function HabitTrackerWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const habits = (tasks || []).filter(t => t.category === 'HABIT' || t.isHabit);
  const completedCount = habits.filter(h => h.completed).length;
  const completionPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="HABIT PROGRESS" bgTint="rgba(16, 185, 129, 0.08)" borderTint="rgba(16, 185, 129, 0.18)">
        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-success, #10B981)', textAlign: 'center' }}>
          {completionPct}%
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    const items = habits.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ACTIVE HABIT PROGRESS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(h => (
            <div key={h.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-success)' }}>{h.completed ? '100%' : '0%'}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active habits</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = habits.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          HABIT COMPLETION LIST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(h => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{h.title}</span>
              <strong style={{ color: 'var(--accent-success)' }}>{h.completed ? 'Done' : 'Pending'}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active habits</div>}
        </div>
      </div>
    );
  }

  const items = habits.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE HABIT OVERVIEW
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(h => (
          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{h.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Status: {h.completed ? 'Completed Today' : 'Pending'}</div>
            </div>
            <strong style={{ color: 'var(--accent-success)' }}>{h.completed ? '100%' : '0%'}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active habits</div>}
      </div>
    </div>
  );
}

// 13. HABIT STREAK (S, W, T, L)
export function HabitStreakWidget({ widgetSize = 'S' }) {
  const streakDays = parseInt(localStorage.getItem('daysync_habit_streak') || '10', 10);

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="HABIT STREAK" bgTint="rgba(249, 115, 22, 0.08)" borderTint="rgba(249, 115, 22, 0.18)">
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-warning, #F97316)', textAlign: 'center' }}>
          {streakDays} Days
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          TOP STREAKS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>CURRENT</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-warning)' }}>{streakDays} Days</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>BEST STREAK</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{streakDays + 4} Days</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>GOAL</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)' }}>30 Days</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          STREAK BREAKDOWN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current Active Streak</span>
            <strong style={{ color: 'var(--accent-warning)' }}>{streakDays} Days</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>All-Time Best</span>
            <strong>{streakDays + 4} Days</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Started Date</span>
            <span>Aug 1, 2026</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE STREAK OVERVIEW
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Streak</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-warning)' }}>{streakDays} Days</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Best Streak</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{streakDays + 4} Days</div>
        </div>
      </div>
    </div>
  );
}

// 14. TODAY'S PROGRESS (S, W, T, L)
export function DailyProgressWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr || !t.dueDate);
  const doneCount = todayTasks.filter(t => t.completed).length;
  const progressPct = todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 75;

  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="TODAY'S PROGRESS" bgTint="rgba(99, 102, 241, 0.08)" borderTint="rgba(99, 102, 241, 0.18)">
        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-primary, #6366F1)', textAlign: 'center' }}>
          {progressPct}%
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          PROGRESS BREAKDOWN
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>OVERALL</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)' }}>{progressPct}%</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>TASKS</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{doneCount}/{todayTasks.length || 1}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>HABITS</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-success)' }}>100%</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          DAILY PROGRESS STATS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
            <strong style={{ color: 'var(--accent-primary)' }}>{progressPct}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tasks Completed</span>
            <strong>{doneCount} / {todayTasks.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Habits Completed</span>
            <strong style={{ color: 'var(--accent-success)' }}>All Done</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE DAILY PROGRESS PANEL
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Completion</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)' }}>{progressPct}%</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasks Count</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{doneCount} / {todayTasks.length}</div>
        </div>
      </div>
    </div>
  );
}

// 15. BIRTHDAYS (S, W, T, L)
export function BirthdaysMeetingsWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const birthdays = (tasks || []).filter(t => t.title && t.title.toLowerCase().includes('birthday'));
  const nearestBirthday = birthdays[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = birthdays.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          UPCOMING BIRTHDAYS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(b => (
            <div key={b.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-pink)' }}>{formatDate(b.dueDate)}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No birthdays</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = birthdays.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          BIRTHDAYS LIST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{b.title}</span>
              <strong style={{ color: 'var(--accent-pink)' }}>{formatDate(b.dueDate)}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No birthdays</div>}
        </div>
      </div>
    );
  }

  const items = birthdays.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE BIRTHDAY LIST
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(b => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{b.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Date: {formatDate(b.dueDate)}</div>
            </div>
            <strong style={{ color: 'var(--accent-pink)' }}>Upcoming</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No birthdays</div>}
      </div>
    </div>
  );
}

// 16. MEETINGS (S, W, T, L)
export function UpcomingMeetingsWidget({ widgetSize = 'S' }) {
  const { tasks } = useLuna();
  const meetings = (tasks || []).filter(t => t.category === 'Meeting' || (t.title && t.title.toLowerCase().includes('meeting')));
  const nearestMeeting = meetings[0];

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    const items = meetings.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          UPCOMING MEETINGS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`, gap: '8px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(m => (
            <div key={m.id}>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)' }}>{m.dueTime || 'Today'}</div>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No meetings</div>}
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    const items = meetings.slice(0, 3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          MEETING SCHEDULE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          {items.length > 0 ? items.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{m.title}</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{m.dueTime || 'Today'}</strong>
            </div>
          )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No meetings</div>}
        </div>
      </div>
    );
  }

  const items = meetings.slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE MEETINGS OVERVIEW
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
        {items.length > 0 ? items.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{m.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(m.dueDate)}</div>
            </div>
            <strong style={{ color: 'var(--accent-primary)' }}>{m.dueTime || 'Scheduled'}</strong>
          </div>
        )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No meetings</div>}
      </div>
    </div>
  );
}

// 17. TIME & DATE (S, W, T, L)
export function ClockDateWidget({ widgetSize = 'S' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const dayStr = time.toLocaleDateString('en-US', { weekday: 'long' });
  const timezoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          CLOCK & TIMEZONE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>TIME</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{timeStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>DATE</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>{dateStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>DAY</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>{dayStr}</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          TIME DETAILS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center' }}>{timeStr}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date</span>
            <strong>{dateStr} ({dayStr})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Timezone</span>
            <span>{timezoneStr}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE TIME & CALENDAR PANEL
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Time</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{timeStr}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calendar Date</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-primary)' }}>{dateStr}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Day of Week</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{dayStr}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Timezone</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{timezoneStr}</div>
        </div>
      </div>
    </div>
  );
}

// 18. SHORTCUTS (S, W, T, L)
export function QuickAddWidget({ widgetSize = 'S' }) {
  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="SHORTCUT" bgTint="rgba(139, 92, 246, 0.08)" borderTint="rgba(139, 92, 246, 0.18)">
        <Link to="/app/task" className="btn-primary" style={{ fontSize: '11.5px', padding: '6px 10px', textDecoration: 'none', justifyContent: 'center', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
          <Plus size={13} /> Add Task
        </Link>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          QUICK ACTION SHORTCUTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 8px' }}>
          <Link to="/app/task" className="btn-primary" style={{ fontSize: '11px', padding: '6px 4px', textDecoration: 'none', justifyContent: 'center' }}>+ Task</Link>
          <Link to="/app/expenses" className="btn-secondary" style={{ fontSize: '11px', padding: '6px 4px', textDecoration: 'none', justifyContent: 'center' }}>+ Spend</Link>
          <Link to="/app/plans" className="btn-secondary" style={{ fontSize: '11px', padding: '6px 4px', textDecoration: 'none', justifyContent: 'center' }}>+ Plan</Link>
          <Link to="/app/splits" className="btn-secondary" style={{ fontSize: '11px', padding: '6px 4px', textDecoration: 'none', justifyContent: 'center' }}>+ Split</Link>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ACTION SHORTCUTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <Link to="/app/task" className="btn-primary" style={{ fontSize: '12px', padding: '8px 12px', textDecoration: 'none', justifyContent: 'center' }}>+ Add New Task</Link>
          <Link to="/app/expenses" className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', textDecoration: 'none', justifyContent: 'center' }}>+ Log New Expense</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE SHORTCUT PANEL
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <Link to="/app/task" className="btn-primary" style={{ fontSize: '12px', padding: '10px', textDecoration: 'none', justifyContent: 'center' }}>+ Add Task</Link>
        <Link to="/app/expenses" className="btn-secondary" style={{ fontSize: '12px', padding: '10px', textDecoration: 'none', justifyContent: 'center' }}>+ Add Expense</Link>
        <Link to="/app/plans" className="btn-secondary" style={{ fontSize: '12px', padding: '10px', textDecoration: 'none', justifyContent: 'center' }}>+ Add Plan</Link>
        <Link to="/app/splits" className="btn-secondary" style={{ fontSize: '12px', padding: '10px', textDecoration: 'none', justifyContent: 'center' }}>+ Add Split</Link>
      </div>
    </div>
  );
}

// 19. LUNA FOCUS (S, W, T, L)
export function LunaSuggestionWidget({ widgetSize = 'S' }) {
  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="LUNA FOCUS" labelColor="var(--accent-primary)" bgTint="rgba(168, 85, 247, 0.08)" borderTint="rgba(168, 85, 247, 0.18)">
        <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          Focus on your top priority today.
        </div>
      </SmallWidgetWrapper>
    );
  }

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          LUNA INSIGHT
        </div>
        <div style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Focus on your top priority task today.</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Completing high priority items early keeps your day smooth.</div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          LUNA DAILY FOCUS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>What to focus on</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Address pending high-priority tasks first before starting new expenses or plans.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE LUNA AI CONTEXTUAL INSIGHT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Daily Focus Recommendation</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Focus on your top priority task today. Completing high-priority items keeps your DaySync progress high.</div>
      </div>
    </div>
  );
}

// 20. IMPORTANT PERSON SPLITS (S, W, T, L)
export function NextImportantItemWidget({ widgetSize = 'S' }) {
  const importantPerson = JSON.parse(localStorage.getItem('daysync_important_person_split') || '{"name":"Alex","owedAmount":45.00}');

  if (widgetSize === 'S') {
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

  if (widgetSize === 'W') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          IMPORTANT PERSON SPLIT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '10px 12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>PERSON</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{importantPerson.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>OWED TO YOU</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-success)' }}>${importantPerson.owedAmount.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Pending</div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetSize === 'T') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          PERSON SPLIT DETAILS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Person Name</span>
            <strong>{importantPerson.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Amount Owed</span>
            <strong style={{ color: 'var(--accent-success)' }}>${importantPerson.owedAmount.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Settlement Status</span>
            <span>Unsettled</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        COMPLETE PERSON SPLIT REPORT
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.16)', borderRadius: 'var(--radius-sm, 8px)', padding: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Person</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{importantPerson.name}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Owed to You</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-success)' }}>${importantPerson.owedAmount.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export function AskLunaWidget({ widgetSize = 'S' }) {
  if (widgetSize === 'S') {
    return (
      <SmallWidgetWrapper label="ASK LUNA AI" bgTint="rgba(168, 85, 247, 0.08)" borderTint="rgba(168, 85, 247, 0.18)">
        <Link to="/app/luna" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none', justifyContent: 'center' }}>
          Open Luna Chat
        </Link>
      </SmallWidgetWrapper>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '6px' }}>Ask Luna AI</div>
      <Link to="/app/luna" className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', width: 'fit-content' }}>
        Open Luna Assistant
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
