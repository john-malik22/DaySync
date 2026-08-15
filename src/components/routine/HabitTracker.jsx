import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Sparkles, Plus, Check, ChevronLeft, ChevronRight, Activity, Trash2, Edit2, Clock, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function HabitTracker({ searchFilter }) {
  const { routines } = useLuna();

  // Selected Date State (Defaults to current date)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // 1. Initial Habits List with optional time property
  const [habits, setHabits] = useState([
    { id: 'h1', title: 'Study & Skill Building', time: '08:00', category: 'Learning', goal: 30 },
    { id: 'h2', title: 'Daily Workout & Exercise', time: '07:00', category: 'Health', goal: 20 },
    { id: 'h3', title: 'Read Tech & AI Articles', time: '21:30', category: 'Growth', goal: 15 }
  ]);

  // 2. Real Date-Keyed Check-ins: { [habitId_YYYY-MM-DD]: true/false }
  const [checkIns, setCheckIns] = useState({});

  // Add Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('');
  const [newHabitGoal, setNewHabitGoal] = useState('15');

  // Edit Form State
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editGoal, setEditGoal] = useState('15');

  // Month Navigation
  const changeMonth = (offset) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  };

  // Week Navigation
  const changeWeek = (offset) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (offset * 7));
      return next;
    });
  };

  // Compute 7 days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMon);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = new Date().toISOString().split('T')[0] === isoDate;
      days.push({ dateObj: d, isoDate, dayName, dayNum, isToday });
    }
    return days;
  }, [currentDate]);

  // Date Range Text for Week Header
  const weekRangeText = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0].dateObj;
    const last = weekDays[6].dateObj;
    const startStr = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  // Toggle Check-in for Habit + Exact ISO Date
  const toggleCheckIn = (habitId, isoDate) => {
    const key = `${habitId}_${isoDate}`;
    setCheckIns(prev => ({
      ...prev,
      [key]: !prev[key]
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
        time: newHabitTime || '',
        category: 'Personal',
        goal: parseInt(newHabitGoal) || 15
      }
    ]);
    setNewHabitTitle('');
    setNewHabitTime('');
  };

  const handleDeleteHabit = (habitId) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setEditTitle(habit.title);
    setEditTime(habit.time || '');
    setEditGoal(habit.goal.toString());
  };

  const handleSaveEdit = (habitId) => {
    if (!editTitle.trim()) return;
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          title: editTitle,
          time: editTime,
          goal: parseInt(editGoal) || 15
        };
      }
      return h;
    }));
    setEditingId(null);
  };

  // Helper format time for display (e.g. "08:00" -> "08:00 AM")
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    if (!h) return timeStr;
    const hourNum = parseInt(h);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  // Real Progress Metrics for current selected week
  const filteredHabits = habits.filter(h => !searchFilter || h.title.toLowerCase().includes(searchFilter.toLowerCase()));

  const totalPossibleChecks = filteredHabits.length * 7;
  const completedChecksCount = useMemo(() => {
    let count = 0;
    filteredHabits.forEach(h => {
      weekDays.forEach(d => {
        if (checkIns[`${h.id}_${d.isoDate}`]) count++;
      });
    });
    return count;
  }, [filteredHabits, weekDays, checkIns]);

  const overallPercentage = totalPossibleChecks > 0 ? Math.round((completedChecksCount / totalPossibleChecks) * 100) : 0;

  // Ranked Top Habits based on real check-ins for the selected week
  const topHabitsRanked = useMemo(() => {
    return [...filteredHabits]
      .map(h => {
        let done = 0;
        weekDays.forEach(d => {
          if (checkIns[`${h.id}_${d.isoDate}`]) done++;
        });
        const pct = Math.round((done / 7) * 100);
        return { ...h, pct, done };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [filteredHabits, weekDays, checkIns]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
      {/* Real Month & Week Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="btn-secondary"
            title="Previous Month"
            style={{ padding: '4px 8px', minHeight: '32px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="btn-secondary"
            title="Next Month"
            style={{ padding: '4px 8px', minHeight: '32px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Week Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="btn-secondary"
            title="Previous Week"
            style={{ padding: '2px 6px', minHeight: '28px' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {weekRangeText}
          </span>
          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="btn-secondary"
            title="Next Week"
            style={{ padding: '2px 6px', minHeight: '28px' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 1. DESKTOP ROW 1: Month/Date | Overall Progress */}
      <div className="grid-2" style={{ gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Month / Date Overview Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Calendar size={13} color="var(--accent-primary)" /> SELECTED PERIOD
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Week Range: {weekRangeText}
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
            Completed {completedChecksCount} / {totalPossibleChecks} check-ins
          </div>
        </div>
      </div>

      {/* 2. DESKTOP ROW 2: Weekly Progress | Top Habits */}
      <div className="grid-2" style={{ gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Weekly Progress Summary Card */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> WEEKLY PROGRESS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xs)', textAlign: 'center' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Habits</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{filteredHabits.length}</div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Checks</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>{completedChecksCount}</div>
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
            {topHabitsRanked.slice(0, 3).map((item, idx) => (
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

      {/* 3. MAIN HABIT TRACKER GRID TABLE */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} /> MY HABITS
          </h3>

          {/* Quick Add Habit Form with Optional Time Field */}
          <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="New habit..."
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              style={{ minHeight: '32px', fontSize: '12px', padding: '4px 10px', width: '130px' }}
            />
            <input
              type="time"
              value={newHabitTime}
              onChange={(e) => setNewHabitTime(e.target.value)}
              title="Optional Habit Time"
              style={{ minHeight: '32px', fontSize: '12px', padding: '4px 6px', width: '105px' }}
            />
            <button type="submit" className="btn-primary" style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}>
              <Plus size={14} /> Add
            </button>
          </form>
        </div>

        {filteredHabits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No habits tracked yet. Add your first habit above to start tracking!
          </div>
        ) : (
          /* Scrollable Table Wrapper */
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '580px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: '600', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, minWidth: '170px' }}>
                    Habit
                  </th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600', width: '55px', textAlign: 'center' }}>
                    Goal
                  </th>
                  {/* Real Date Headers */}
                  {weekDays.map((d, dIdx) => (
                    <th key={dIdx} style={{
                      padding: '6px 4px', textAlign: 'center', width: '45px',
                      background: d.isToday ? 'var(--accent-tint)' : 'transparent',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ fontSize: '11px', color: d.isToday ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: d.isToday ? '700' : '500' }}>
                        {d.dayName}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: d.isToday ? '800' : '600', color: d.isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {d.dayNum}
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: '600', width: '60px', textAlign: 'center' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits.map((habit) => {
                  const isEditing = editingId === habit.id;

                  if (isEditing) {
                    return (
                      <tr key={habit.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                        <td colSpan={10} style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              style={{ minHeight: '32px', fontSize: '12px', padding: '4px 8px', flex: 1, minWidth: '130px' }}
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              style={{ minHeight: '32px', fontSize: '12px', padding: '4px 6px', width: '100px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(habit.id)}
                              className="btn-primary"
                              style={{ padding: '4px 10px', minHeight: '32px', fontSize: '12px' }}
                            >
                              <Check size={14} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', minHeight: '32px', fontSize: '12px' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={habit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Sticky Habit Title & Time Column */}
                      <td style={{
                        padding: '8px 10px', color: 'var(--text-primary)',
                        position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {habit.title}
                        </div>
                        {habit.time && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                            <Clock size={11} color="var(--accent-primary)" /> {formatTimeDisplay(habit.time)}
                          </div>
                        )}
                      </td>

                      {/* Goal Value */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {habit.goal}m
                      </td>

                      {/* Date-Keyed Check-in Toggles */}
                      {weekDays.map((d, dIdx) => {
                        const isChecked = Boolean(checkIns[`${habit.id}_${d.isoDate}`]);
                        return (
                          <td key={dIdx} style={{ padding: '4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => toggleCheckIn(habit.id, d.isoDate)}
                              title={`${habit.title} on ${d.isoDate}`}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                background: isChecked ? 'var(--accent-primary)' : 'transparent',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isChecked ? <Check size={14} strokeWidth={3} /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>○</span>}
                            </button>
                          </td>
                        );
                      })}

                      {/* Small Edit [✎] & Delete [🗑] Icon Buttons */}
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(habit)}
                            title="Edit Habit"
                            style={{
                              padding: '4px', width: '24px', height: '24px',
                              borderRadius: 'var(--radius-sm)', background: 'transparent',
                              border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteHabit(habit.id)}
                            title="Delete Habit"
                            style={{
                              padding: '4px', width: '24px', height: '24px',
                              borderRadius: 'var(--radius-sm)', background: 'transparent',
                              border: 'none', color: 'var(--accent-danger)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
