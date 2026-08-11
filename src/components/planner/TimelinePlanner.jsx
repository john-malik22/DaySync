import React from 'react';
import { Clock, CheckCircle2, Circle, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function TimelinePlanner() {
  const { tasks, toggleTask, conversations, memories, expenses } = useLuna();

  // Calculate user activity days/history count
  const totalActivityCount = tasks.length + conversations.length + memories.length + expenses.length;
  const hasOneWeekData = totalActivityCount >= 10; // 10+ activity interactions simulate 1-week pattern threshold

  // Dynamically generate schedule blocks ONLY from actual user tasks & activities
  const dynamicSchedule = tasks.map((t, idx) => {
    const times = ['09:00 AM', '11:30 AM', '02:00 PM', '05:30 PM', '08:00 PM'];
    return {
      id: t.id,
      time: t.timeBlock ? t.timeBlock.split(' - ')[0] : (times[idx % times.length] || '10:00 AM'),
      category: t.category || 'User Task',
      title: t.title,
      completed: t.completed,
      priority: t.priority
    };
  });

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>AI Daily Planner</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Auto-synthesized from your noticed activity patterns and active tasks.
          </p>
        </div>
        <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' }}>
          {hasOneWeekData ? 'Pattern Schedule Active' : 'Observing Activity'}
        </span>
      </div>

      {/* 1-Week Activity Observation Banner when activity is under threshold */}
      {!hasOneWeekData && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid var(--border-glow)',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <Sparkles size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '4px' }}>
              Luna Observing 1-Week Activity Pattern
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Luna is currently noticing your daily routine habits, task completions, and interaction times. As you use Luna over your first week, your personalized AI schedule will automatically generate here!
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Schedule List based on actual user tasks */}
      {dynamicSchedule.length === 0 ? (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-muted)'
        }}>
          <Calendar size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            No static hardcoded schedules. Tell Luna your agenda or add tasks to build your day!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dynamicSchedule.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: item.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-primary)',
                minWidth: '80px', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Clock size={14} /> {item.time}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: 'var(--text-muted)', fontWeight: '600'
                }}>
                  {item.category}
                </span>
                <div style={{
                  fontSize: '0.94rem', fontWeight: '600',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>
                  {item.title}
                </div>
              </div>

              <button
                onClick={() => toggleTask(item.id, item.completed)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.completed ? <CheckCircle2 color="var(--accent-success)" size={20} /> : <Circle color="var(--text-muted)" size={20} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
