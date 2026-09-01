import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { ErrorState, StaleIndicator } from '../../components/common/ErrorState';
import { ReactionBadge } from '../../components/common/ReactionBadge';
import { calculateEndDate, formatHumanDate, parseDateComponents, parseDuration } from '../../services/dateUtils';
import { Repeat, ArrowRight, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { RecurringManager } from '../../components/planner/RecurringManager';

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
    <div className="page-container">
      {/* Top Header Row: Page Title PLANS & COMMITMENTS */}
      <PageHeaderRow title="PLANS & COMMITMENTS" onSearch={setSearch} />

      {/* Combined 3-Column Plan Summary Stat Card */}
      <div className="glass-card" style={{ padding: '14px 16px', margin: '8px 0 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', alignItems: 'center' }}>
          <div style={{ padding: '0 8px', borderRight: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              Active
            </span>
            <strong style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>
              {plans.length}
            </strong>
          </div>

          <div style={{ padding: '0 8px', borderRight: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              Monthly
            </span>
            <strong style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'block', lineHeight: '1.2' }}>
              ₹{Math.round(totalMonthlyPlanCost).toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ padding: '0 8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', textTransform: 'uppercase' }}>
              Ending Soon
            </span>
            <strong style={{ fontSize: '1.3rem', fontWeight: '800', color: endingSoonCount > 0 ? 'var(--accent-warning)' : 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>
              {endingSoonCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="scroll-row" style={{ marginBottom: '16px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              background: filter === cat ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${filter === cat ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              fontSize: '12px', cursor: 'pointer', fontWeight: filter === cat ? '700' : '500'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Plans Display Container */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '14px', fontWeight: '800', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Repeat size={16} color="var(--accent-primary)" /> RECURRING PLANS ({sortedAndFilteredPlans.length})
            </h3>
            <ReactionBadge category="PLANS" data={{ activePlansCount: plans.length, daysRemaining: endingSoonCount > 0 ? 3 : 10 }} seed={plans.length} />
          </div>
          {isFromCache?.expenses && <StaleIndicator timestamp={lastSyncedAt?.expenses} />}
        </div>

        {errors?.expenses && !isFromCache?.expenses ? (
          <ErrorState
            title={errors.expenses.title}
            message={errors.expenses.message}
            onRetry={fetchExpenses}
            isRetrying={resourceLoading?.expenses}
          />
        ) : resourceLoading?.expenses && plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading plans...
          </div>
        ) : sortedAndFilteredPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Repeat size={32} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
            <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
              {search || filter !== 'All' ? 'No matching plans found.' : 'No active plans recorded yet.'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px' }}>
              {search || filter !== 'All' ? 'Try adjusting your search or filters.' : 'Add your subscriptions, recharges, utilities, or warranties to track your plans.'}
            </div>
            <button type="button" onClick={() => navigate('/app/expenses')} className="btn-primary" style={{ marginTop: '6px', fontSize: '13px', padding: '8px 16px' }}>
              Add a Plan
            </button>
          </div>
        ) : (
          <div className="plans-desktop-grid">
            {sortedAndFilteredPlans.map(plan => {
              const startDateIso = plan.startDate || plan.date;
              const endDateIso = getEffectiveEndDate(plan);
              const daysRem = getDaysRemaining(endDateIso);
              const { status, text, badgeStyle } = getStatusDisplay(daysRem);
              const isExpiringSoon = status === 'ENDING SOON';
              const isExpired = status === 'EXPIRED';

              return (
                <div key={plan.id} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: `1px solid ${isExpiringSoon ? 'var(--accent-warning)' : isExpired ? 'rgba(255, 75, 75, 0.4)' : 'var(--border-color)'}`,
                  display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'start'
                }}>
                  {/* Top Row: Plan Name & Active Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {plan.description || plan.category}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {plan.category || 'Recurring Commitment'}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px',
                      background: badgeStyle.bg, color: badgeStyle.color,
                      display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0
                    }}>
                      {isExpired ? <AlertCircle size={12} /> : isExpiringSoon ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                      {status === 'ACTIVE' ? 'Active' : text}
                    </span>
                  </div>

                  {/* Pricing & Current Period Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      ₹{parseFloat(plan.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                      Current: {getPlanDurationLabel(plan)}
                    </div>
                  </div>

                  {/* Bottom Information Row: START DATE & NEXT PAYMENT / EXPIRY */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                    paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '2px' }}>START DATE</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>{formatHumanDate(startDateIso)}</strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.04em', marginBottom: '2px' }}>NEXT PAYMENT / EXPIRY</span>
                      <strong style={{ color: isExpiringSoon ? 'var(--accent-warning)' : isExpired ? 'var(--accent-danger)' : 'var(--text-primary)', fontSize: '12.5px' }}>
                        {formatHumanDate(endDateIso)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECURRING ITEM MANAGEMENT SECTION */}
      <div style={{ marginTop: '20px' }}>
        <RecurringManager />
      </div>
    </div>
  );
}
