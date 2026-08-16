import React, { useState } from 'react';
import { Trash2, Edit2, Plus, ShieldCheck, Check, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function MemoryCenter({ searchFilter }) {
  const { memories, addMemory, updateMemory, deleteMemory } = useLuna();
  const [filter, setFilter] = useState('All');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Preferences');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('Preferences');

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

  const startEdit = (mem) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditType(mem.type || 'Preferences');
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    if (updateMemory) {
      await updateMemory(id, {
        type: editType,
        content: editContent,
        approved: true
      });
    }
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this memory item?')) {
      await deleteMemory(id);
    }
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
            {filteredMemories.map((mem) => {
              const isEditing = editingId === mem.id;

              if (isEditing) {
                return (
                  <div key={mem.id} className="glass-card" style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        style={{ minHeight: '34px', fontSize: '13px', padding: '4px 8px', width: 'auto', minWidth: '110px' }}
                      >
                        <option value="Preferences">Preferences</option>
                        <option value="Routine">Routine</option>
                        <option value="Goals">Goals</option>
                        <option value="Financial">Financial</option>
                      </select>
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ minHeight: '34px', fontSize: '13px', flex: 1, padding: '4px 10px', minWidth: '120px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(mem.id)}
                        className="btn-primary"
                        title="Save"
                        style={{ padding: '4px 10px', minHeight: '34px', fontSize: '13px', flexShrink: 0 }}
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn-secondary"
                        title="Cancel"
                        style={{ padding: '4px 8px', minHeight: '34px', fontSize: '13px', flexShrink: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={mem.id}
                  className="glass-card"
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}
                >
                  {/* Row 1: Category Tag on left | Source metadata on right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                      color: '#FFFFFF', background: 'var(--accent-primary)',
                      padding: '2px 6px', borderRadius: '4px'
                    }}>
                      {mem.type}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Source: {mem.approved ? 'Approved' : 'Detected'}
                    </span>
                  </div>

                  {/* Row 2: Memory text on left | Compact [✎] [🗑] icon buttons on right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                      "{mem.content}"
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {/* Small Edit Icon Button [✎] */}
                      <button
                        type="button"
                        onClick={() => startEdit(mem)}
                        title="Edit Memory"
                        style={{
                          padding: '4px',
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Small Trash/Delete Icon Button [🗑] */}
                      <button
                        type="button"
                        onClick={() => handleDelete(mem.id)}
                        title="Delete Memory"
                        style={{
                          padding: '4px',
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-danger)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
