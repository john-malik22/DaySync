import React, { useState } from 'react';
import { Calendar, CheckCircle2, TrendingUp, Sparkles, Plus, Check, Activity } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function HabitTracker() {
  const { routines } = useLuna();

  // Habit items (using detected routines if available, otherwise interactive state)
  const [habits, setHabits] = useState(() => {
    if (routines && routines.length > 0) {
      return routines.map((r, i) => ({
        id: r.id || `r-${i}`,
        title: r.title || 'Daily Routine',
        category: r.timeOfDay || 'General',
        goal: 15,
        days: [true, true, false, true, true, false, true]
      }));
    }
    return [
      { id: 'h1', title: 'Study & Skill Building', category: 'Learning', goal: 30, days: [true, true, false, true, true, false, true] },
      { id: 'h2', title: 'Daily Workout & Exercise', category: 'Health', goal: 20, days: [true, false, true, true, false, true, true] },
      { id: 'h3', title: 'Read Tech & AI Articles', category: 'Growth', goal: 15, days: [true, true, true, false, true, false, true] }
    ];
  });

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitGoal, setNewHabitGoal] = useState('15');

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const toggleDay = (habitId, dayIndex) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newDays = [...h.days];
        newDays[dayIndex] = !newDays[dayIndex];
        return { ...h, days: newDays };
      }
      return h;
    }));
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    setHabits(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newHabitTitle,
        category: 'Personal',
        goal: parseInt(newHabitGoal) || 15,
        days: [false, false, false, false, false, false, false]
      }
    ]);
    setNewHabitTitle('');
  };

  // Metrics
  const totalChecks = habits.reduce((acc, h) => acc + h.days.filter(Boolean).length, 0);
  const maxPossible = habits.length * 7;
  const overallPercentage = maxPossible > 0 ? Math.round((totalChecks / maxPossible) * 100) : 0;

  const topHabits = [...habits]
    .map(h => {
      const completedCount = h.days.filter(Boolean).length;
      const pct = Math.round((completedCount / 7) * 100);
      return { ...h, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
      {/* 1. TOP OVERVIEW ROW: Month / Date | Overall Progress */}
      <div className="grid-2" style={{ gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Month / Date Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Calendar size={13} color="var(--accent-primary)" /> CURRENT PERIOD
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active Habit Tracking
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL PROGRESS</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>{overallPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '6px 0' }}>
            <div style={{ width: `${overallPercentage}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Completed {totalChecks} / {maxPossible} check-ins this week
          </div>
        </div>
      </div>

      {/* 2. SECOND ROW: Weekly Progress | Top Habits */}
      <div className="grid-2" style={{ gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Weekly Progress Summary Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> WEEKLY PROGRESS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', textAlign: 'center' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Habits</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{habits.length}</div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Checks</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{totalChecks}</div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rate</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{overallPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Top Habits List Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} /> TOP HABITS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topHabits.slice(0, 3).map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500', minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {idx + 1}. {item.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '60px', height: '5px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: 'var(--accent-primary)' }} />
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--accent-primary)', minWidth: '30px', textAlign: 'right' }}>
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: MY HABITS GRID TABLE */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} /> MY HABITS
          </h3>

          {/* Quick Add Habit Form */}
          <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="New habit..."
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              style={{ minHeight: '32px', fontSize: '12px', padding: '4px 10px', width: '140px' }}
            />
            <button type="submit" className="btn-primary" style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}>
              <Plus size={14} /> Add
            </button>
          </form>
        </div>

        {habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No habits tracked yet. Add your first habit above to begin tracking!
          </div>
        ) : (
          /* Scrollable Table Wrapper (Page does NOT scroll horizontally, only wrapper scrolls on mobile) */
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: '600', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, minWidth: '160px' }}>
                    Habit
                  </th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600', width: '60px', textAlign: 'center' }}>
                    Goal
                  </th>
                  {daysOfWeek.map((day, dIdx) => (
                    <th key={dIdx} style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center', width: '38px' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Sticky Habit Title Column */}
                    <td style={{
                      padding: '8px 10px', fontWeight: '500', color: 'var(--text-primary)',
                      position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2
                    }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {habit.title}
                      </div>
                    </td>

                    {/* Goal Value */}
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {habit.goal}m
                    </td>

                    {/* M T W T F S S Days Check Toggles */}
                    {habit.days.map((checked, dayIndex) => (
                      <td key={dayIndex} style={{ padding: '4px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleDay(habit.id, dayIndex)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            background: checked ? 'var(--accent-primary)' : 'transparent',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {checked ? <Check size={14} strokeWidth={3} /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>○</span>}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
