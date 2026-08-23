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

  // Plan / Recurring fields
  const [isPlan, setIsPlan] = useState(false);
  const [frequency, setFrequency] = useState('Monthly');
  const [duration, setDuration] = useState('12 months');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatic End Date Calculation via Central Utility
  const { calculatedEndDateIso, calculatedHumanDate } = useMemo(() => {
    if (!startDate) return { calculatedEndDateIso: '', calculatedHumanDate: '' };
    const iso = calculateEndDate(startDate, duration, frequency);
    const human = formatHumanDate(iso);
    return { calculatedEndDateIso: iso, calculatedHumanDate: human };
  }, [startDate, frequency, duration]);

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
      const parsedDur = parseDuration(duration, frequency);

      await addExpense({
        type: txType,
        amount: parseFloat(amount),
        category,
        description: description || (txType === 'income' ? 'Income Received' : category),
        date: startDate || new Date().toISOString().split('T')[0],
        isPlan,
        isRecurring: isPlan,
        frequency: isPlan ? frequency : null,
        duration: isPlan ? duration : null,
        durationValue: isPlan ? parsedDur.durationValue : null,
        durationUnit: isPlan ? parsedDur.durationUnit : null,
        startDate: isPlan ? startDate : null,
        endDate: isPlan ? calculatedEndDateIso : null,
        nextDueDate: isPlan ? calculatedEndDateIso : null
      });

      setAmount('');
      setDescription('');
      setIsPlan(false);
      if (showToast) showToast(isPlan ? 'Plan transaction saved successfully.' : 'Transaction saved successfully.', 'success');
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

        {/* Recurring Plan Checkbox (for Expense transactions) */}
        {txType === 'expense' && (
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={isPlan}
                onChange={(e) => setIsPlan(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <Repeat size={14} color="var(--accent-primary)" /> Make this a Recurring Plan / Subscription / Recharge / Warranty
            </label>

            {/* Recurring Plan Options Expansion Block */}
            {isPlan && (
              <div style={{
                marginTop: '10px', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', alignItems: 'center'
              }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>START DATE</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>FREQUENCY / PACK</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="28 Days">28 Days Pack</option>
                    <option value="56 Days">56 Days Pack</option>
                    <option value="84 Days">84 Days Pack</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Every 2 Weeks">Every 2 Weeks</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DURATION</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                  >
                    <option value="12 months">12 Months (1 Year)</option>
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="28 days">28 Days</option>
                    <option value="2 years">2 Years</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CALCULATED END DATE</label>
                  <div style={{
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)'
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
