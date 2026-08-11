import React, { useState, useEffect } from 'react';
import { Edit3, Check, Target, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function FinancialInsights() {
  const { expenses } = useLuna();
  
  // Persistent monthly budget target stored in localStorage
  const [budgetTarget, setBudgetTarget] = useState(() => {
    const saved = localStorage.getItem('luna_monthly_budget_target');
    return saved ? parseFloat(saved) : 20000;
  });
  
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('20000');

  useEffect(() => {
    setTargetInput(budgetTarget.toString());
  }, [budgetTarget]);

  // Separate Income vs Expenses calculations
  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = expenses
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalSpent;
  const remainingBudget = Math.max(0, budgetTarget - totalSpent);
  const percentUsed = Math.min(100, Math.round((totalSpent / budgetTarget) * 100));

  // Dynamic category breakdown calculation
  const categories = {};
  expenses.forEach(e => {
    const catLabel = e.type === 'income' ? `[Income] ${e.category}` : e.category;
    categories[catLabel] = (categories[catLabel] || 0) + e.amount;
  });

  // Find top spend category dynamically
  let topExpenseCategory = 'None';
  let topExpenseAmount = 0;
  expenses.filter(e => e.type !== 'income').forEach(e => {
    const currentTotal = (categories[e.category] || 0);
    if (currentTotal > topExpenseAmount) {
      topExpenseAmount = currentTotal;
      topExpenseCategory = e.category;
    }
  });

  const handleSaveTarget = (e) => {
    e.preventDefault();
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) {
      setBudgetTarget(val);
      localStorage.setItem('luna_monthly_budget_target', val.toString());
      setEditingTarget(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header & Target Setting Option */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3>FINANCIAL INSIGHTS & CASH FLOW</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track total money received, expenses spent, and your monthly budget target.
          </p>
        </div>

        {/* Set Monthly Target Control */}
        {!editingTarget ? (
          <button
            onClick={() => { setTargetInput(budgetTarget.toString()); setEditingTarget(true); }}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Target size={14} color="var(--accent-warning)" />
            Budget Target: ₹{budgetTarget.toLocaleString()} <Edit3 size={12} />
          </button>
        ) : (
          <form onSubmit={handleSaveTarget} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Target ₹"
              style={{
                width: '110px', padding: '6px 10px', borderRadius: '8px',
                border: '1px solid var(--accent-primary)', background: 'var(--bg-tertiary)',
                color: '#fff', fontSize: '0.85rem'
              }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <Check size={14} /> Save
            </button>
          </form>
        )}
      </div>

      {/* 3 Overview Cards: Total Income, Total Expenses, Net Savings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} color="var(--accent-success)" /> Income Received
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '4px' }}>
            +₹{totalIncome.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownRight size={14} color="var(--accent-warning)" /> Expenses Spent
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-warning)', marginTop: '4px' }}>
            -₹{totalSpent.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={14} color="var(--accent-primary)" /> Net Cash Balance
          </div>
          <div style={{
            fontSize: '1.25rem', fontWeight: '800', marginTop: '4px',
            color: netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
          }}>
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Spend Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
          <span>Spent: ₹{totalSpent.toLocaleString()} / ₹{budgetTarget.toLocaleString()} Target</span>
          <span style={{ color: percentUsed > 85 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
            {percentUsed}% Used
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            width: `${percentUsed}%`, height: '100%',
            background: percentUsed > 85 ? 'var(--accent-danger)' : 'var(--accent-gradient)',
            borderRadius: '99px', transition: 'width 0.4s ease'
          }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
          Remaining Monthly Target: ₹{remainingBudget.toLocaleString()}
        </div>
      </div>

      {/* Live Financial Insights Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', fontSize: '0.88rem'
        }}>
          💡 <strong>Top Spend Category:</strong> {topExpenseCategory} is currently your highest expenditure (₹{topExpenseAmount.toLocaleString()}).
        </div>
        <div style={{
          padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', fontSize: '0.88rem'
        }}>
          📈 <strong>Net Cash Flow:</strong> You have received ₹{totalIncome.toLocaleString()} and spent ₹{totalSpent.toLocaleString()}, leaving a net balance of ₹{netBalance.toLocaleString()}.
        </div>
      </div>

      {/* Category Breakdown List */}
      <h4 style={{ marginBottom: '12px', fontSize: '0.92rem' }}>Income & Expense Category Breakdown</h4>
      {Object.keys(categories).length === 0 ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No financial transactions logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(categories).map(([cat, val]) => {
            const isInc = cat.startsWith('[Income]');
            return (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{cat}</span>
                <span style={{ fontWeight: '600', color: isInc ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                  {isInc ? '+' : '-'} ₹{val.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
