import React from 'react';
import { CheckSquare, CreditCard, Brain, TrendingUp } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function SummaryCards() {
  const { tasks, expenses, memories } = useLuna();

  const savedTarget = localStorage.getItem('luna_monthly_budget_target');
  const budgetTarget = savedTarget ? parseFloat(savedTarget) : 20000;

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const budgetProgress = Math.min(100, Math.round((totalSpent / budgetTarget) * 100));

  const approvedMemories = memories.filter(m => m.approved).length;
  const memoryProgress = memories.length > 0 ? Math.round((approvedMemories / memories.length) * 100) : 100;

  const cards = [
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      subtitle: `${completedTasks} of ${totalTasks} completed`,
      icon: CheckSquare,
      color: 'var(--accent-primary)',
      progress: taskProgress,
      progressColor: 'var(--accent-primary)'
    },
    {
      title: 'Monthly Expenses',
      value: `₹${totalSpent.toLocaleString()}`,
      subtitle: `Target: ₹${budgetTarget.toLocaleString()}`,
      icon: CreditCard,
      color: 'var(--accent-warning)',
      progress: budgetProgress,
      progressColor: budgetProgress > 85 ? 'var(--accent-danger)' : 'var(--accent-warning)'
    },
    {
      title: 'Saved Memories',
      value: memories.length,
      subtitle: `${approvedMemories} approved facts`,
      icon: Brain,
      color: 'var(--accent-secondary)',
      progress: memoryProgress,
      progressColor: 'var(--accent-secondary)'
    }
  ];

  return (
    <div className="grid-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
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
              <div style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                {card.value}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>{card.subtitle}</span>
                <span style={{ fontWeight: '600', color: card.progressColor }}>{card.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  width: `${card.progress}%`,
                  height: '100%',
                  background: card.progressColor,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
