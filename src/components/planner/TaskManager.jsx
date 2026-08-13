import React, { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function TaskManager() {
  const { tasks, addTask, toggleTask, deleteTask } = useLuna();
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('High');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle,
      priority,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setNewTitle('');
  };

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: 'var(--space-4)' }}>Tasks & Reminders</h3>

      {/* Task Input Form */}
      <form onSubmit={handleSubmit} className="grid-3" style={{ gridTemplateColumns: '1fr auto auto', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input
          type="text"
          placeholder="Add task (e.g. Study React useEffect)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add Task
        </button>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: '0.88rem' }}>
            No pending tasks logged yet.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', minHeight: 'auto' }}
                />
                <div>
                  <div style={{
                    fontSize: '0.92rem', fontWeight: '500',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {task.dueDate}</span>
                    <span>• Priority: <strong style={{
                      color: task.priority === 'High' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                    }}>{task.priority}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="btn-secondary"
                title="Delete Task"
                style={{ padding: '6px 10px', minHeight: 'auto', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
