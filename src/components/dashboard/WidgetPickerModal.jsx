import React, { useState, useEffect } from 'react';
import { WIDGET_CATALOG, DEFAULT_WIDGET_LAYOUT } from './widgetCatalog';
import { X, Check, Search, ChevronUp, ChevronDown, RotateCcw, SlidersHorizontal, Eye, EyeOff, LayoutGrid } from 'lucide-react';

export function WidgetPickerModal({
  isOpen,
  onClose,
  layout,
  onSaveLayout,
  onResetLayout
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState('TOGGLE'); // 'TOGGLE' | 'REORDER'
  const [localLayout, setLocalLayout] = useState([]);

  // Sync local layout when modal opens
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(layout) && layout.length > 0) {
        // Map catalog widgets to layout order
        const layoutMap = new Map(layout.map((item, idx) => [item.id, { ...item, orderIndex: idx }]));

        const merged = WIDGET_CATALOG.map((catWidget) => {
          const existing = layoutMap.get(catWidget.id);
          return {
            id: catWidget.id,
            size: existing ? existing.size : (catWidget.defaultSize || 'W'),
            visible: existing ? (existing.visible !== false) : true
          };
        });

        // Preserve current layout order
        merged.sort((a, b) => {
          const idxA = layout.findIndex(l => l.id === a.id);
          const idxB = layout.findIndex(l => l.id === b.id);
          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
        });

        setLocalLayout(merged);
      } else {
        setLocalLayout(DEFAULT_WIDGET_LAYOUT);
      }
    }
  }, [isOpen, layout]);

  // Escape key listener to close modal on desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['ALL', 'CORE', 'FINANCE', 'PLANS', 'HABITS', 'LUNA', 'LIFE', 'UTILITY', 'SPLITS'];

  // Filter widgets by search and category
  const filteredCatalog = WIDGET_CATALOG.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || w.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Toggle Visibility for a widget
  const handleToggleVisibility = (widgetId) => {
    setLocalLayout(prev => prev.map(item => {
      if (item.id === widgetId) {
        return { ...item, visible: !item.visible };
      }
      return item;
    }));
  };

  // Move Widget Up in Order
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setLocalLayout(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move Widget Down in Order
  const handleMoveDown = (index) => {
    if (index >= localLayout.length - 1) return;
    setLocalLayout(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Save changes
  const handleSave = () => {
    onSaveLayout(localLayout);
    onClose();
  };

  // Reset Layout
  const handleReset = () => {
    onResetLayout();
    setLocalLayout(DEFAULT_WIDGET_LAYOUT);
    onClose();
  };

  const visibleCount = localLayout.filter(l => l.visible !== false).length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
        zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card animate-fade-in widget-picker-dialog"
        style={{
          width: '94vw', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          padding: '16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)', margin: 'auto', boxSizing: 'border-box', overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="var(--accent-primary)" /> Add Dashboard Widgets
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Added: <strong style={{ color: 'var(--accent-primary)' }}>{visibleCount}</strong> of 20 widgets
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
              cursor: 'pointer', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center'
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* View Switcher Tabs: Visibility Toggle vs Reorder */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('TOGGLE')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === 'TOGGLE' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'TOGGLE' ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTab === 'TOGGLE' ? '700' : '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s ease'
            }}
          >
            <Eye size={14} /> Toggle Visibility (20)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REORDER')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === 'REORDER' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'REORDER' ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTab === 'REORDER' ? '700' : '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={14} /> Reorder Layout
          </button>
        </div>

        {/* TAB 1: TOGGLE VISIBILITY */}
        {activeTab === 'TOGGLE' && (
          <>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search 20 widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '6px 10px 6px 30px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '12px'
                }}
              />
            </div>

            {/* Category Scroll Row */}
            <div className="scroll-row widget-category-chips-row" style={{
              display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', gap: '4px',
              marginBottom: '10px', paddingBottom: '4px'
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700',
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

            {/* Widgets List with ON/OFF Toggle Switches */}
            <div className="widget-picker-dialog-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
              {filteredCatalog.map(widget => {
                const layoutItem = localLayout.find(l => l.id === widget.id);
                const isVisible = layoutItem ? (layoutItem.visible !== false) : true;
                const IconComp = widget.icon;

                return (
                  <div
                    key={widget.id}
                    style={{
                      padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '10px', minHeight: '50px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'var(--accent-soft)', color: 'var(--accent-primary)',
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

                    {/* Visibility Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(widget.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: `1px solid ${isVisible ? 'var(--accent-success)' : 'var(--border-color)'}`,
                        background: isVisible ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                        color: isVisible ? 'var(--accent-success)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {isVisible ? 'ON' : 'OFF'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: REORDER LAYOUT */}
        {activeTab === 'REORDER' && (
          <div className="widget-picker-dialog-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Use ▲ and ▼ to reorder visible widgets on your Dashboard.
            </div>

            {localLayout.map((item, index) => {
              const widgetDef = WIDGET_CATALOG.find(w => w.id === item.id);
              if (!widgetDef) return null;
              const isVisible = item.visible !== false;
              const IconComp = widgetDef.icon;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '8px 12px', borderRadius: '10px', background: isVisible ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', opacity: isVisible ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '20px' }}>
                      #{index + 1}
                    </span>

                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'var(--accent-soft)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <IconComp size={14} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {widgetDef.title}
                      </div>
                    </div>
                  </div>

                  {/* Move Up / Move Down Controls */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', color: index === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: index === 0 ? 'default' : 'pointer'
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === localLayout.length - 1}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', color: index === localLayout.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: index === localLayout.length - 1 ? 'default' : 'pointer'
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer Actions: Reset vs Save */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} /> Reset Dashboard
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 16px', fontWeight: '700' }}
            >
              Save & Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
