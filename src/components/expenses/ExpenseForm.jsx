import React, { useState, useMemo } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Calendar, Repeat } from 'lucide-react';
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

  // Simplified Plan / Recurring fields (NO Frequency field)
  const [isPlan, setIsPlan] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [planDurationSelect, setPlanDurationSelect] = useState('1 month');
  const [customValue, setCustomValue] = useState('45');
  const [customUnit, setCustomUnit] = useState('days');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute active durationValue, durationUnit, and display string
  const activeDurationInfo = useMemo(() => {
    if (planDurationSelect === 'custom') {
      const val = Math.max(1, parseInt(customValue, 10) || 1);
      const unit = customUnit || 'days';
      return {
        durationValue: val,
        durationUnit: unit,
        durationStr: `${val} ${unit}`
      };
    }
    const parsed = parseDuration(planDurationSelect);
    return {
      durationValue: parsed.durationValue,
      durationUnit: parsed.durationUnit,
      durationStr: planDurationSelect
    };
  }, [planDurationSelect, customValue, customUnit]);

  // Automatic End Date Calculation via Central Utility
  const { calculatedEndDateIso, calculatedHumanDate } = useMemo(() => {
    if (!startDate) return { calculatedEndDateIso: '', calculatedHumanDate: '' };
    const iso = calculateEndDate(startDate, {
      durationValue: activeDurationInfo.durationValue,
      durationUnit: activeDurationInfo.durationUnit
    });
    const human = formatHumanDate(iso);
    return { calculatedEndDateIso: iso, calculatedHumanDate: human };
  }, [startDate, activeDurationInfo]);

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

        {/* Plan Toggle Checkbox */}
        {txType === 'expense' && (
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={isPlan}
                onChange={(e) => setIsPlan(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <Repeat size={14} color="var(--accent-primary)" /> Add as a Plan / Subscription / Recharge
            </label>

            {/* Plan Details Expansion Block */}
            {isPlan && (
              <div style={{
                marginTop: '10px', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-start'
              }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>START DATE</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '36px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>CURRENT PLAN DURATION</label>
                  <select
                    value={planDurationSelect}
                    onChange={(e) => setPlanDurationSelect(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '36px' }}
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
                  {planDurationSelect === 'custom' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        placeholder="Length"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        style={{ width: '70px', fontSize: '12px', padding: '4px 6px', minHeight: '32px' }}
                      />
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        style={{ flex: 1, fontSize: '12px', padding: '4px 6px', minHeight: '32px' }}
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>END DATE</label>
                  <div style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)'
                  }}>
                    Ends {calculatedHumanDate || 'Auto Calculated'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
