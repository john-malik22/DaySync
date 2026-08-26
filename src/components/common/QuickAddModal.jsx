import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  CreditCard,
  Repeat,
  Activity,
  Users,
  Cake,
  Clock,
  Plus,
  X
} from 'lucide-react';

export function QuickAddModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const quickActions = [
    { key: 'task', label: 'Add Task', desc: 'New task or to-do item', icon: CheckSquare, route: '/app/task' },
    { key: 'expense', label: 'Add Expense', desc: 'Log a personal transaction', icon: CreditCard, route: '/app/expenses' },
    { key: 'plan', label: 'Add Plan / Sub', desc: 'Recurring payment or utility', icon: Repeat, route: '/app/plans' },
    { key: 'habit', label: 'Add Habit', desc: 'New daily or weekly habit', icon: Activity, route: '/app/habits' },
    { key: 'split', label: 'Add Split Expense', desc: 'Shared group expense', icon: Users, route: '/app/splits' },
    { key: 'birthday', label: 'Add Birthday / Event', desc: 'Life meeting or birthday', icon: Cake, route: '/app/task' },
    { key: 'reminder', label: 'Add Reminder', desc: 'Scheduled alarm or reminder', icon: Clock, route: '/app/task' }
  ];

  const handleActionClick = (route) => {
    onClose();
    navigate(route);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
      zIndex: 1200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '12px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '440px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        padding: '20px', borderRadius: '20px', border: '1px solid var(--accent-primary)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.35)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--accent-primary)" /> Quick Add
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Quick Add sheet"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '2px' }}>
          {quickActions.map(act => {
            const IconComp = act.icon;
            return (
              <button
                key={act.key}
                type="button"
                onClick={() => handleActionClick(act.route)}
                aria-label={act.label}
                style={{
                  padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center',
                  justify: 'space-between', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(108, 99, 255, 0.12)',
                    color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{act.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{act.desc}</div>
                  </div>
                </div>

                <Plus size={16} color="var(--accent-primary)" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
