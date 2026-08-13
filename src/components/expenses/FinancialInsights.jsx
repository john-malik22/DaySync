import React, { useState, useEffect } from 'react';
import { Edit3, Check, Target, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function FinancialInsights() {
  const { expenses } = useLuna();
  
  const [budgetTarget, setBudgetTarget] = useState(() => {
    const saved = localStorage.getItem('luna_monthly_budget_target');
    return saved ? parseFloat(saved) : 20000;
  });
  
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('20000');

  useEffect(() => {
    setTargetInput(budgetTarget.toString());
  }, [budgetTarget]);

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = expenses
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalSpent;
  const remainingBudget = Math.max(0, budgetTarget - totalSpent);
  const percentUsed = Math.min(100, Math.round((totalSpent / budgetTarget) * 100));

  const categories = {};
  expenses.forEach(e => {
    const catLabel = e.type === 'income' ? `[Income] ${e.category}` : e.category;
    categories[catLabel] = (categories[catLabel] || 0) + e.amount;
  });

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
    <div className="glass-card">
      {/* Header & Target Setting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h3>Financial Insights & Cash Flow</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Track total money received, expenses spent, and budget progress.
          </p>
        </div>

        {!editingTarget ? (
          <button
            onClick={() => { setTargetInput(budgetTarget.toString()); setEditingTarget(true); }}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', minHeight: '36px' }}
          >
            <Target size={14} color="var(--accent-warning)" />
            Target: ₹{budgetTarget.toLocaleString()} <Edit3 size={12} />
          </button>
        ) : (
          <form onSubmit={handleSaveTarget} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Target ₹"
              style={{ width: '100px', minHeight: '36px', padding: '4px 8px', fontSize: '13px' }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ padding: '4px 10px', fontSize: '13px', minHeight: '36px' }}>
              <Check size={14} /> Save
            </button>
          </form>
        )}
      </div>

      {/* 3 Overview Cards */}
      <div className="mobile-grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} color="var(--accent-success)" /> Income
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '4px' }}>
            +₹{totalIncome.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownRight size={14} color="var(--accent-warning)" /> Expenses
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-warning)', marginTop: '4px' }}>
            -₹{totalSpent.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wallet size={14} color="var(--accent-primary)" /> Net Cash Balance
          </div>
          <div style={{
            fontSize: '1.2rem', fontWeight: '800', marginTop: '4px',
            color: netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
          }}>
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Spend Progress Bar */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
          <span>Spent: ₹{totalSpent.toLocaleString()} / ₹{budgetTarget.toLocaleString()} Target</span>
          <span style={{ color: percentUsed > 85 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
            {percentUsed}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{
            width: `${percentUsed}%`, height: '100%',
            background: percentUsed > 85 ? 'var(--accent-danger)' : 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease'
          }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
          Remaining Target: ₹{remainingBudget.toLocaleString()}
        </div>
      </div>

      {/* Live Financial Insights Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', fontSize: '13px'
        }}>
          💡 <strong>Top Spend Category:</strong> {topExpenseCategory} (₹{topExpenseAmount.toLocaleString()}).
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)', fontSize: '13px'
        }}>
          📈 <strong>Cash Flow:</strong> Received ₹{totalIncome.toLocaleString()} and spent ₹{totalSpent.toLocaleString()}.
        </div>
      </div>

      {/* Category Breakdown List */}
      <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '14px' }}>Category Breakdown</h4>
      {Object.keys(categories).length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No financial transactions logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(categories).map(([cat, val]) => {
            const isInc = cat.startsWith('[Income]');
            return (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
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
