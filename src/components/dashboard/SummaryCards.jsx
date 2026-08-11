import React from 'react';
import { CheckSquare, CreditCard, Brain, Calendar } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function SummaryCards() {
  const { tasks, expenses, memories } = useLuna();

  const savedTarget = localStorage.getItem('luna_monthly_budget_target');
  const budgetTarget = savedTarget ? parseFloat(savedTarget) : 20000;

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const cards = [
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      subtitle: `${tasks.length} total assigned`,
      icon: CheckSquare,
      color: 'var(--accent-primary)',
      badge: 'Today'
    },
    {
      title: 'Monthly Expenses',
      value: `₹${totalSpent.toLocaleString()}`,
      subtitle: `Target ₹${budgetTarget.toLocaleString()}`,
      icon: CreditCard,
      color: 'var(--accent-warning)',
      badge: 'Budget'
    },
    {
      title: 'Saved Memories',
      value: memories.length,
      subtitle: 'Approved facts & context',
      icon: Brain,
      color: 'var(--accent-secondary)',
      badge: 'Context'
    },
    {
      title: 'Planner Agenda',
      value: 'Scheduled',
      subtitle: 'Daily time blocks',
      icon: Calendar,
      color: 'var(--accent-success)',
      badge: 'Schedule'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {card.title}
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} color={card.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>
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
