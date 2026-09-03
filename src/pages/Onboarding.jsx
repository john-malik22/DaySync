import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStartupRoute } from '../App';
import { DEFAULT_WIDGET_LAYOUT } from '../components/dashboard/widgetCatalog';

export function Onboarding() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const [selected, setSelected] = useState(['Tasks', 'Expenses', 'Plans', 'Habits', 'Splits']);

  const options = [
    { id: 'Tasks', label: 'Task & Reminder Management' },
    { id: 'Expenses', label: 'Expense & Spending Snapshot' },
    { id: 'Plans', label: 'Subscriptions & Utility Plans' },
    { id: 'Habits', label: 'Habit Tracking' },
    { id: 'Splits', label: 'Shared Expense Splits' }
  ];

  const toggleOption = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (!user) {
      try {
        await signup('Guest User', `guest_${Date.now()}@daysync.ai`, 'guest_pass_123');
      } catch (e) {
        console.log('Session fallback:', e);
      }
    }

    localStorage.setItem('daysync_onboarding_done', 'true');
    // Ensure initial default widgets are populated
    const storageKey = `daysync_dashboard_layout_${user?.id || 'guest'}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_WIDGET_LAYOUT));
    }
    navigate(getStartupRoute());
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>Welcome to DaySync</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>Smart Life Companion with Luna AI</p>
          </div>
        </div>

        <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
          What matters most to you?
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Select your primary focus areas to customize your DaySync experience.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
          {options.map((opt) => {
            const isChecked = selected.includes(opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '10px',
                  background: isChecked ? 'rgba(108, 99, 255, 0.12)' : 'var(--bg-secondary)',
                  border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{opt.label}</span>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '5px',
                  background: isChecked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isChecked && <CheckCircle2 size={14} color="#fff" />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleFinish}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', cursor: 'pointer' }}
        >
          Continue to DaySync Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
