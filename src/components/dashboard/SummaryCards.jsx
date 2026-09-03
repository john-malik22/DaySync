import React from 'react';
import { CheckSquare, CreditCard, Brain } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function SummaryCards() {
  const { tasks, expenses, memories } = useLuna();

  const savedTarget = localStorage.getItem('luna_monthly_budget_target');
  const budgetTarget = savedTarget ? parseFloat(savedTarget) : 20000;

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((acc, curr) => acc + curr.amount, 0);

  const cards = [
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      subtitle: `${tasks.length} total assigned`,
      icon: CheckSquare,
      color: 'var(--accent-primary)'
    },
    {
      title: 'Monthly Expenses',
      value: `₹${totalSpent.toLocaleString()}`,
      subtitle: `Target ₹${budgetTarget.toLocaleString()}`,
      icon: CreditCard,
      color: 'var(--accent-warning)'
    },
    {
      title: 'Saved Memories',
      value: memories.length,
      subtitle: 'Approved facts & context',
      icon: Brain,
      color: 'var(--accent-secondary)'
    }
  ];

  return (
    <div className="grid-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {card.title}
              </span>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={17} color={card.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '2px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
