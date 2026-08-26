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
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '480px', maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        padding: '16px', borderRadius: '16px'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700' }}>
            + Add Widget to Dashboard
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 32px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '12px'
            }}
          />
        </div>

        {/* Category Horizontal Scroll Chips */}
        <div className="scroll-row" style={{
          display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', gap: '6px',
          marginBottom: '10px', paddingBottom: '4px', scrollbarWidth: 'none'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700',
                border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer', flexShrink: 0
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Compact Widget Row List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
          {filteredWidgets.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
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
                    padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', minHeight: '54px'
                  }}
                >
                  {/* Left Icon + Text Block */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(108, 99, 255, 0.12)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {widget.title}
                      </div>
                      <div style={{
                        fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {widget.description}
                      </div>
                    </div>
                  </div>

                  {/* Right Compact Action Control */}
                  {isAdded ? (
                    <div style={{
                      fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--accent-success)',
                      color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0
                    }}>
                      <Check size={13} /> Added
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddWidget(widget)}
                      className="btn-primary"
                      style={{
                        fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: 'var(--radius-full)',
                        display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, minHeight: '28px'
                      }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
