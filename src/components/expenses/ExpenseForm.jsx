import React, { useState } from 'react';
import { Plus, Edit2, Check, X, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

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
  const { expenses, addExpense, updateExpense, deleteExpense } = useLuna();
  
  // Transaction Mode: 'expense' | 'income'
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Recharges');
  const [description, setDescription] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState(null);
  const [editTxType, setEditTxType] = useState('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Recharges');
  const [editDescription, setEditDescription] = useState('');

  const handleTypeSwitch = (type) => {
    setTxType(type);
    if (type === 'income') {
      setCategory('Salary');
    } else {
      setCategory('Recharges');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    addExpense({
      type: txType,
      amount: parseFloat(amount),
      category,
      description: description || (txType === 'income' ? 'Income Received' : category),
      date: new Date().toISOString().split('T')[0]
    });
    setAmount('');
    setDescription('');
  };

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditTxType(exp.type || 'expense');
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
    setEditDescription(exp.description);
  };

  const handleSaveEdit = async (id) => {
    if (!editAmount) return;
    await updateExpense(id, {
      type: editTxType,
      amount: parseFloat(editAmount),
      category: editCategory,
      description: editDescription
    });
    setEditingId(null);
  };

  const activeCategories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Log Financial Entry Form */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3>Log Transaction</h3>
          
          {/* Toggle Switch */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                background: txType === 'expense' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: txType === 'expense' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                fontWeight: txType === 'expense' ? '700' : '500', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
              }}
            >
              <ArrowDownRight size={15} /> Spent (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                background: txType === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: txType === 'income' ? 'var(--accent-success)' : 'var(--text-secondary)',
                fontWeight: txType === 'income' ? '700' : '500', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
              }}
            >
              <ArrowUpRight size={15} /> Received (Income)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid-3" style={{ gridTemplateColumns: '1fr 1.2fr 1.5fr auto', gap: 'var(--space-2)' }}>
          <input
            type="number"
            placeholder={txType === 'income' ? "Income Amount (₹)" : "Expense Amount (₹)"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {activeCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={txType === 'income' ? "Description (e.g. Salary credited)" : "Description (e.g. Jio recharge)"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ background: txType === 'income' ? 'var(--accent-success)' : 'var(--accent-gradient)', justifyContent: 'center' }}
          >
            <Plus size={16} /> Save
          </button>
        </form>
      </div>

      {/* 2. Recent Transactions List */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Financial Activity</h3>
        {expenses.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No financial transactions logged yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {expenses.map((exp) => {
              const isEditing = editingId === exp.id;
              const isIncome = exp.type === 'income';

              if (isEditing) {
                const editActiveCategories = editTxType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                return (
                  <div key={exp.id} className="grid-3" style={{
                    gridTemplateColumns: '1fr 1fr 1.2fr 1.5fr auto auto', gap: 'var(--space-2)',
                    padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-primary)', alignItems: 'center'
                  }}>
                    <select
                      value={editTxType}
                      onChange={(e) => setEditTxType(e.target.value)}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {editActiveCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                    <button
                      onClick={() => handleSaveEdit(exp.id)}
                      className="btn-primary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', minHeight: 'auto' }}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', minHeight: 'auto' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={exp.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                  border: `1px solid ${isIncome ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                  flexWrap: 'wrap', gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                      background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isIncome ? <ArrowUpRight size={18} color="var(--accent-success)" /> : <ArrowDownRight size={18} color="var(--accent-warning)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.92rem' }}>{exp.description}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: isIncome ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: '600' }}>
                          {isIncome ? 'Received (Income)' : 'Spent (Expense)'}
                        </span> • {exp.category} • {exp.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                    <span style={{
                      fontSize: '1rem', fontWeight: '700',
                      color: isIncome ? 'var(--accent-success)' : 'var(--accent-warning)'
                    }}>
                      {isIncome ? '+' : '-'} ₹{exp.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => startEdit(exp)}
                      className="btn-secondary"
                      title="Edit Entry"
                      style={{ padding: '6px 10px', minHeight: 'auto', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="btn-secondary"
                      title="Delete Entry"
                      style={{ padding: '6px 10px', minHeight: 'auto', color: 'var(--accent-danger)', fontSize: '0.78rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
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
