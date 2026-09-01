import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { ErrorState, StaleIndicator } from '../../components/common/ErrorState';
import { ReactionBadge } from '../../components/common/ReactionBadge';
import { calculateEndDate, formatHumanDate, parseDateComponents, parseDuration } from '../../services/dateUtils';
import { Repeat, ArrowRight, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { RecurringManager } from '../../components/planner/RecurringManager';
import { EmptyState } from '../../components/common/EmptyState';

export function PlansPage() {
  const navigate = useNavigate();
  const { expenses, errors, resourceLoading, fetchExpenses, isFromCache, lastSyncedAt } = useLuna();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Filter expenses that represent plans/recurring entries
  const plans = useMemo(() => {
    return (expenses || []).filter(e => {
      return (
        e.isPlan ||
        e.isRecurring ||
        Boolean(e.duration) ||
        Boolean(e.durationValue) ||
        Boolean(e.frequency) ||
        ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category)
      );
    });
  }, [expenses]);

  const categories = ['All', 'Subscriptions', 'Recharges', 'Utilities', 'Warranties', 'Services'];

  const getEffectiveEndDate = (plan) => {
    if (plan.endDate) return plan.endDate;
    if (plan.nextDueDate) return plan.nextDueDate;
    return calculateEndDate(plan.startDate || plan.date, plan.durationValue ? { value: plan.durationValue, unit: plan.durationUnit } : plan.duration, plan.frequency);
  };

  const getDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 999;
    try {
      const targetComp = parseDateComponents(endDateStr);
      const todayComp = parseDateComponents(new Date().toISOString().split('T')[0]);

      const targetDate = new Date(Date.UTC(targetComp.year, targetComp.month - 1, targetComp.day)).getTime();
      const todayDate = new Date(Date.UTC(todayComp.year, todayComp.month - 1, todayComp.day)).getTime();

      const diff = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
      return diff;
    } catch (e) {
      return 999;
    }
  };

  const sortedAndFilteredPlans = useMemo(() => {
    const matched = plans.filter(p => {
      const titleMatch = (p.description || p.category || '').toLowerCase().includes(search.toLowerCase());

      if (filter === 'All') return titleMatch;
      if (filter === 'Subscriptions') return titleMatch && (p.category === 'Subscriptions' || p.planType === 'Subscription');
      if (filter === 'Recharges') return titleMatch && (p.category === 'Recharges' || p.planType === 'Recharge');
      if (filter === 'Utilities') return titleMatch && (p.category === 'Electricity Bill' || p.planType === 'Utility');
      if (filter === 'Warranties') return titleMatch && p.planType === 'Warranty';
      if (filter === 'Services') return titleMatch && p.planType === 'Service';
      return titleMatch;
    });

    // Grouping priority: Ending Soon (1) -> Active (2) -> Expired (3)
    return matched.sort((a, b) => {
      const endA = getEffectiveEndDate(a);
      const endB = getEffectiveEndDate(b);
      const daysA = getDaysRemaining(endA);
      const daysB = getDaysRemaining(endB);

      const getGroup = (d) => {
        if (d >= 0 && d <= 5) return 1; // Ending Soon
        if (d > 5) return 2;             // Active
        return 3;                        // Expired
      };

      const groupA = getGroup(daysA);
      const groupB = getGroup(daysB);

      if (groupA !== groupB) return groupA - groupB;
      return daysA - daysB;
    });
  }, [plans, search, filter]);

  // Financial summary of plans
  const totalMonthlyPlanCost = useMemo(() => {
    return plans.reduce((acc, curr) => {
      const amt = parseFloat(curr.amount || 0);
      const durInfo = parseDuration(curr.durationValue ? { value: curr.durationValue, unit: curr.durationUnit } : curr.duration, curr.frequency);
      if (durInfo.durationUnit === 'years') return acc + (amt / (durInfo.durationValue * 12));
      if (durInfo.durationUnit === 'days') return acc + (amt * (30 / durInfo.durationValue));
      return acc + (amt / (durInfo.durationValue || 1));
    }, 0);
  }, [plans]);

  const endingSoonCount = useMemo(() => {
    return plans.filter(p => {
      const endDate = getEffectiveEndDate(p);
      const rem = getDaysRemaining(endDate);
      return rem !== null && rem >= 0 && rem <= 5;
    }).length;
  }, [plans]);

  const getPlanDurationLabel = (plan) => {
    if (plan.duration) return plan.duration;
    if (plan.durationValue && plan.durationUnit) return `${plan.durationValue} ${plan.durationUnit}`;
    return '1 month';
  };

  const getStatusDisplay = (daysRem) => {
    if (daysRem < 0) {
      return { status: 'EXPIRED', text: 'Expired', badgeStyle: { bg: 'rgba(255, 75, 75, 0.15)', color: 'var(--accent-danger)' } };
    }
    if (daysRem === 0) {
      return { status: 'ENDING SOON', text: 'Ends today', badgeStyle: { bg: 'rgba(255, 171, 0, 0.15)', color: 'var(--accent-warning)' } };
    }
    if (daysRem === 1) {
      return { status: 'ENDING SOON', text: 'Ends tomorrow', badgeStyle: { bg: 'rgba(255, 171, 0, 0.15)', color: 'var(--accent-warning)' } };
    }
    if (daysRem <= 5) {
      return { status: 'ENDING SOON', text: `Ends in ${daysRem} days`, badgeStyle: { bg: 'rgba(255, 171, 0, 0.15)', color: 'var(--accent-warning)' } };
    }
    return { status: 'ACTIVE', text: 'Active', badgeStyle: { bg: 'var(--bg-tertiary)', color: 'var(--accent-primary)' } };
  };

  return (
    <div className="page-container plans-page-container">
      {/* Top Header Row: Page Title PLANS & COMMITMENTS */}
      <PageHeaderRow title="PLANS & COMMITMENTS" onSearch={setSearch} />

      {/* Combined 3-Column Plan Summary Stat Card */}
      <div className="glass-card plans-summary-card" style={{ padding: '12px 14px', margin: '8px 0 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', alignItems: 'center' }}>
          <div style={{ padding: '0 4px', borderRight: '1px solid var(--border-color)' }}>
            <span className="plans-summary-label" style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              ACTIVE
            </span>
            <strong className="plans-summary-value" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>
              {plans.length}
            </strong>
          </div>

          <div style={{ padding: '0 4px', borderRight: '1px solid var(--border-color)' }}>
            <span className="plans-summary-label" style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              MONTHLY
            </span>
            <strong className="plans-summary-value" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'block', lineHeight: '1.2' }}>
              ₹{Math.round(totalMonthlyPlanCost).toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ padding: '0 4px' }}>
            <span className="plans-summary-label" style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              ENDING
            </span>
            <strong className="plans-summary-value" style={{ fontSize: '1.25rem', fontWeight: '800', color: endingSoonCount > 0 ? 'var(--accent-warning)' : 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>
              {endingSoonCount}
            </strong>
          </div>
        </div>
      </div>

      {/* RECURRING ITEM MANAGEMENT SECTION */}
      <div className="plans-recurring-section" style={{ marginTop: '16px' }}>
        <RecurringManager />
      </div>
    </div>
  );
}
