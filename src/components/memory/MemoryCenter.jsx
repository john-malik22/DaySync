import React, { useState } from 'react';
import { Brain, Trash2, Edit3, ShieldCheck, Plus, Check } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function MemoryCenter() {
  const { memories, addMemory, deleteMemory } = useLuna();
  const [filter, setFilter] = useState('All');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Preferences');

  const categories = ['All', 'Preferences', 'Routine', 'Goals', 'Financial'];

  const filteredMemories = filter === 'All' 
    ? memories 
    : memories.filter(m => m.type?.toLowerCase() === filter.toLowerCase());

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    addMemory({
      type: newType,
      content: newContent,
      confidence: 1.0,
      approved: true
    });
    setNewContent('');
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>MY MEMORIES</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Every memory saved by Luna is under your direct control.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 12px', borderRadius: '99px', fontWeight: '600' }}>
          <ShieldCheck size={14} /> Explicit Consent Protection
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', pb: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--border-color)',
              background: filter === cat ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: filter === cat ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Manual Memory Form */}
      <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Add something for Luna to remember (e.g. Prefers night study)"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '10px',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: '#fff'
          }}
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: '10px',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: '#fff'
          }}
        >
          <option value="Preferences">Preferences</option>
          <option value="Routine">Routine</option>
          <option value="Goals">Goals</option>
          <option value="Financial">Financial</option>
        </select>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Save Fact
        </button>
      </form>

      {/* Memory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {filteredMemories.map((mem) => {
          const confidencePct = Math.round((mem.confidence || 0.9) * 100);
          return (
            <div key={mem.id} style={{
              padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                    color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.15)',
                    padding: '2px 8px', borderRadius: '4px'
                  }}>
                    {mem.type}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Confidence: {confidencePct}%
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  "{mem.content}"
                </p>
              </div>

              <div style={{
                marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Source: {mem.approved ? 'User Approved' : 'Detected'}
                </span>
                <button
                  onClick={() => deleteMemory(mem.id)}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)' }}
                >
                  <Trash2 size={13} /> Forget
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
