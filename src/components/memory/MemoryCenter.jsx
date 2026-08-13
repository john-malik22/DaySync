import React, { useState } from 'react';
import { Trash2, ShieldCheck, Plus } from 'lucide-react';
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
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h3>Memory Center</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Review, add, or forget personal context and AI facts.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
          <ShieldCheck size={14} /> Explicit Consent Protection
        </div>
      </div>

      {/* Filter Chips */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-4)' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
              background: filter === cat ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: filter === cat ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Manual Memory Form */}
      <form onSubmit={handleManualAdd} className="grid-3" style={{ gridTemplateColumns: '1fr auto auto', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input
          type="text"
          placeholder="Add something for Luna to remember (e.g. Prefers night study)"
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
          <Plus size={16} /> Save Fact
        </button>
      </form>

      {/* Memory Grid */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
        {filteredMemories.map((mem) => {
          const confidencePct = Math.round((mem.confidence || 0.9) * 100);
          return (
            <div key={mem.id} style={{
              padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
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
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
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
                  title="Forget Memory"
                  style={{ padding: '4px 8px', minHeight: 'auto', fontSize: '0.75rem', color: 'var(--accent-danger)' }}
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
