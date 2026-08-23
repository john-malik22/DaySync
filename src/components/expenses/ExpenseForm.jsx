import React, { useState, useMemo } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Calendar, Repeat, X, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { calculateEndDate, parseDuration, formatHumanDate } from '../../services/dateUtils';

const EXPENSE_CATEGORIES = [
  { value: 'Recharges', label: '📱 Recharges (Mobile/DTH)' },
  { value: 'Electricity Bill', label: '⚡ Electricity Bill & Utilities' },
  { value: 'Daily Travelling', label: '🚗 Daily Travelling & Transport' },
  { value: 'Subscriptions', label: '🍿 Subscriptions (Netflix, Cloud)' },
  { value: 'Groceries', label: '🛒 Groceries & Supplies' },
  { value: 'Food', label: '🍔 Dining & Food' },
  { value: 'Shopping', label: '🛍️ Shopping & Apparel' },
  { value: 'Healthcare', label: '🏥 Healthcare & Medical' },
  { value: 'Entertainment', label: '🎟️ Entertainment & Movies' },
  { value: 'Other', label: '🏷️ Other Expenses' }
];

const INCOME_CATEGORIES = [
  { value: 'Salary', label: '💼 Salary & Paycheck' },
  { value: 'Freelance', label: '💻 Freelance & Client Work' },
  { value: 'Pocket Money', label: '🎁 Pocket Money & Allowance' },
  { value: 'Cashback & Rewards', label: '💰 Cashback & Rewards' },
  { value: 'Refunds', label: '🔄 Refunds & Returns' },
  { value: 'Investments', label: '📈 Investments & Dividends' },
  { value: 'Other Income', label: '💵 Other Income' }
];

export function ExpenseForm() {
  const { addExpense } = useLuna();
  const { showToast } = useToast();

  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Recharges');
  const [description, setDescription] = useState('');

  // Plan State (Attached when Done is clicked)
  const [isPlan, setIsPlan] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [planDurationSelect, setPlanDurationSelect] = useState('1 month');
  const [customValue, setCustomValue] = useState('45');
  const [customUnit, setCustomUnit] = useState('days');

  // Modal / Bottom Sheet Transient Panel Draft State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftDurationSelect, setDraftDurationSelect] = useState(planDurationSelect);
  const [draftCustomValue, setDraftCustomValue] = useState(customValue);
  const [draftCustomUnit, setDraftCustomUnit] = useState(customUnit);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute active duration info for saved plan state
  const activeDurationInfo = useMemo(() => {
    if (planDurationSelect === 'custom') {
      const val = Math.max(1, parseInt(customValue, 10) || 1);
      const unit = customUnit || 'days';
      return { durationValue: val, durationUnit: unit, durationStr: `${val} ${unit}` };
    }
    const parsed = parseDuration(planDurationSelect);
    return { durationValue: parsed.durationValue, durationUnit: parsed.durationUnit, durationStr: planDurationSelect };
  }, [planDurationSelect, customValue, customUnit]);

  // Compute calculated end date for saved plan state
  const { calculatedEndDateIso, calculatedHumanDate } = useMemo(() => {
    if (!startDate) return { calculatedEndDateIso: '', calculatedHumanDate: '' };
    const iso = calculateEndDate(startDate, {
      durationValue: activeDurationInfo.durationValue,
      durationUnit: activeDurationInfo.durationUnit
    });
    const human = formatHumanDate(iso);
    return { calculatedEndDateIso: iso, calculatedHumanDate: human };
  }, [startDate, activeDurationInfo]);

  // Compute active duration info for DRAFT modal state
  const draftDurationInfo = useMemo(() => {
    if (draftDurationSelect === 'custom') {
      const val = Math.max(1, parseInt(draftCustomValue, 10) || 1);
      const unit = draftCustomUnit || 'days';
      return { durationValue: val, durationUnit: unit, durationStr: `${val} ${unit}` };
    }
    const parsed = parseDuration(draftDurationSelect);
    return { durationValue: parsed.durationValue, durationUnit: parsed.durationUnit, durationStr: draftDurationSelect };
  }, [draftDurationSelect, draftCustomValue, draftCustomUnit]);

  // Compute calculated end date for DRAFT modal state
  const { draftEndDateIso, draftHumanDate } = useMemo(() => {
    if (!draftStartDate) return { draftEndDateIso: '', draftHumanDate: '' };
    const iso = calculateEndDate(draftStartDate, {
      durationValue: draftDurationInfo.durationValue,
      durationUnit: draftDurationInfo.durationUnit
    });
    const human = formatHumanDate(iso);
    return { draftEndDateIso: iso, draftHumanDate: human };
  }, [draftStartDate, draftDurationInfo]);

  const handleOpenPanel = () => {
    setDraftStartDate(startDate);
    setDraftDurationSelect(planDurationSelect);
    setDraftCustomValue(customValue);
    setDraftCustomUnit(customUnit);
    setIsPanelOpen(true);
  };

  const handleCancelPanel = () => {
    setIsPanelOpen(false);
  };

  const handleDonePanel = () => {
    setStartDate(draftStartDate);
    setPlanDurationSelect(draftDurationSelect);
    setCustomValue(draftCustomValue);
    setCustomUnit(draftCustomUnit);
    setIsPlan(true);
    setIsPanelOpen(false);
  };

  const handleRemovePlan = () => {
    setIsPlan(false);
  };

  const handleTypeSwitch = (type) => {
    setTxType(type);
    if (type === 'income') {
      setCategory('Salary');
      setIsPlan(false);
    } else {
      setCategory('Recharges');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to the internet to save this expense.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        type: txType,
        amount: parseFloat(amount),
        category,
        description: description || (txType === 'income' ? 'Income Received' : category),
        date: startDate || new Date().toISOString().split('T')[0],
        isPlan,
        isRecurring: isPlan,
        durationValue: isPlan ? activeDurationInfo.durationValue : null,
        durationUnit: isPlan ? activeDurationInfo.durationUnit : null,
        duration: isPlan ? activeDurationInfo.durationStr : null,
        startDate: isPlan ? startDate : null,
        endDate: isPlan ? calculatedEndDateIso : null,
        nextDueDate: isPlan ? calculatedEndDateIso : null
      });

      setAmount('');
      setDescription('');
      setIsPlan(false);
      if (showToast) showToast(isPlan ? 'Plan saved successfully.' : 'Transaction saved successfully.', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Couldn\'t save transaction. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="glass-card">
      {/* Top Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>LOG TRANSACTION</h3>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => handleTypeSwitch('expense')}
            disabled={isSubmitting}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: txType === 'expense' ? 'var(--accent-primary)' : 'transparent',
              color: txType === 'expense' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: txType === 'expense' ? '700' : '500', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
            }}
          >
            <ArrowDownRight size={14} /> Spent
          </button>
          <button
            type="button"
            onClick={() => handleTypeSwitch('income')}
            disabled={isSubmitting}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: txType === 'income' ? 'var(--accent-primary)' : 'transparent',
              color: txType === 'income' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: txType === 'income' ? '700' : '500', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
            }}
          >
            <ArrowUpRight size={14} /> Received
          </button>
        </div>
      </div>

      {/* Main Expense / Income Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <div className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr auto', gap: 'var(--space-sm)' }}>
          <input
            type="number"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            {activeCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description (e.g. Netflix, Jio recharge)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            <Plus size={16} /> {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Compact Plan Trigger & Summary Area */}
        {txType === 'expense' && (
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
            {!isPlan ? (
              <button
                type="button"
                onClick={handleOpenPanel}
                style={{
                  background: 'transparent', border: 'none', padding: '4px 0',
                  color: 'var(--accent-primary)', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Repeat size={14} color="var(--accent-primary)" /> Add as a Plan
              </button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.2)', fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  <CheckCircle2 size={16} color="var(--accent-primary)" />
                  <span>Plan details added &bull; <span style={{ color: 'var(--accent-primary)' }}>{activeDurationInfo.durationStr}</span> &bull; Ends {calculatedHumanDate}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleOpenPanel}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px',
                      padding: '3px 8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600'
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePlan}
                    title="Remove Plan"
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {/* PLAN DETAILS MODAL / BOTTOM SHEET PANEL */}
      {isPanelOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <style>{`
            @media (min-width: 640px) {
              .plan-details-panel {
                margin: auto !important;
                border-radius: var(--radius-lg) !important;
                max-width: 440px !important;
              }
            }
          `}</style>

          <div
            className="plan-details-panel"
            style={{
              width: '100%', maxWidth: '500px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              padding: '20px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px',
              animation: 'slideUpPanel 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Panel Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Repeat size={18} color="var(--accent-primary)" /> Plan Details
              </h3>
              <button
                type="button"
                onClick={handleCancelPanel}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel Body Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                  START DATE
                </label>
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', padding: '8px 10px', minHeight: '40px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                  CURRENT PLAN DURATION
                </label>
                <select
                  value={draftDurationSelect}
                  onChange={(e) => setDraftDurationSelect(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', padding: '8px 10px', minHeight: '40px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="28 days">28 days</option>
                  <option value="56 days">56 days</option>
                  <option value="84 days">84 days</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                  <option value="custom">Custom...</option>
                </select>

                {/* Custom Duration Fields */}
                {draftDurationSelect === 'custom' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Length"
                      value={draftCustomValue}
                      onChange={(e) => setDraftCustomValue(e.target.value)}
                      style={{ width: '85px', fontSize: '13px', padding: '6px 10px', minHeight: '36px' }}
                    />
                    <select
                      value={draftCustomUnit}
                      onChange={(e) => setDraftCustomUnit(e.target.value)}
                      style={{ flex: 1, fontSize: '13px', padding: '6px 10px', minHeight: '36px' }}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                  ENDS
                </label>
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)'
                }}>
                  {draftHumanDate || 'Auto Calculated'}
                </div>
              </div>
            </div>

            {/* Panel Footer Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={handleCancelPanel}
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '13px', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDonePanel}
                className="btn-primary"
                style={{ padding: '10px', fontSize: '13px', fontWeight: '700' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
