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
  
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Recharges');
  const [description, setDescription] = useState('');

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* 1. Log Transaction Form Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <h3 style={{ color: 'var(--accent-primary)' }}>Log Transaction</h3>
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
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
            placeholder={txType === 'income' ? "Amount (₹)" : "Amount (₹)"}
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
            placeholder="Description (e.g. Jio recharge)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
          >
            <Plus size={16} /> Save
          </button>
        </form>
      </div>

      {/* 2. Recent Activity */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--accent-primary)' }}>Recent Activity</h3>
        {expenses.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No financial transactions logged yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {expenses.map((exp) => {
              const isEditing = editingId === exp.id;
              const isIncome = exp.type === 'income';

              if (isEditing) {
                const editActiveCategories = editTxType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                return (
                  <div key={exp.id} className="mobile-stack-form" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1.5fr auto auto', gap: 'var(--space-sm)',
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
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={exp.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap', gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(168, 124, 124, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isIncome ? <ArrowUpRight size={16} color="var(--accent-primary)" /> : <ArrowDownRight size={16} color="var(--accent-warning)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{exp.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                          {isIncome ? 'Received' : 'Spent'}
                        </span> • {exp.category} • {exp.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <span style={{
                      fontSize: '15px', fontWeight: '700',
                      color: isIncome ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}>
                      {isIncome ? '+' : '-'} ₹{exp.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => startEdit(exp)}
                      className="btn-secondary"
                      title="Edit Entry"
                      style={{ padding: '6px 10px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="btn-secondary"
                      title="Delete Entry"
                      style={{ padding: '6px 10px', minHeight: '34px', color: 'var(--accent-danger)', fontSize: '12px' }}
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
