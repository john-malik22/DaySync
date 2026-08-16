import React, { useState } from 'react';
import { Target, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function GoalTracker() {
  const { goals, addGoal, updateGoalProgress } = useLuna();
  const [newTitle, setNewTitle] = useState('');

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addGoal({
      title: newTitle,
      progress: 10,
      currentSubGoal: 'Initial setup',
      dailyTarget: '30 mins daily',
      nextStep: 'Complete introductory module',
      category: 'Learning'
    });
    setNewTitle('');
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Active Goals</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Connected to Daily Planner, Tasks, and Luna Personalization.
          </p>
        </div>
      </div>

      {/* Goal creation form */}
      <form onSubmit={handleCreateGoal} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="New Goal (e.g. Learn English, Complete React App)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '10px',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)'
          }}
        />
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Set Goal
        </button>
      </form>

      {/* Goal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {goals.map((goal) => (
          <div key={goal.id} style={{
            padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                  color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.15)',
                  padding: '2px 8px', borderRadius: '4px'
                }}>
                  {goal.category}
                </span>
                <h4 style={{ fontSize: '1.1rem', marginTop: '4px' }}>{goal.title}</h4>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                {goal.progress}%
              </span>
            </div>

            {/* Custom SVG/CSS Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                width: `${goal.progress}%`, height: '100%', background: 'var(--accent-gradient)',
                borderRadius: '99px', transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div><strong>Daily Target:</strong> {goal.dailyTarget}</div>
              <div><strong>Next Step:</strong> {goal.nextStep}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 15))}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                + 15% Progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
