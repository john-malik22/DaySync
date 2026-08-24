import React, { useState } from 'react';
import { WIDGET_CATALOG } from './widgetCatalog';
import { X, Plus, Check, Search } from 'lucide-react';

export function WidgetPickerModal({ isOpen, onClose, activeWidgetIds, onAddWidget }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', 'CORE', 'FINANCE', 'PLANS', 'HABITS', 'LUNA', 'LIFE', 'UTILITY'];

  const filteredWidgets = WIDGET_CATALOG.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || w.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '540px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        padding: '20px', borderRadius: 'var(--radius-md)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' }}>
            + Add Widget to Dashboard
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: '4px', borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '13px'
            }}
          />
        </div>

        {/* Category Chips */}
        <div className="scroll-row" style={{ gap: '6px', marginBottom: '14px', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700',
                border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Widget List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {filteredWidgets.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching widgets found.
            </div>
          ) : (
            filteredWidgets.map(widget => {
              const isAdded = activeWidgetIds.includes(widget.id);
              const IconComp = widget.icon;

              return (
                <div
                  key={widget.id}
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(108, 99, 255, 0.12)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{widget.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{widget.description}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => !isAdded && onAddWidget(widget)}
                    disabled={isAdded}
                    className={isAdded ? 'btn-secondary' : 'btn-primary'}
                    style={{
                      fontSize: '12px', padding: '6px 12px', minHeight: '32px', flexShrink: 0,
                      opacity: isAdded ? 0.7 : 1
                    }}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} color="var(--accent-success)" /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
