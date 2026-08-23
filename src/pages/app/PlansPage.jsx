import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { ErrorState, StaleIndicator } from '../../components/common/ErrorState';
import { Repeat, Calendar, ShieldCheck, ArrowRight, CheckCircle2, Clock, Zap, Tv, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';

export function PlansPage() {
  const { expenses, errors, resourceLoading, fetchExpenses, isFromCache, lastSyncedAt } = useLuna();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Filter expenses that represent plans/recurring entries
  const plans = (expenses || []).filter(e => {
    return (
      e.isPlan ||
      e.isRecurring ||
      Boolean(e.frequency) ||
      ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category)
    );
  });

  const categories = ['All', 'Subscriptions', 'Recharges', 'Utilities', 'Warranties', 'Services'];

  const filteredPlans = plans.filter(p => {
    const titleMatch = (p.description || p.category || '').toLowerCase().includes(search.toLowerCase());

    if (filter === 'All') return titleMatch;
    if (filter === 'Subscriptions') return titleMatch && (p.category === 'Subscriptions' || p.planType === 'Subscription');
    if (filter === 'Recharges') return titleMatch && (p.category === 'Recharges' || p.planType === 'Recharge');
    if (filter === 'Utilities') return titleMatch && (p.category === 'Electricity Bill' || p.planType === 'Utility');
    if (filter === 'Warranties') return titleMatch && p.planType === 'Warranty';
    if (filter === 'Services') return titleMatch && p.planType === 'Service';
    return titleMatch;
  });

  // Financial summary of plans
  const totalMonthlyPlanCost = plans.reduce((acc, curr) => {
    const amt = parseFloat(curr.amount || 0);
    const freq = (curr.frequency || '').toLowerCase();
    if (freq.includes('year')) return acc + (amt / 12);
    if (freq.includes('28')) return acc + (amt * (30 / 28));
    return acc + amt;
  }, 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getDaysRemaining = (endDateStr) => {
    if (!endDateStr) return null;
    try {
      const target = new Date(endDateStr).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      return diff;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <PageHeaderRow title="Plans & Commitments" onSearch={setSearch} />

      {/* VIEW ONLY Disclaimer Banner */}
      <div style={{
        padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="var(--accent-primary)" />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>View-Only Mode:</strong> Plans read directly from your financial records. To add, edit, or cancel a plan, manage it from Expenses.
          </div>
        </div>
        <Link to="/app/expenses" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          Manage in Expenses <ArrowRight size={13} />
        </Link>
      </div>

      {/* Plan Summary Stat Cards */}
      <div className="grid-3" style={{ margin: 'var(--space-sm) 0' }}>
        <div className="glass-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Active Plans</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{plans.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Est. Monthly Cost</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-primary)' }}>₹{Math.round(totalMonthlyPlanCost).toLocaleString('en-IN')}</div>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Upcoming Renewals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-warning)' }}>
            {plans.filter(p => {
              const rem = getDaysRemaining(p.endDate || p.nextDueDate);
              return rem !== null && rem >= 0 && rem <= 7;
            }).length}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="scroll-row">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '5px 14px', borderRadius: 'var(--radius-full)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Repeat size={16} color="var(--accent-primary)" /> RECURRING PLANS ({filteredPlans.length})
          </h3>
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
        ) : filteredPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Repeat size={32} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
            <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
              {search || filter !== 'All' ? 'No matching plans found.' : 'No active plans recorded yet.'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px' }}>
              {search || filter !== 'All' ? 'Try adjusting your search or filters.' : 'Create a recurring expense, recharge, subscription, or warranty in Expenses to view your plans here.'}
            </div>
            {!(search || filter !== 'All') && (
              <Link to="/app/expenses" className="btn-primary" style={{ marginTop: '6px', fontSize: '13px', padding: '8px 16px', textDecoration: 'none' }}>
                Go to Expenses
              </Link>
            )}
          </div>
        ) : (
          <div className="grid-2" style={{ gap: 'var(--space-sm)' }}>
            {filteredPlans.map(plan => {
              const daysRem = getDaysRemaining(plan.endDate || plan.nextDueDate);
              const isExpiringSoon = daysRem !== null && daysRem >= 0 && daysRem <= 5;
              const isExpired = daysRem !== null && daysRem < 0;

              return (
                <div key={plan.id} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: `1px solid ${isExpiringSoon ? 'var(--accent-warning)' : 'var(--border-color)'}`,
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {/* Top Line: Name & Category Badge */}
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
                      background: isExpired ? 'rgba(255, 75, 75, 0.15)' : isExpiringSoon ? 'rgba(255, 171, 0, 0.15)' : 'var(--bg-tertiary)',
                      color: isExpired ? 'var(--accent-danger)' : isExpiringSoon ? 'var(--accent-warning)' : 'var(--accent-primary)',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {isExpired ? <AlertCircle size={12} /> : isExpiringSoon ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                      {isExpired ? 'Expired' : isExpiringSoon ? `Due in ${daysRem} days` : 'Active'}
                    </span>
                  </div>

                  {/* Pricing / Pack Details */}
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                    ₹{parseFloat(plan.amount || 0).toLocaleString('en-IN')}
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      / {plan.frequency || plan.pack || 'month'}
                    </span>
                  </div>

                  {/* Dates Row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                    paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>START DATE</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatDate(plan.startDate || plan.date)}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>END / EXPIRY DATE</span>
                      <strong style={{ color: isExpiringSoon ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                        {formatDate(plan.endDate || plan.nextDueDate)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
