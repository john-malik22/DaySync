import React from 'react';
import { ExpenseForm } from '../../components/expenses/ExpenseForm';
import { FinancialInsights } from '../../components/expenses/FinancialInsights';

export function ExpensesPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Personal Finance Manager</h1>
        <p>
          Track daily expenses, manage income receipts, review budgets, and analyze cash flow.
        </p>
      </div>

      <div className="expenses-layout">
        <ExpenseForm />
        <FinancialInsights />
      </div>
    </div>
  );
}
