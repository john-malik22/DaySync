import React from 'react';
import { ExpenseForm } from '../../components/expenses/ExpenseForm';
import { FinancialInsights } from '../../components/expenses/FinancialInsights';

export function ExpensesPage() {
  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Personal Finance Manager</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track daily expenses, review monthly budgets, and read AI financial insights.
        </p>
      </div>

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <ExpenseForm />
        <FinancialInsights />
      </div>
    </div>
  );
}
