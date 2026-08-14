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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* 1. Add Something Form Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ color: 'var(--accent-primary)' }}>Add Something</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-primary)' }}>
            <ShieldCheck size={14} /> Explicit Consent
          </div>
        </div>

        <form onSubmit={handleManualAdd} className="mobile-stack-form" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-sm)' }}>
          <input
            type="text"
            placeholder="Add something for Luna to remember..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="Preferences">Preferences</option>
            <option value="Routine">Routine</option>
            <option value="Goals">Goals</option>
            <option value="Financial">Financial</option>
          </select>
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Save
          </button>
        </form>
      </div>

      {/* 2. Filter Tabs */}
      <div className="scroll-row">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: filter === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: filter === cat ? '700' : '500', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            [ {cat} ]
          </button>
        ))}
      </div>

      {/* 3. Recent Memory Grid */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Recent</h3>
        {filteredMemories.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No memories saved yet.</p>
        ) : (
          <div className="grid-2">
            {filteredMemories.map((mem) => (
              <div key={mem.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                      color: '#FFFFFF', background: 'var(--accent-primary)',
                      padding: '2px 8px', borderRadius: '4px'
                    }}>
                      {mem.type}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Source: {mem.approved ? 'Approved' : 'Detected'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    "{mem.content}"
                  </p>
                </div>

                <div style={{
                  marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'flex-end', gap: '8px'
                }}>
                  <button
                    onClick={() => deleteMemory(mem.id)}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: '12px', color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
