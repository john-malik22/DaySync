import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { ExpenseForm } from '../../components/expenses/ExpenseForm';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ErrorState, StaleIndicator } from '../../components/common/ErrorState';
import { ReactionBadge } from '../../components/common/ReactionBadge';
import { ArrowUpRight, ArrowDownRight, Wallet, Edit2, Trash2, Check, X, CreditCard } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

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

export function ExpensesPage() {
  const { expenses, updateExpense, deleteExpense, startingBalance, updateStartingBalance, errors, resourceLoading, fetchExpenses, isFromCache, lastSyncedAt } = useLuna();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTxType, setEditTxType] = useState('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Recharges');
  const [editDescription, setEditDescription] = useState('');

  const totalIncome = (expenses || [])
    .filter(e => e && e.type === 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalSpent = (expenses || [])
    .filter(e => e && e.type !== 'income')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const currentBalance = (startingBalance !== null ? startingBalance : 0) + totalIncome - totalSpent;

  const startEdit = (exp) => {
    if (!exp) return;
    setEditingId(exp.id);
    setEditTxType(exp.type || 'expense');
    setEditAmount((exp.amount || 0).toString());
    setEditCategory(exp.category || 'Recharges');
    setEditDescription(exp.description || '');
  };

  const handleSaveEdit = async (id) => {
    if (!editAmount) return;
    try {
      await updateExpense(id, {
        type: editTxType,
        amount: parseFloat(editAmount),
        category: editCategory,
        description: editDescription
      });
      setEditingId(null);
      if (showToast) showToast('Transaction updated successfully.', 'success');
    } catch (err) {
      if (showToast) showToast('Couldn\'t save changes. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    const needsConfirm = localStorage.getItem('daysync_confirm_delete') !== 'false';
    if (!needsConfirm || confirm('Are you sure you want to delete this expense transaction?')) {
      try {
        await deleteExpense(id);
        if (showToast) showToast('Expense transaction deleted.', 'info');
      } catch (err) {
        if (showToast) showToast('Couldn\'t delete this item. Nothing was changed.', 'error');
      }
    }
  };

  const filteredExpenses = (expenses || []).filter(exp => 
    exp && (!search || 
    (exp.description && exp.description.toLowerCase().includes(search.toLowerCase())) || 
    (exp.category && exp.category.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="page-container expenses-page-container">
      {/* Top Header Row: Page Title EXPENSES */}
      <PageHeaderRow title="EXPENSES" onSearch={setSearch} />

      {/* UPPER TWO-COLUMN SECTION (Left: Log Transaction | Right: Financial Summary) */}
      <div className="expenses-top-grid">
        {/* LEFT CONTAINER — LOG TRANSACTION */}
        <div className="glass-card expenses-log-container" style={{ padding: '16px' }}>
          <ExpenseForm />
        </div>

        {/* DESKTOP FINANCIAL SUMMARY CARD (Visible on Desktop >=769px) */}
        <div className="glass-card desktop-financial-summary-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={16} color="var(--accent-primary)" /> FINANCIAL SUMMARY
            </h3>
            <ReactionBadge category="BALANCE" data={{ balance: currentBalance }} seed={Math.round(currentBalance)} />
          </div>

          {/* Main Total Balance Box */}
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Total Balance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
              {currentBalance >= 0 ? '+' : ''}₹{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Spent & Received 2-Column Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
            {/* Spent */}
            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Spent</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-danger)' }}>
                -₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Received */}
            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Received</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-success)' }}>
                +₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE FINANCIAL SUMMARY CARD (Visible on Mobile <=768px) */}
        <div className="glass-card mobile-financial-summary-card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '800' }}>
              <Wallet size={14} color="var(--accent-primary)" /> FINANCIAL SUMMARY
            </h3>
            <ReactionBadge category="BALANCE" data={{ balance: currentBalance }} seed={Math.round(currentBalance)} style={{ margin: 0 }} />
          </div>

          {/* 3 Metrics on ONE Row: TOTAL, SPENT, RECEIVED */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center',
            padding: '8px 6px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}>
            {/* TOTAL */}
            <div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>TOTAL</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)', marginTop: '2px' }}>
                {currentBalance >= 0 ? '+' : ''}₹{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* SPENT */}
            <div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>SPENT</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-danger)', marginTop: '2px' }}>
                -₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* RECEIVED */}
            <div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>RECEIVED</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '2px' }}>
                +₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Mini Bar / Progress Visualization */}
          {(() => {
            const totalActivity = totalSpent + totalIncome;
            const spentRatio = totalActivity > 0 ? Math.min(100, Math.round((totalSpent / totalActivity) * 100)) : 50;
            const incomeRatio = 100 - spentRatio;
            return (
              <div style={{ marginTop: '2px' }}>
                <div style={{ height: '5px', width: '100%', borderRadius: '3px', background: 'var(--bg-tertiary)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${incomeRatio}%`, background: 'var(--accent-success)', height: '100%', transition: 'width 0.3s ease' }} title={`Received ${incomeRatio}%`} />
                  <div style={{ width: `${spentRatio}%`, background: 'var(--accent-danger)', height: '100%', transition: 'width 0.3s ease' }} title={`Spent ${spentRatio}%`} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* HISTORY SECTION (Full-Width Transaction List) */}
      <div className="glass-card expenses-history-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '13.5px', fontWeight: '800', letterSpacing: '0.05em' }}>
            HISTORY ({filteredExpenses.length})
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
        ) : resourceLoading?.expenses && expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search ? 'No matching transactions' : 'No expenses yet'}
            description={search ? 'Try searching with another term.' : 'Your spending history will appear here.'}
            compact
          />
        ) : (
          <div className="expenses-history-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
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
                      {isIncome ? '+' : '-'}₹{(exp.amount || 0).toLocaleString()}
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
