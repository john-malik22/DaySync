import React, { useEffect } from 'react';
import { X, DollarSign, CheckCircle2, Cake, Users, Info } from 'lucide-react';

export function HistoryDetailModal({ isOpen, onClose, type, data }) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return 'Not set';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const formatDateTime = (val) => {
    if (!val) return 'Not set';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  // Determine modal header icon and title
  let modalTitle = 'Details';
  let IconComponent = Info;
  let iconBg = 'var(--color-primary-soft)';
  let iconColor = 'var(--accent-primary)';

  const recordType = type || (data.taskType === 'birthday' ? 'birthday' : data.taskType === 'meeting' ? 'meeting' : data.taskType === 'task' ? 'task' : 'expense');

  if (recordType === 'expense') {
    modalTitle = 'Expense Details';
    IconComponent = DollarSign;
    const isIncome = data.type === 'income' || data.txType === 'income';
    iconBg = isIncome ? 'rgba(47, 111, 115, 0.15)' : 'rgba(200, 92, 92, 0.15)';
    iconColor = isIncome ? 'var(--accent-primary)' : 'var(--accent-danger)';
  } else if (recordType === 'birthday' || data.taskType === 'birthday') {
    modalTitle = 'Birthday Details';
    IconComponent = Cake;
    iconBg = 'rgba(245, 158, 11, 0.15)';
    iconColor = 'var(--accent-warning)';
  } else if (recordType === 'meeting' || data.taskType === 'meeting') {
    modalTitle = 'Meeting Details';
    IconComponent = Users;
    iconBg = 'rgba(91, 80, 230, 0.15)';
    iconColor = 'var(--accent-primary)';
  } else if (recordType === 'task' || data.taskType === 'task') {
    modalTitle = 'Task Details';
    IconComponent = CheckCircle2;
    iconBg = 'rgba(91, 80, 230, 0.15)';
    iconColor = 'var(--accent-primary)';
  }

  // Build detail rows array: { label, value }
  let rows = [];

  if (recordType === 'expense') {
    const isIncome = data.type === 'income' || data.txType === 'income';
    rows = [
      { label: 'Name / Title', value: formatValue(data.description || data.title || data.category) },
      { label: 'Description', value: formatValue(data.description || data.notes || data.note) },
      { label: 'Category', value: formatValue(data.category) },
      { label: 'Type', value: isIncome ? 'Received' : 'Spent' },
      { label: 'Amount', value: data.amount != null ? `₹${Number(data.amount).toLocaleString()}` : 'Not set' },
      { label: 'Start Date', value: formatValue(data.startDate || data.date) },
      { label: 'Duration', value: formatValue(data.durationStr || data.duration || (data.durationValue ? `${data.durationValue} ${data.durationUnit || 'days'}` : null)) },
      { label: 'End Date', value: formatValue(data.calculatedEndDateIso || data.endDate) },
      { label: 'Payment Method', value: formatValue(data.paymentMethod || data.payment_method) },
      { label: 'Add As Mode', value: formatValue(data.addAs) },
      { label: 'Operator / Provider', value: formatValue(data.operator) },
      { label: 'Account / Phone', value: formatValue(data.phoneOrAccount) },
      { label: 'Notes', value: formatValue(data.notes || data.note) },
      { label: 'Created Date/Time', value: formatDateTime(data.createdAt || data.date) }
    ];
  } else if (recordType === 'birthday' || data.taskType === 'birthday') {
    const personName = data.personName || (data.title ? data.title.replace(/'s Birthday$/i, '') : null);
    rows = [
      { label: 'Person Name', value: formatValue(personName) },
      { label: 'Birthday Date', value: formatValue(data.dueDate || data.date) },
      { label: 'Reminder Time', value: formatValue(data.dueTime || data.time) },
      { label: 'Repeat Rule', value: formatValue(data.recurring || 'Yearly Automatic') },
      { label: 'Created Date/Time', value: formatDateTime(data.createdAt) }
    ];
  } else if (recordType === 'meeting' || data.taskType === 'meeting') {
    rows = [
      { label: 'Meeting Title', value: formatValue(data.title) },
      { label: 'Date', value: formatValue(data.dueDate || data.date) },
      { label: 'Time', value: formatValue(data.dueTime || data.time) },
      { label: 'Recurring', value: formatValue(data.recurring) },
      { label: 'People / Attendees', value: formatValue(data.meetingPeople || data.people) },
      { label: 'Location / Link', value: formatValue(data.location) },
      { label: 'Description / Notes', value: formatValue(data.description || data.notes) },
      { label: 'Created Date/Time', value: formatDateTime(data.createdAt) }
    ];
  } else {
    // Task
    const subtaskSummary = Array.isArray(data.subtasks) && data.subtasks.length > 0
      ? `${data.subtasks.filter(s => s.completed).length}/${data.subtasks.length} completed`
      : null;
    rows = [
      { label: 'Task Name', value: formatValue(data.title) },
      { label: 'Description', value: formatValue(data.description || data.notes) },
      { label: 'Due Date', value: formatValue(data.dueDate || data.date) },
      { label: 'Time', value: formatValue(data.dueTime || data.time || (data.timeBlock ? data.timeBlock.split(' - ')[0] : null)) },
      { label: 'Priority', value: formatValue(data.priority) },
      { label: 'Status', value: data.completed ? 'Completed' : 'Pending' },
      { label: 'Recurring', value: formatValue(data.recurring) },
      { label: 'Subtasks', value: formatValue(subtaskSummary) },
      { label: 'Created Date/Time', value: formatDateTime(data.createdAt) }
    ];
  }

  // Keep core standard fields or any field that has a real value
  const standardRows = rows.filter(row => {
    return row.value !== 'Not set' || ['Name / Title', 'Task Name', 'Person Name', 'Meeting Title', 'Category', 'Type', 'Amount', 'Due Date', 'Birthday Date', 'Date', 'Priority', 'Status'].includes(row.label);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          maxHeight: '85vh',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '18px 20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={16} color={iconColor} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {modalTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Detail Rows */}
        <div style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-color)'
        }}>
          {standardRows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '12.5px',
                paddingBottom: '8px',
                borderBottom: idx < standardRows.length - 1 ? '1px solid var(--border-subtle)' : 'none'
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontWeight: '600', flexShrink: 0, minWidth: '110px' }}>
                {row.label}
              </span>
              <span style={{
                color: row.value === 'Not set' ? 'var(--text-muted)' : 'var(--text-primary)',
                fontWeight: row.value === 'Not set' ? '400' : '600',
                textAlign: 'right',
                wordBreak: 'break-word',
                flex: 1
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
