import React, { useState, useMemo } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { calculateEndDate, parseDuration, formatHumanDate } from '../../services/dateUtils';

const EXPENSE_CATEGORIES = [
  { value: 'Recharges', label: '📱 Recharge', ariaLabel: 'Recharge category' },
  { value: 'Electricity Bill', label: '💡 Bills', ariaLabel: 'Bills category' },
  { value: 'Food', label: '🍔 Food', ariaLabel: 'Food category' },
  { value: 'Groceries', label: '🛒 Groceries', ariaLabel: 'Groceries category' },
  { value: 'Shopping', label: '🛍️ Shopping', ariaLabel: 'Shopping category' },
  { value: 'Daily Travelling', label: '🚗 Travel', ariaLabel: 'Travel category' },
  { value: 'Subscriptions', label: '🎬 Subscriptions', ariaLabel: 'Subscriptions category' },
  { value: 'Healthcare', label: '❤️ Health', ariaLabel: 'Health category' },
  { value: 'Entertainment', label: '🎟️ Entertainment', ariaLabel: 'Entertainment category' },
  { value: 'Other', label: '📦 Other', ariaLabel: 'Other category' }
];

const INCOME_CATEGORIES = [
  { value: 'Salary', label: '💼 Salary', ariaLabel: 'Salary category' },
  { value: 'Freelance', label: '💻 Freelance', ariaLabel: 'Freelance category' },
  { value: 'Pocket Money', label: '🎁 Allowance', ariaLabel: 'Allowance category' },
  { value: 'Cashback & Rewards', label: '💰 Cashback', ariaLabel: 'Cashback category' },
  { value: 'Refunds', label: '🔄 Refunds', ariaLabel: 'Refunds category' },
  { value: 'Investments', label: '📈 Investments', ariaLabel: 'Investments category' },
  { value: 'Other Income', label: '💵 Other', ariaLabel: 'Other Income category' }
];

export function ExpenseForm({ onSuccess }) {
  const { addExpense } = useLuna();
  const { showToast } = useToast();

  const [txType, setTxType] = useState('expense'); // 'expense' | 'income'
  const [addAs, setAddAs] = useState('transaction'); // 'transaction' | 'plan' | 'subscription' | 'recharge'

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Recharges');
  const [description, setDescription] = useState('');

  // Plan fields
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [planDurationSelect, setPlanDurationSelect] = useState('1 month');
  const [customValue, setCustomValue] = useState('45');
  const [customUnit, setCustomUnit] = useState('days');

  // Subscription fields
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [renewalDate, setRenewalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [autoRenew, setAutoRenew] = useState(true);

  // Recharge fields
  const [operator, setOperator] = useState('Jio');
  const [phoneOrAccount, setPhoneOrAccount] = useState('');
  const [rechargeValidity, setRechargeValidity] = useState('28 days');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute active durationValue, durationUnit, and display string for Plan & Recharge
  const activeDurationInfo = useMemo(() => {
    const activeDuration = addAs === 'recharge' ? rechargeValidity : planDurationSelect;
    if (activeDuration === 'custom') {
      const val = Math.max(1, parseInt(customValue, 10) || 1);
      const unit = customUnit || 'days';
      return {
        durationValue: val,
        durationUnit: unit,
        durationStr: `${val} ${unit}`
      };
    }
    const parsed = parseDuration(activeDuration);
    return {
      durationValue: parsed.durationValue,
      durationUnit: parsed.durationUnit,
      durationStr: activeDuration
    };
  }, [addAs, planDurationSelect, rechargeValidity, customValue, customUnit]);

  // Automatic End Date Calculation
  const { calculatedEndDateIso, calculatedHumanDate } = useMemo(() => {
    const start = addAs === 'subscription' ? renewalDate : startDate;
    if (!start) return { calculatedEndDateIso: '', calculatedHumanDate: '' };
    const iso = calculateEndDate(start, {
      durationValue: activeDurationInfo.durationValue,
      durationUnit: activeDurationInfo.durationUnit
    });
    const human = formatHumanDate(iso);
    return { calculatedEndDateIso: iso, calculatedHumanDate: human };
  }, [addAs, startDate, renewalDate, activeDurationInfo]);

  const handleTypeSwitch = (type) => {
    setTxType(type);
    if (type === 'income') {
      setCategory('Salary');
      setAddAs('transaction');
    } else {
      setCategory('Recharges');
    }
  };

  const handleAddAsChange = (mode) => {
    setAddAs(mode);
    if (mode === 'subscription') {
      setCategory('Subscriptions');
    } else if (mode === 'recharge') {
      setCategory('Recharges');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to the internet to save.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isPlan = addAs !== 'transaction';
      let payloadDescription = description;
      if (!payloadDescription) {
        if (addAs === 'recharge') {
          payloadDescription = `${operator} Recharge (${activeDurationInfo.durationStr})`;
        } else if (addAs === 'subscription') {
          payloadDescription = `Subscription (${billingCycle})`;
        } else {
          payloadDescription = txType === 'income' ? 'Income Received' : category;
        }
      }

      await addExpense({
        type: txType,
        amount: parseFloat(amount),
        category,
        description: payloadDescription,
        date: startDate || new Date().toISOString().split('T')[0],
        isPlan,
        isRecurring: isPlan,
        addAsMode: addAs,
        durationValue: isPlan ? activeDurationInfo.durationValue : null,
        durationUnit: isPlan ? activeDurationInfo.durationUnit : null,
        duration: isPlan ? activeDurationInfo.durationStr : null,
        startDate: isPlan ? startDate : null,
        endDate: isPlan ? calculatedEndDateIso : null,
        nextDueDate: isPlan ? calculatedEndDateIso : null,
        meta: {
          addAs,
          billingCycle: addAs === 'subscription' ? billingCycle : null,
          autoRenew: addAs === 'subscription' ? autoRenew : null,
          operator: addAs === 'recharge' ? operator : null,
          phoneOrAccount: addAs === 'recharge' ? phoneOrAccount : null
        }
      });

      setAmount('');
      setDescription('');
      setPhoneOrAccount('');
      setAddAs('transaction');
      if (showToast) {
        const labels = { transaction: 'Transaction', plan: 'Plan', subscription: 'Subscription', recharge: 'Recharge' };
        showToast(`${labels[addAs] || 'Item'} saved successfully.`, 'success');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      if (showToast) showToast(err.message || 'Couldn\'t save transaction. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header Row: Title on Left + Spent/Received Toggle on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '13.5px', fontWeight: '800', letterSpacing: '0.05em' }}>
          LOG TRANSACTION
        </h3>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)', height: '34px' }}>
          <button
            type="button"
            onClick={() => handleTypeSwitch('expense')}
            disabled={isSubmitting}
            style={{
              padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: txType === 'expense' ? 'var(--accent-primary)' : 'transparent',
              color: txType === 'expense' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: txType === 'expense' ? '700' : '500', fontSize: '11.5px',
              display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
            }}
          >
            <ArrowDownRight size={13} /> Spent
          </button>
          <button
            type="button"
            onClick={() => handleTypeSwitch('income')}
            disabled={isSubmitting}
            style={{
              padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: txType === 'income' ? 'var(--accent-primary)' : 'transparent',
              color: txType === 'income' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: txType === 'income' ? '700' : '500', fontSize: '11.5px',
              display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
            }}
          >
            <ArrowUpRight size={13} /> Received
          </button>
        </div>
      </div>

      {/* Row 2: Add As Option Toggle (Only shown for Spent / Expense type) */}
      {txType === 'expense' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Add as
          </span>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            {[
              { id: 'transaction', label: 'Transaction' },
              { id: 'plan', label: 'Plan' },
              { id: 'subscription', label: 'Subscription' },
              { id: 'recharge', label: 'Recharge' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAddAsChange(opt.id)}
                disabled={isSubmitting}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: addAs === opt.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: addAs === opt.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: addAs === opt.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: addAs === opt.id ? '700' : '500',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Amount, Category, Description Main Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>AMOUNT (₹)</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '36px', fontSize: '13px' }}
            required
            autoFocus
          />
        </div>

        <div>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '36px', fontSize: '12px' }}
          >
            {activeCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>DESCRIPTION</label>
          <input
            type="text"
            placeholder="e.g. Jio recharge, Netflix"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '36px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Conditionally Revealed Mode Fields */}
      {/* 1. PLAN MODE */}
      {addAs === 'plan' && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px', alignItems: 'center', marginTop: '2px'
        }}>
          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PLAN DURATION</label>
            <select
              value={planDurationSelect}
              onChange={(e) => setPlanDurationSelect(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            >
              <option value="28 days">28 days</option>
              <option value="56 days">56 days</option>
              <option value="84 days">84 days</option>
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="custom">Custom...</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>AUTO END DATE</label>
            <div style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)',
              minHeight: '34px', display: 'flex', alignItems: 'center'
            }}>
              Ends {calculatedHumanDate || 'Auto Calculated'}
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBSCRIPTION MODE */}
      {addAs === 'subscription' && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px', alignItems: 'center', marginTop: '2px'
        }}>
          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>BILLING CYCLE</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>RENEWAL DATE</label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>AUTO-RENEWAL</label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer',
              color: 'var(--text-primary)', fontWeight: '600', minHeight: '34px', padding: '0 4px'
            }}>
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--accent-primary)' }}
              />
              Auto-Renew Active
            </label>
          </div>
        </div>
      )}

      {/* 3. RECHARGE MODE */}
      {addAs === 'recharge' && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px', alignItems: 'center', marginTop: '2px'
        }}>
          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>OPERATOR / PROVIDER</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            >
              <option value="Jio">Jio</option>
              <option value="Airtel">Airtel</option>
              <option value="Vi">Vi (Vodafone Idea)</option>
              <option value="BSNL">BSNL</option>
              <option value="Tata Play">Tata Play / DTH</option>
              <option value="Electricity">Electricity Board</option>
              <option value="Other">Other Provider</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PHONE / ACCOUNT NO.</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={phoneOrAccount}
              onChange={(e) => setPhoneOrAccount(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PLAN VALIDITY</label>
            <select
              value={rechargeValidity}
              onChange={(e) => setRechargeValidity(e.target.value)}
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
            >
              <option value="28 days">28 Days</option>
              <option value="56 days">56 Days</option>
              <option value="84 days">84 Days</option>
              <option value="365 days">365 Days</option>
              <option value="1 month">1 Month</option>
            </select>
          </div>
        </div>
      )}

      {/* Save Action Button */}
      <button
        type="submit"
        className="btn-primary"
        disabled={isSubmitting}
        style={{ width: '100%', minHeight: '36px', fontSize: '13px', justifyContent: 'center', marginTop: '2px' }}
      >
        <Plus size={15} /> {isSubmitting ? 'Saving...' : addAs === 'plan' ? 'Save Plan' : addAs === 'subscription' ? 'Save Subscription' : addAs === 'recharge' ? 'Save Recharge' : 'Save Transaction'}
      </button>
    </form>
  );
}
