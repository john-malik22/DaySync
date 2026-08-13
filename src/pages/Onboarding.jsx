import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Onboarding() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const [selected, setSelected] = useState(['Daily planning', 'Expenses', 'Reminders', 'Learning']);

  const options = [
    'Task Management',
    'Expense & Income Tracking',
    'Reminders',
    'AI Memory Context'
  ];

  const toggleOption = (opt) => {
    setSelected(prev => 
      prev.includes(opt) ? prev.filter(item => item !== opt) : [...prev, opt]
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
    navigate('/app/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '480px', padding: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Welcome to DaySync</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Smart Life Companion with Luna AI</p>
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
          What would you like DaySync to help with?
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Select your primary goals to personalize your workspace.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: '12px',
                  background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                  border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt}</span>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '6px',
                  background: isChecked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isChecked && <CheckCircle2 size={16} color="#fff" />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleFinish}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Continue to DaySync Dashboard <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
