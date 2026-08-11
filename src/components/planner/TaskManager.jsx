import React, { useState } from 'react';
import { Plus, CheckSquare, Trash2, Calendar, AlertCircle } from 'lucide-react';
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
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Tasks & Reminders</h3>

      {/* Task Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Add task naturally (e.g. Study React useEffect)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '10px',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
            color: '#fff', fontSize: '0.9rem'
          }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: '10px',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
            color: '#fff', fontSize: '0.85rem'
          }}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No pending tasks. Tell Luna to add one!
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
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
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
                    <span><Calendar size={12} inline /> {task.dueDate}</span>
                    <span>• Priority: <strong style={{
                      color: task.priority === 'High' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                    }}>{task.priority}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
