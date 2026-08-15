import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { ExpenseForm } from '../../components/expenses/ExpenseForm';
import { useLuna } from '../../context/LunaContext';
import { ArrowUpRight, ArrowDownRight, Wallet, Edit2, Trash2, Check, X } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'Recharges', label: '📱 Recharges' },
  { value: 'Electricity Bill', label: '⚡ Electricity' },
  { value: 'Daily Travelling', label: '🚗 Transport' },
  { value: 'Subscriptions', label: '🍿 Subscriptions' },
  { value: 'Groceries', label: '🛒 Groceries' },
  { value: 'Food', label: '🍔 Dining' },
  { value: 'Shopping', label: '🛍️ Shopping' },
  { value: 'Healthcare', label: '🏥 Healthcare' },
  { value: 'Entertainment', label: '🎟️ Entertainment' },
  { value: 'Other', label: '🏷️ Other' }
];

const INCOME_CATEGORIES = [
  { value: 'Salary', label: '💼 Salary' },
  { value: 'Freelance', label: '💻 Freelance' },
  { value: 'Pocket Money', label: '🎁 Allowance' },
  { value: 'Cashback & Rewards', label: '💰 Cashback' },
  { value: 'Refunds', label: '🔄 Refunds' },
  { value: 'Investments', label: '📈 Investments' },
  { value: 'Other Income', label: '💵 Other' }
];

export function ExpensesPage() {
  const { expenses, updateExpense, deleteExpense } = useLuna();
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTxType, setEditTxType] = useState('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Recharges');
  const [editDescription, setEditDescription] = useState('');

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = expenses
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalSpent;

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

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this expense transaction?')) {
      await deleteExpense(id);
    }
  };

  const filteredExpenses = expenses.filter(exp => 
    !search || 
    exp.description.toLowerCase().includes(search.toLowerCase()) || 
    exp.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <PageHeaderRow title="Expenses" onSearch={setSearch} />

      {/* Row 1: LOG TRANSACTION (Left) | TOTAL BALANCE + SPENT/RECEIVED SUMMARY (Right) */}
      <div className="expenses-top-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
        {/* LOG TRANSACTION Card */}
        <ExpenseForm />

        {/* TOTAL BALANCE Card with Compact Spent & Received Summary Blocks */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <h3 style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL BALANCE
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={22} color="var(--accent-primary)" />
              <div style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: netBalance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)'
              }}>
                {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Compact Spent & Received Summary Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spent</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-danger)' }}>-₹{totalSpent.toLocaleString()}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Received</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>+₹{totalIncome.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: SINGLE RECENT ACTIVITY SECTION WITH COMPACT EDIT/DELETE ICON BUTTONS */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>RECENT ACTIVITY</h3>
        
        {filteredExpenses.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No transactions logged yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {filteredExpenses.map((exp) => {
              const isEditing = editingId === exp.id;
              const isIncome = exp.type === 'income';

              if (isEditing) {
                const editActiveCategories = editTxType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                return (
                  <div key={exp.id} className="mobile-stack-form" style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr 1.2fr 1.5fr auto auto', gap: 'var(--space-xs)',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-primary)', alignItems: 'center'
                  }}>
                    <select
                      value={editTxType}
                      onChange={(e) => setEditTxType(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <option value="expense">Spent</option>
                      <option value="income">Received</option>
                    </select>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      {editActiveCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(exp.id)}
                      className="btn-primary"
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={exp.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', gap: '8px'
                }}>
                  {/* Left: Transaction Title & Category Metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                      background: isIncome ? 'rgba(47, 111, 115, 0.15)' : 'rgba(200, 92, 92, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isIncome ? <ArrowUpRight size={15} color="var(--accent-primary)" /> : <ArrowDownRight size={15} color="var(--accent-danger)" />}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {exp.category} • {exp.date}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Compact Icon Buttons [✎] [🗑] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: isIncome ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {isIncome ? '+' : '-'}₹{exp.amount.toLocaleString()}
                    </span>

                    {/* Small Edit Icon Button [✎] */}
                    <button
                      type="button"
                      onClick={() => startEdit(exp)}
                      title="Edit Transaction"
                      style={{
                        padding: '4px',
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Small Trash/Delete Icon Button [🗑] */}
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id)}
                      title="Delete Transaction"
                      style={{
                        padding: '4px',
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
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
