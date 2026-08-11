import React from 'react';
import { TimelinePlanner } from '../../components/planner/TimelinePlanner';
import { TaskManager } from '../../components/planner/TaskManager';

export function PlannerPage() {
  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>AI Daily Planner & Tasks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Organize your agenda, set priorities, and follow daily scheduled time blocks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <TimelinePlanner />
        <TaskManager />
      </div>
    </div>
  );
}
