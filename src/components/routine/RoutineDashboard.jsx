import React from 'react';
import { Clock, Sun, Sunrise, Sunset, Moon, Trash2, CheckCircle2 } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function RoutineDashboard() {
  const { routines, deleteRoutine } = useLuna();

  const getIcon = (timeOfDay) => {
    switch (timeOfDay?.toLowerCase()) {
      case 'morning': return Sunrise;
      case 'afternoon': return Sun;
      case 'evening': return Sunset;
      default: return Moon;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>MY ROUTINE</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Repeated behavior patterns detected by Luna's routine recognition engine.
          </p>
        </div>
        <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' }}>
          Pattern Engine Active
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {routines.map((routine) => {
          const Icon = getIcon(routine.timeOfDay);
          const confidencePercent = Math.round((routine.confidence || 0.85) * 100);

          return (
            <div key={routine.id} style={{
              padding: '18px', borderRadius: '14px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={16} color="var(--accent-primary)" />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      {routine.timeOfDay}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', fontWeight: '600' }}>
                    {confidencePercent}% Confidence
                  </span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '6px' }}>
                  {routine.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {routine.pattern}
                </p>
              </div>

              <div style={{
                marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)'
              }}>
                <span>Last: {routine.lastDetected || 'Today'}</span>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Forget Pattern
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
