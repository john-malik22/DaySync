import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, CheckCircle2, Calendar, Clock, Repeat, Cake, Users, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ErrorState, StaleIndicator } from '../common/ErrorState';
import { formatDate } from '../dashboard/WidgetComponents';

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

  const filteredTasks = (tasks || []).filter(t => !searchFilter || (t.title && t.title.toLowerCase().includes(searchFilter.toLowerCase())));

  // Strict Fallback Priority Logic: High -> Medium -> Low (Latest 3 pending tasks)
  const priorityPanelData = useMemo(() => {
    const pendingTasks = (tasks || []).filter(t => !t.completed);

    const pendingHigh = pendingTasks.filter(t => t.priority === 'High');
    if (pendingHigh.length > 0) {
      return {
        title: 'HIGH PRIORITY',
        color: 'var(--accent-danger)',
        tasks: pendingHigh.slice(-3).reverse()
      };
    }

    const pendingMedium = pendingTasks.filter(t => t.priority === 'Medium');
    if (pendingMedium.length > 0) {
      return {
        title: 'MEDIUM PRIORITY',
        color: 'var(--accent-warning)',
        tasks: pendingMedium.slice(-3).reverse()
      };
    }

    const pendingLow = pendingTasks.filter(t => t.priority === 'Low');
    if (pendingLow.length > 0) {
      return {
        title: 'LOW PRIORITY',
        color: 'var(--accent-primary)',
        tasks: pendingLow.slice(-3).reverse()
      };
    }

    return {
      title: 'PRIORITY TASKS',
      color: 'var(--accent-primary)',
      tasks: []
    };
  }, [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* TOP TWO-CONTAINER AREA (Left: Add Task | Right: Priority Tasks Panel) */}
      <div className="task-top-grid">
        {/* LEFT CONTAINER — ADD TASK */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ color: 'var(--accent-primary)', margin: 0, fontSize: '13.5px', fontWeight: '800', letterSpacing: '0.05em' }}>
              {taskType === 'birthday' ? 'ADD BIRTHDAY' : taskType === 'meeting' ? 'ADD MEETING' : 'ADD TASK'}
            </h3>

            {/* Type selector: Task, Birthday, Meeting */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)', height: '34px' }}>
              <button
                type="button"
                onClick={() => setTaskType('task')}
                disabled={isSubmitting}
                style={{
                  padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'task' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'task' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: taskType === 'task' ? '700' : '500', fontSize: '11.5px',
                  display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={13} /> Task
              </button>
              <button
                type="button"
                onClick={() => setTaskType('birthday')}
                disabled={isSubmitting}
                style={{
                  padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'birthday' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'birthday' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: taskType === 'birthday' ? '700' : '500', fontSize: '11.5px',
                  display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
                }}
              >
                <Cake size={13} /> Birthday
              </button>
              <button
                type="button"
                onClick={() => setTaskType('meeting')}
                disabled={isSubmitting}
                style={{
                  padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: taskType === 'meeting' ? 'var(--accent-primary)' : 'transparent',
                  color: taskType === 'meeting' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: taskType === 'meeting' ? '700' : '500', fontSize: '11.5px',
                  display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease'
                }}
              >
                <Users size={13} /> Meeting
              </button>
            </div>
          </div>

          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* MODE 1: TASK MODE */}
            {taskType === 'task' && (
              <>
                {/* Row 1 → Task Name + Save */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>TASK NAME</label>
                    <input
                      type="text"
                      placeholder="Add new task or reminder..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', minHeight: '36px', fontSize: '13px' }}
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ minHeight: '36px', fontSize: '12.5px', padding: '0 16px', flexShrink: 0, justifyContent: 'center' }}
                  >
                    <Plus size={15} /> {isSubmitting ? 'Saving...' : 'Save Task'}
                  </button>
                </div>

                {/* Row 2 → Due Date + Time + Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>DUE DATE</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>TIME</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PRIORITY</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', minHeight: '34px', fontSize: '12px' }}
                    >
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Priority</option>
                      <option value="Low">🔵 Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* Row 3 → Recurring */}
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>RECURRING</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
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
              </>
            )}

            {/* MODE 2: BIRTHDAY MODE */}
            {taskType === 'birthday' && (
              <>
                {/* Row 1 → Person + Save */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PERSON NAME</label>
                    <input
                      type="text"
                      placeholder="Person Name (e.g. Rahul, Anjali)"
                      value={personName}
                      onChange={(e) => {
                        setPersonName(e.target.value);
                        setTitle(e.target.value ? `${e.target.value}'s Birthday` : '');
                      }}
                      disabled={isSubmitting}
                      style={{ width: '100%', minHeight: '36px', fontSize: '13px' }}
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ minHeight: '36px', fontSize: '12.5px', padding: '0 16px', flexShrink: 0, justifyContent: 'center' }}
                  >
                    <Plus size={15} /> {isSubmitting ? 'Saving...' : 'Save Birthday'}
                  </button>
                </div>

                {/* Row 2 → Date + Reminder + Repeat Rule */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>BIRTHDAY DATE</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>REMINDER TIME</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>REPEAT RULE</label>
                    <div style={{
                      padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(236, 72, 153, 0.12)',
                      border: '1px solid rgba(236, 72, 153, 0.25)', fontSize: '11.5px', fontWeight: '700', color: '#EC4899',
                      minHeight: '34px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      <Cake size={13} /> Yearly Automatic
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* MODE 3: MEETING MODE */}
            {taskType === 'meeting' && (
              <>
                {/* Row 1 → Meeting Title + Save */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>MEETING TITLE</label>
                    <input
                      type="text"
                      placeholder="Meeting Title (e.g. Sprint Review, Client Call)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', minHeight: '36px', fontSize: '13px' }}
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ minHeight: '36px', fontSize: '12.5px', padding: '0 16px', flexShrink: 0, justifyContent: 'center' }}
                  >
                    <Plus size={15} /> {isSubmitting ? 'Saving...' : 'Save Meeting'}
                  </button>
                </div>

                {/* Row 2 → Date + Time + Recurring */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>DATE</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>TIME</label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>RECURRING</label>
                    <select
                      value={recurring}
                      onChange={(e) => setRecurring(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 6px', minHeight: '34px' }}
                    >
                      <option value="None">None</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Every 2 weeks">Bi-weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Row 3 → People + Location */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>PEOPLE / ATTENDEES</label>
                    <input
                      type="text"
                      placeholder="e.g. John, Sara, Alex"
                      value={meetingPeople}
                      onChange={(e) => setMeetingPeople(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: '600' }}>LOCATION / LINK</label>
                    <input
                      type="text"
                      placeholder="e.g. Zoom / Room 4B"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={isSubmitting}
                      style={{ width: '100%', fontSize: '12px', padding: '4px 8px', minHeight: '34px' }}
                    />
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* RIGHT CONTAINER — PRIORITY TASKS PANEL */}
        <div className="glass-card task-blank-panel" style={{
          display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: priorityPanelData.color, margin: 0, fontSize: '13.5px', fontWeight: '800', letterSpacing: '0.05em' }}>
              {priorityPanelData.title}
            </h3>
            {priorityPanelData.tasks.length > 0 && (
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '700' }}>
                LATEST {priorityPanelData.tasks.length}
              </span>
            )}
          </div>

          {priorityPanelData.tasks.length === 0 ? (
            <div style={{
              padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1
            }}>
              No priority tasks to show.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {priorityPanelData.tasks.map((task) => (
                <div key={task.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {task.dueDate ? formatDate(task.dueDate) : 'Today'} {task.dueTime ? `• ${task.dueTime}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                    background: 'var(--bg-tertiary)', color: priorityPanelData.color, flexShrink: 0, marginLeft: '8px'
                  }}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HISTORY SECTION */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '14.5px', fontWeight: '800', letterSpacing: '0.05em' }}>
            HISTORY ({filteredTasks.length})
          </h3>
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
