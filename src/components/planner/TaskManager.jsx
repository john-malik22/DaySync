import React, { useState } from 'react';
import { Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ErrorState, StaleIndicator } from '../common/ErrorState';

export function TaskManager({ searchFilter }) {
  const { tasks, addTask, toggleTask, deleteTask, errors, resourceLoading, fetchTasks, isFromCache, lastSyncedAt } = useLuna();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedCount = tasks.filter(t => t.completed).length;

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to the internet to save this task.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask({
        title: title.trim(),
        priority,
        category: 'General',
        completed: false
      });
      setTitle('');
      if (showToast) showToast('Task added successfully.', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Couldn\'t save task. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to internet to delete this task.", 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        if (showToast) showToast('Task deleted.', 'info');
      } catch (err) {
        if (showToast) showToast('Couldn\'t delete this task. Nothing was changed.', 'error');
      }
    }
  };

  const handleToggleTask = async (id, completed) => {
    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to internet to update task status.", 'error');
      return;
    }

    try {
      await toggleTask(id, completed);
      if (showToast) showToast(completed ? 'Task reopened.' : 'Task completed!', 'success');
    } catch (err) {
      if (showToast) showToast('Could not update task status.', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => !searchFilter || t.title.toLowerCase().includes(searchFilter.toLowerCase()));

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
              disabled={isSubmitting}
              required
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Plus size={16} /> {isSubmitting ? 'Saving...' : 'Save'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>RECENT TASK TO DO</h3>
          {isFromCache?.tasks && <StaleIndicator timestamp={lastSyncedAt?.tasks} />}
        </div>

        {errors?.tasks && !isFromCache?.tasks ? (
          <ErrorState
            title={errors.tasks.title}
            message={errors.tasks.message}
            onRetry={fetchTasks}
            isRetrying={resourceLoading?.tasks}
          />
        ) : resourceLoading?.tasks && tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            {searchFilter ? 'No tasks found matching your query.' : 'No tasks assigned yet.'}
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
                    type="button"
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    title={task.completed ? "Mark as uncompleted" : "Mark as completed"}
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
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn-secondary"
                    title="Delete Task"
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
