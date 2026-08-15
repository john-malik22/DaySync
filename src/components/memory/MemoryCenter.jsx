import React, { useState } from 'react';
import { Trash2, Plus, ShieldCheck } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function MemoryCenter({ searchFilter }) {
  const { memories, addMemory, deleteMemory } = useLuna();
  const [filter, setFilter] = useState('All');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Preferences');

  const categories = ['All', 'Preferences', 'Routine', 'Goals', 'Financial'];

  const filteredMemories = memories
    .filter(m => filter === 'All' || m.type?.toLowerCase() === filter.toLowerCase())
    .filter(m => !searchFilter || m.content.toLowerCase().includes(searchFilter.toLowerCase()));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 1. Add Memory Form Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '15px' }}>ADD MEMORY</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-primary)' }}>
            <ShieldCheck size={13} /> Explicit Consent
          </div>
        </div>

        <form onSubmit={handleManualAdd} className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-xs)' }}>
          <input
            type="text"
            placeholder="Add something Luna should remember..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            style={{ minHeight: '38px', fontSize: '13px' }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            style={{ minHeight: '38px', fontSize: '13px' }}
          >
            <option value="Preferences">Preferences</option>
            <option value="Routine">Routine</option>
            <option value="Goals">Goals</option>
            <option value="Financial">Financial</option>
          </select>
          <button type="submit" className="btn-primary" style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }}>
            <Plus size={15} /> Save
          </button>
        </form>
      </div>

      {/* 2. Category Filter Chips */}
      <div className="scroll-row">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: filter === cat ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: filter === cat ? '700' : '500', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Compact Recent Memory Cards */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)', fontSize: '14px' }}>Recent</h3>
        {filteredMemories.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No memories saved yet.</p>
        ) : (
          <div className="grid-2" style={{ gap: 'var(--space-xs)' }}>
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="glass-card"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                {/* Category Badge & Content in same visual row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                    color: '#FFFFFF', background: 'var(--accent-primary)',
                    padding: '2px 6px', borderRadius: '4px', flexShrink: 0
                  }}>
                    {mem.type}
                  </span>

                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      "{mem.content}"
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Source: {mem.approved ? 'Approved' : 'Detected'}
                    </div>
                  </div>
                </div>

                {/* Small Trash/Delete Icon Button */}
                <button
                  type="button"
                  onClick={() => deleteMemory(mem.id)}
                  title="Delete Memory"
                  style={{
                    padding: '4px',
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
