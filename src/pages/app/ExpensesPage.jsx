import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { ExpenseForm } from '../../components/expenses/ExpenseForm';
import { useLuna } from '../../context/LunaContext';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export function ExpensesPage() {
  const { expenses } = useLuna();
  const [search, setSearch] = useState('');

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = expenses
    .filter(e => e.type !== 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalSpent;

  return (
    <div className="page-container">
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title="Expenses" onSearch={setSearch} />

      {/* Wireframe Row 1: LOG TRANSACTION (Left) | TOTAL BALANCE (Right) */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        {/* LOG TRANSACTION Card */}
        <ExpenseForm searchFilter={search} />

        {/* TOTAL BALANCE Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '180px' }}>
          <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TOTAL BALANCE
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <Wallet size={24} color="var(--accent-primary)" />
            <div style={{
              fontSize: '2.1rem',
              fontWeight: '800',
              color: netBalance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)'
            }}>
              {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Net available balance based on total income received minus expenses spent.
          </p>
        </div>
      </div>

      {/* Wireframe Row 2: RECENT ACTIVITY (Left - ONLY ONE LIST) | SPENT & RECEIVED (Right) */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        {/* RECENT ACTIVITY Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>RECENT ACTIVITY</h3>
          {expenses.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No transactions logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {expenses
                .filter(exp => !search || exp.description.toLowerCase().includes(search.toLowerCase()) || exp.category.toLowerCase().includes(search.toLowerCase()))
                .map((exp) => {
                  const isIncome = exp.type === 'income';
                  return (
                    <div key={exp.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                          background: isIncome ? 'rgba(47, 125, 120, 0.15)' : 'rgba(200, 92, 92, 0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {isIncome ? <ArrowUpRight size={16} color="var(--accent-primary)" /> : <ArrowDownRight size={16} color="var(--accent-danger)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{exp.description}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.category} • {exp.date}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: isIncome ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {isIncome ? '+' : '-'} ₹{exp.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Stacked SPENT & RECEIVED Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* SPENT Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>SPENT</h3>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-danger)' }}>
              -₹{totalSpent.toLocaleString()}
            </div>
          </div>

          {/* RECEIVED Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>RECEIVED</h3>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
              +₹{totalIncome.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
