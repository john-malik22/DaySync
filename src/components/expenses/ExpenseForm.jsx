import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSwitch = (type) => {
    setTxType(type);
    if (type === 'income') {
      setCategory('Salary');
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
        date: new Date().toISOString().split('T')[0]
      });
      setAmount('');
      setDescription('');
      if (showToast) showToast('Transaction saved successfully.', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Couldn\'t save transaction. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h3 style={{ color: 'var(--accent-primary)' }}>LOG TRANSACTION</h3>
        
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

      <form onSubmit={handleSubmit} className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr auto', gap: 'var(--space-sm)' }}>
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
          placeholder="Description (e.g. Jio recharge)"
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
      </form>
    </div>
  );
}
