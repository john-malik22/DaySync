import React, { useState } from 'react';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function TaskManager({ searchFilter }) {
  const { tasks, addTask, toggleTask, deleteTask } = useLuna();
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');

  const completedCount = tasks.filter(t => t.completed).length;

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      priority,
      category: 'General',
      completed: false
    });
    setTitle('');
  };

  const filteredTasks = tasks.filter(t => !searchFilter || t.title.toLowerCase().includes(searchFilter.toLowerCase()));
  const pendingFilteredTasks = filteredTasks.filter(t => !t.completed);
  const completedFilteredTasks = filteredTasks.filter(t => t.completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Row: TASK & REMINDERS (Left) | COMPLETED (Right) */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        {/* TASK & REMINDERS Form Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>TASK & REMINDERS</h3>
          <form onSubmit={handleAddTask} className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              placeholder="Add new task or reminder..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button type="submit" className="btn-primary">
              <Plus size={16} /> Save
            </button>
          </form>
        </div>

        {/* COMPLETED Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '120px' }}>
          <h3 style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>COMPLETED</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={24} /> {completedCount} Done
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>out of {tasks.length} total tasks assigned</p>
        </div>
      </div>

      {/* Bottom Row: RECENT TASK TO DO Card */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>RECENT TASK TO DO</h3>

        {filteredTasks.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No pending tasks available.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {filteredTasks.map((task) => (
              <div key={task.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '22px', height: '22px', borderRadius: '4px',
                      border: `2px solid ${task.completed ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: task.completed ? 'var(--accent-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      color: '#FFFFFF', flexShrink: 0
                    }}
                  >
                    {task.completed && <Check size={14} strokeWidth={3} />}
                  </button>
                  <div>
                    <span style={{
                      fontSize: '14px',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontWeight: '500'
                    }}>
                      {task.title}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-primary)'
                  }}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', minHeight: '30px', color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
