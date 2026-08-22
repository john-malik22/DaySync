import React, { useState } from 'react';
import { Trash2, Edit2, Plus, ShieldCheck, Check, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ErrorState } from '../common/ErrorState';

export function MemoryCenter({ searchFilter }) {
  const { memories, addMemory, updateMemory, deleteMemory, errors, resourceLoading, fetchMemories } = useLuna();
  const { showToast } = useToast();

  const [filter, setFilter] = useState('All');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Preferences');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('Preferences');

  const categories = ['All', 'Preferences', 'Routine', 'Goals', 'Financial'];

  const filteredMemories = memories
    .filter(m => filter === 'All' || m.type?.toLowerCase() === filter.toLowerCase())
    .filter(m => !searchFilter || m.content.toLowerCase().includes(searchFilter.toLowerCase()));

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addMemory({
        type: newType,
        content: newContent.trim(),
        confidence: 1.0,
        approved: true
      });
      setNewContent('');
      if (showToast) showToast('Memory saved to Luna.', 'success');
    } catch (err) {
      if (showToast) showToast('Couldn\'t save memory. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (mem) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditType(mem.type || 'Preferences');
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    try {
      await updateMemory(id, {
        type: editType,
        content: editContent.trim(),
        approved: true
      });
      setEditingId(null);
      if (showToast) showToast('Memory updated successfully.', 'success');
    } catch (err) {
      if (showToast) showToast('Couldn\'t update memory. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this memory item?')) {
      try {
        await deleteMemory(id);
        if (showToast) showToast('Memory item deleted.', 'info');
      } catch (err) {
        if (showToast) showToast('Couldn\'t delete this memory. Nothing was changed.', 'error');
      }
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
            disabled={isSubmitting}
            style={{ minHeight: '38px', fontSize: '13px' }}
            required
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            disabled={isSubmitting}
            style={{ minHeight: '38px', fontSize: '13px' }}
          >
            <option value="Preferences">Preferences</option>
            <option value="Routine">Routine</option>
            <option value="Goals">Goals</option>
            <option value="Financial">Financial</option>
          </select>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }}>
            <Plus size={15} /> {isSubmitting ? 'Saving...' : 'Save'}
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
              background: filter === cat ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === cat ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${filter === cat ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              fontSize: '12px', cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Memory Items List */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '14px' }}>SAVED MEMORIES</h3>

        {errors?.memories ? (
          <ErrorState
            title={errors.memories.title}
            message={errors.memories.message}
            onRetry={fetchMemories}
            isRetrying={resourceLoading?.memories}
          />
        ) : resourceLoading?.memories && memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading memories...
          </div>
        ) : filteredMemories.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            {searchFilter || filter !== 'All' ? 'No memories found matching your filters.' : 'Your Memory Center is currently empty.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {filteredMemories.map(mem => {
              const isEditing = editingId === mem.id;
              if (isEditing) {
                return (
                  <div key={mem.id} className="mobile-stack-form" style={{
                    display: 'grid', gridTemplateColumns: '1.5fr auto auto auto', gap: 'var(--space-xs)',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-primary)', alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <option value="Preferences">Preferences</option>
                      <option value="Routine">Routine</option>
                      <option value="Goals">Goals</option>
                      <option value="Financial">Financial</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(mem.id)}
                      className="btn-primary"
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', minHeight: '34px', fontSize: '12px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={mem.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {mem.content}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Type: {mem.type || 'Preferences'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(mem)}
                      className="btn-secondary"
                      title="Edit Memory"
                      style={{ padding: '4px 8px', minHeight: '30px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(mem.id)}
                      className="btn-secondary"
                      title="Delete Memory"
                      style={{ padding: '4px 8px', minHeight: '30px', color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
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
