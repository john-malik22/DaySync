import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Pause,
  Play,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Cake,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { calculateEndDate, formatHumanDate } from '../../services/dateUtils';

export function RecurringManager() {
  const {
    tasks,
    expenses,
    updateTask,
    updateExpense,
    deleteTask,
    deleteExpense
  } = useLuna();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Plan' | 'Subscription' | 'Recharge' | 'Reminder' | 'Birthday' | 'Meeting'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Paused'

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editRule, setEditRule] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Helper for computing effective next date for expenses
  const getExpenseNextDate = (e) => {
    if (e.endDate) return e.endDate;
    if (e.nextDueDate) return e.nextDueDate;
    return calculateEndDate(
      e.startDate || e.date,
      e.durationValue ? { value: e.durationValue, unit: e.durationUnit } : e.duration,
      e.frequency
    );
  };

  // Helper for computing repeat rule label for expenses
  const getExpenseRepeatRule = (e) => {
    if (e.duration) return e.duration;
    if (e.durationValue && e.durationUnit) return `${e.durationValue} ${e.durationUnit}`;
    if (e.frequency) return e.frequency;
    return 'Monthly';
  };

  // Consolidated Recurring Items
  const recurringItems = useMemo(() => {
    const items = [];

    // 1. Process Expenses/Plans
    (expenses || []).forEach((e) => {
      const isRecurring =
        e.isPlan ||
        e.isRecurring ||
        Boolean(e.duration) ||
        Boolean(e.durationValue) ||
        Boolean(e.frequency) ||
        ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category);

      if (isRecurring) {
        const type =
          e.category === 'Subscriptions'
            ? 'Subscription'
            : e.category === 'Recharges'
            ? 'Recharge'
            : 'Plan';

        items.push({
          id: e.id,
          name: e.description || e.category || 'Recurring Item',
          type,
          category: e.category || 'Plan',
          nextOccurrence: getExpenseNextDate(e),
          repeatRule: getExpenseRepeatRule(e),
          isPaused: Boolean(e.isPaused),
          amount: e.amount ? parseFloat(e.amount) : null,
          kind: 'expense',
          raw: e
        });
      }
    });

    // 2. Process Tasks/Reminders/Birthdays/Meetings
    (tasks || []).forEach((t) => {
      const isRecurring =
        t.recurring && t.recurring !== 'None' ||
        t.taskType === 'birthday' ||
        t.taskType === 'meeting';

      if (isRecurring) {
        const type =
          t.taskType === 'birthday'
            ? 'Birthday'
            : t.taskType === 'meeting'
            ? 'Meeting'
            : 'Reminder';

        const repeatRule =
          t.recurring && t.recurring !== 'None'
            ? t.recurring
            : t.taskType === 'birthday'
            ? 'Yearly'
            : t.taskType === 'meeting'
            ? 'Weekly'
            : 'Daily';

        items.push({
          id: t.id,
          name: t.title || (t.taskType === 'birthday' ? `${t.personName || 'Person'}'s Birthday` : 'Meeting'),
          type,
          category: t.category || type,
          nextOccurrence: t.dueDate || t.date || new Date().toISOString().split('T')[0],
          repeatRule,
          isPaused: Boolean(t.isPaused),
          amount: null,
          kind: 'task',
          raw: t
        });
      }
    });

    // Sort by next occurrence date ascending
    return items.sort((a, b) => new Date(a.nextOccurrence || 0) - new Date(b.nextOccurrence || 0));
  }, [expenses, tasks]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return recurringItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && !item.isPaused) ||
        (statusFilter === 'Paused' && item.isPaused);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [recurringItems, search, typeFilter, statusFilter]);

  // Toggle Pause / Resume
  const handleTogglePause = async (item) => {
    const newPaused = !item.isPaused;
    try {
      if (item.kind === 'expense') {
        await updateExpense(item.id, { isPaused: newPaused });
      } else {
        await updateTask(item.id, { isPaused: newPaused });
      }

      if (showToast) {
        showToast(
          `"${item.name}" ${newPaused ? 'paused' : 'resumed'}.`,
          newPaused ? 'info' : 'success'
        );
      }
    } catch (err) {
      if (showToast) showToast('Failed to update recurring status.', 'error');
    }
  };

  // Delete Item with Confirmation
  const handleDeleteItem = async (item) => {
    const confirmDelete = localStorage.getItem('daysync_confirm_delete') !== 'false';
    if (confirmDelete && !confirm(`Are you sure you want to delete recurring "${item.name}"?`)) {
      return;
    }

    try {
      if (item.kind === 'expense') {
        await deleteExpense(item.id);
      } else {
        await deleteTask(item.id);
      }
      if (showToast) showToast(`"${item.name}" deleted.`, 'info');
    } catch (err) {
      if (showToast) showToast('Failed to delete item.', 'error');
    }
  };

  // Start Editing Item
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDate(item.nextOccurrence ? item.nextOccurrence.split('T')[0] : '');
    setEditRule(item.repeatRule);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem || !editName.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      if (editingItem.kind === 'expense') {
        await updateExpense(editingItem.id, {
          description: editName.trim(),
          nextDueDate: editDate,
          endDate: editDate,
          duration: editRule
        });
      } else {
        await updateTask(editingItem.id, {
          title: editName.trim(),
          dueDate: editDate,
          recurring: editRule
        });
      }

      if (showToast) showToast(`"${editName.trim()}" updated.`, 'success');
      setEditingItem(null);
    } catch (err) {
      if (showToast) showToast('Failed to save changes.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Subscription':
      case 'Recharge':
      case 'Plan':
        return <Repeat size={14} color="var(--accent-primary)" />;
      case 'Birthday':
        return <Cake size={14} color="var(--accent-warning)" />;
      case 'Meeting':
        return <Users size={14} color="var(--accent-info, #3B82F6)" />;
      default:
        return <Clock size={14} color="var(--accent-primary)" />;
    }
  };

  return (
    <div className="glass-card recurring-manager-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={18} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '14px', fontWeight: '800', letterSpacing: '0.05em' }}>
            RECURRING ITEMS ({filteredItems.length})
          </h3>
        </div>

        {/* Status Filter Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {['All', 'Active', 'Paused'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? 'var(--accent-primary)' : 'transparent',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: statusFilter === st ? '700' : '500',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row: Type Filters */}
      <div className="scroll-row" style={{ gap: '6px' }}>
        {['All', 'Plan', 'Subscription', 'Recharge', 'Reminder', 'Birthday', 'Meeting'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              border: `1px solid ${typeFilter === type ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background: typeFilter === type ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: typeFilter === type ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: typeFilter === type ? '700' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No recurring items match your filters.
        </div>
      ) : (
        <div className="recurring-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredItems.map((item) => (
            <div
              key={`${item.kind}_${item.id}`}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: item.isPaused ? 'var(--bg-tertiary, rgba(255,255,255,0.03))' : 'var(--bg-secondary)',
                border: `1px solid ${item.isPaused ? 'var(--border-color)' : 'var(--border-color)'}`,
                opacity: item.isPaused ? 0.78 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* TOP ROW: [Icon]  Electricity Bill   [Active] */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getTypeIcon(item.type)}
                  </div>

                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </h4>
                </div>

                {/* Small status badge beside name on right */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.isPaused ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: item.isPaused ? 'var(--accent-warning)' : 'var(--accent-success)',
                    flexShrink: 0
                  }}
                >
                  {item.isPaused ? 'Paused' : 'Active'}
                </span>
              </div>

              {/* SECOND ROW: Type: Plan • Repeat: Monthly • ₹1,248 */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Type: <strong style={{ color: 'var(--text-secondary)' }}>{item.type}</strong></span>
                <span>•</span>
                <span>Repeat: <strong style={{ color: 'var(--text-secondary)' }}>{item.repeatRule}</strong></span>
                {item.amount !== null && (
                  <>
                    <span>•</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '13px' }}>₹{item.amount.toLocaleString('en-IN')}</span>
                  </>
                )}
              </div>

              {/* MIDDLE: NEXT OCCURRENCE Block */}
              <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  NEXT OCCURRENCE
                </span>
                <strong style={{ fontSize: '13px', fontWeight: '700', color: item.isPaused ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {formatHumanDate(item.nextOccurrence)}
                </strong>
              </div>

              {/* BOTTOM ROW: [ Edit ] [ Pause ] [ Delete ] (Aligned 3 action buttons) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '7px 8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    gap: '4px',
                    width: '100%'
                  }}
                >
                  <Edit2 size={13} /> Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePause(item)}
                  style={{
                    background: item.isPaused ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${item.isPaused ? 'var(--accent-success)' : 'var(--accent-warning)'}`,
                    borderRadius: '6px',
                    padding: '7px 8px',
                    color: item.isPaused ? 'var(--accent-success)' : 'var(--accent-warning)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    gap: '4px',
                    width: '100%'
                  }}
                >
                  {item.isPaused ? <Play size={13} /> : <Pause size={13} />}
                  {item.isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '7px 8px',
                    color: 'var(--accent-danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    gap: '4px',
                    width: '100%'
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                Edit Recurring Item
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Name / Description
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Next Occurrence / Payment Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Repeat Rule
                </label>
                <select
                  value={editRule}
                  onChange={(e) => setEditRule(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="28 days">28 days</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="1 year">1 year</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
