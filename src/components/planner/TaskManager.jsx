import React, { useState } from 'react';
import { Plus, Check, Trash2, CheckCircle2, Calendar, Clock, Repeat, Cake, Users, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ErrorState, StaleIndicator } from '../common/ErrorState';

export function TaskManager({ searchFilter }) {
  const { tasks, addTask, updateTask, toggleTask, deleteTask, errors, resourceLoading, fetchTasks, isFromCache, lastSyncedAt } = useLuna();
  const { showToast } = useToast();

  const [taskType, setTaskType] = useState('task'); // 'task' | 'birthday' | 'meeting'
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('19:00');
  const [recurring, setRecurring] = useState('None');
  const [personName, setPersonName] = useState('');
  const [meetingPeople, setMeetingPeople] = useState('');
  const [location, setLocation] = useState('');

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
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
      let finalTitle = title.trim();
      if (taskType === 'birthday' && personName.trim()) {
        finalTitle = `${personName.trim()}'s Birthday`;
      }

      await addTask({
        title: finalTitle,
        priority,
        category: taskType === 'birthday' ? 'Birthday' : taskType === 'meeting' ? 'Meeting' : 'General',
        taskType,
        personName: taskType === 'birthday' ? personName.trim() : null,
        meetingPeople: taskType === 'meeting' ? meetingPeople.trim() : null,
        location: taskType === 'meeting' ? location.trim() : null,
        dueDate,
        dueTime,
        timeBlock: `${dueTime} - ${dueTime}`,
        recurring: recurring !== 'None' ? recurring : null,
        subtasks: [],
        completed: false
      });

      setTitle('');
      setPersonName('');
      setMeetingPeople('');
      setLocation('');
      setRecurring('None');

      if (showToast) showToast(`${taskType === 'birthday' ? 'Birthday reminder' : taskType === 'meeting' ? 'Meeting' : 'Task'} saved.`, 'success');
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

    const needsConfirm = localStorage.getItem('daysync_confirm_delete') !== 'false';
    if (!needsConfirm || confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteTask(id);
        if (showToast) showToast('Item deleted.', 'info');
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

  const handleAddSubtask = async (taskId) => {
    if (!newSubtaskTitle.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const updatedSubtasks = [
      ...currentSubtasks,
      { id: `sub_${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ];

    try {
      await updateTask(taskId, { subtasks: updatedSubtasks });
      setNewSubtaskTitle('');
      if (showToast) showToast('Subtask added.', 'success');
    } catch (err) {
      if (showToast) showToast('Couldn\'t add subtask.', 'error');
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subtaskId) return { ...s, completed: !s.completed };
      return s;
    });

    try {
      await updateTask(taskId, { subtasks: updatedSubtasks });
    } catch (err) {
      if (showToast) showToast('Couldn\'t update subtask.', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => !searchFilter || t.title.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Row: TASK & REMINDERS (Left) | COMPLETED (Right) */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
        {/* TASK & REMINDERS Form Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>TASK & REMINDERS</h3>

            {/* Type selector: Task, Birthday, Meeting */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setTaskType('task')}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'task' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'task' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: '600'
                }}
              >
                Task
              </button>
              <button
                type="button"
                onClick={() => setTaskType('birthday')}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'birthday' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'birthday' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Cake size={13} /> Birthday
              </button>
              <button
                type="button"
                onClick={() => setTaskType('meeting')}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'meeting' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'meeting' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Users size={13} /> Meeting
              </button>
            </div>
          </div>

          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-sm)' }}>
              {taskType === 'birthday' ? (
                <input
                  type="text"
                  placeholder="Person Name (e.g. Rahul, Anjali)"
                  value={personName}
                  onChange={(e) => { setPersonName(e.target.value); setTitle(`${e.target.value}'s Birthday`); }}
                  disabled={isSubmitting}
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder={taskType === 'meeting' ? "Meeting Title (e.g. Project Review)" : "Add new task or reminder..."}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              )}

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
            </div>

            {/* Additional Date/Time/Recurring Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', paddingTop: '6px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>DUE DATE</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>TIME</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>RECURRING</label>
                <select
                  value={recurring}
                  onChange={(e) => setRecurring(e.target.value)}
                  style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                >
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Every weekday">Every weekday</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Every Monday">Every Monday</option>
                  <option value="Every 2 weeks">Every 2 weeks</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {taskType === 'meeting' && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>PEOPLE / LOCATION</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul, Anjali (Zoom/Office)"
                    value={meetingPeople}
                    onChange={(e) => setMeetingPeople(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* COMPLETED Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '140px' }}>
          <h3 style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>COMPLETED</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={24} /> {completedCount} Done
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>out of {tasks.length} total assigned</p>
        </div>
      </div>

      {/* Bottom Row: RECENT TASK TO DO Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>TASKS & REMINDERS ({filteredTasks.length})</h3>
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
          <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={28} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
              {searchFilter ? 'No matching tasks.' : 'No tasks yet.'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {searchFilter ? 'Try searching with another query.' : 'Add your first task to get started.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {filteredTasks.map((task) => {
              const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
              const isExpanded = expandedTaskId === task.id;

              return (
                <div key={task.id} style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
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

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {task.taskType === 'birthday' && <Cake size={14} color="var(--accent-warning)" />}
                          {task.taskType === 'meeting' && <Users size={14} color="var(--accent-primary)" />}
                          <span style={{
                            fontSize: '14px',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontWeight: '600'
                          }}>
                            {task.title}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Due: {task.dueDate || 'Today'}</span>
                          {task.timeBlock && <span>• {task.timeBlock.split(' - ')[0]}</span>}
                          {task.recurring && task.recurring !== 'None' && <span>• 🔁 {task.recurring}</span>}
                          {task.meetingPeople && <span>• With: {task.meetingPeople}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {subtasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}

                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                        background: 'var(--bg-tertiary)', color: 'var(--accent-primary)'
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

                  {/* Subtasks Accordion & Add Form */}
                  {(isExpanded || subtasks.length > 0) && (
                    <div style={{
                      paddingTop: '8px', borderTop: '1px dashed var(--border-color)', marginTop: '4px',
                      display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '34px'
                    }}>
                      {subtasks.map(sub => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => handleToggleSubtask(task.id, sub.id)}
                            style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                          />
                          <span style={{
                            textDecoration: sub.completed ? 'line-through' : 'none',
                            color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}>
                            {sub.title}
                          </span>
                        </div>
                      ))}

                      {/* Add subtask input */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={expandedTaskId === task.id ? newSubtaskTitle : ''}
                          onFocus={() => setExpandedTaskId(task.id)}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(task.id); }}
                          style={{ padding: '3px 8px', fontSize: '12px', minHeight: '28px', flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(task.id)}
                          className="btn-secondary"
                          style={{ padding: '0 8px', minHeight: '28px', fontSize: '11px' }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
