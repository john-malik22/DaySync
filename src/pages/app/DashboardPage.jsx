import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';
import { DashboardGrid } from '../../components/dashboard/DashboardGrid';

export function DashboardPage() {
  const { user } = useAuth();
  const { tasks, expenses, plans, habits } = useLuna();
  const [search, setSearch] = useState('');
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const todayStr = new Date().toISOString().split('T')[0];

  // At-A-Glance Data from Real Context Data
  const pendingTasksCount = (tasks || []).filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate)).length;
  const todaySpent = (expenses || []).filter(e => e.date === todayStr && e.type !== 'income').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const activePlans = (plans || []).filter(p => p.status !== 'cancelled' && p.nextDueDate);
  const nextPlan = activePlans.sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

  const habitsList = habits || [];
  const completedHabitsCount = habitsList.filter(h => h.completedToday).length;

  return (
    <div className="page-container">
      {/* Top Header Row — greeting & search */}
      <PageHeaderRow
        title={`Hello, ${firstName}`}
        onSearch={setSearch}
        titleStyle={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}
      />

      {/* Compact Contextual Overview Bar */}
      <div style={{
        padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px'
      }}>
        <div style={{ fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Today Summary</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
          <span>📋 <strong style={{ color: 'var(--text-primary)' }}>{pendingTasksCount} tasks</strong> pending</span>
          <span>💳 <strong style={{ color: 'var(--text-primary)' }}>₹{todaySpent.toLocaleString()}</strong> spent</span>
          {nextPlan && (
            <span>Repeat <strong style={{ color: 'var(--text-primary)' }}>{nextPlan.name || nextPlan.title}</strong> ({nextPlan.nextDueDate === todayStr ? 'Today' : 'Upcoming'})</span>
          )}
          <span>Habits <strong style={{ color: 'var(--text-primary)' }}>{completedHabitsCount}/{habitsList.length}</strong> completed</span>
        </div>
      </div>

      {/* Customizable Dashboard Grid System */}
      <DashboardGrid />
    </div>
  );
}
