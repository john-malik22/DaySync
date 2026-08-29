import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { WidgetPickerModal } from './WidgetPickerModal';
import { DEFAULT_WIDGET_LAYOUT, WIDGET_CATALOG, SHOW_DASHBOARD_WIDGETS } from './widgetCatalog';
import { Plus, Check, RotateCcw, Sliders } from 'lucide-react';

// Temporary Isolated Developer Size Switcher (Removed completely when per-widget edit mode is built)
export function DevWidgetSizeSwitcher({ devSize, setDevSize }) {
  return (
    <div className="dev-size-switcher glass-card" style={{
      padding: '6px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', background: 'var(--bg-card)'
    }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Widget Size (Dev Switch):
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { sz: 'S', label: 'Small' },
          { sz: 'W', label: 'Wide' },
          { sz: 'T', label: 'Tall' },
          { sz: 'L', label: 'Large' }
        ].map(({ sz, label }) => (
          <button
            key={sz}
            type="button"
            onClick={() => setDevSize(sz)}
            aria-label={`Set global development size to ${label}`}
            style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '4px',
              border: devSize === sz ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: devSize === sz ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: devSize === sz ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {sz}{devSize === sz ? '●' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardGrid() {
  if (!SHOW_DASHBOARD_WIDGETS) {
    return null;
  }

  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id || 'guest';
  const storageKey = `daysync_dashboard_layout_${userId}`;

  // Temporary global development size state (defaults to 'W')
  const [devWidgetSize, setDevWidgetSize] = useState('W');
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);

  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_WIDGET_LAYOUT;
  });

  // Re-sync layout when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed);
          return;
        }
      }
    } catch (e) {}
    setLayout(DEFAULT_WIDGET_LAYOUT);
  }, [storageKey]);

  // Save layout helper
  const saveLayoutToStorage = (newLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    } catch (e) {}
  };

  const handleDone = () => {
    setIsArrangeMode(false);
    saveLayoutToStorage(layout);
    if (showToast) showToast('Dashboard layout saved.', 'success');
  };

  const handleConfirmReset = () => {
    setShowResetModal(false);
    saveLayoutToStorage(DEFAULT_WIDGET_LAYOUT);
    if (showToast) showToast('Dashboard layout reset to default.', 'info');
  };

  // Size change handler
  const handleChangeWidgetSize = (widgetId, newSize) => {
    const updated = layout.map(w => w.id === widgetId ? { ...w, size: newSize } : w);
    saveLayoutToStorage(updated);
  };

  // Remove / Hide widget
  const handleRemoveWidget = (widgetId) => {
    const updated = layout.filter(w => w.id !== widgetId);
    saveLayoutToStorage(updated);
    if (showToast) showToast('Widget hidden from Dashboard.', 'info');
  };

  // Add widget
  const handleAddWidget = (widgetDef) => {
    const exists = layout.some(w => w.id === widgetDef.id);
    if (exists) return;

    const newLayout = [
      ...layout,
      { id: widgetDef.id, size: widgetDef.defaultSize || 'W', visible: true }
    ];
    saveLayoutToStorage(newLayout);
    if (showToast) showToast(`Added ${widgetDef.title} to Dashboard.`, 'success');
  };

  // Move / Reorder widget linearly
  const handleMoveWidget = (widgetId, direction) => {
    const idx = layout.findIndex(w => w.id === widgetId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= layout.length) return;

    const updated = [...layout];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    saveLayoutToStorage(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, widgetId) => {
    setDraggedWidgetId(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidgetId) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetWidgetId) return;

    const fromIdx = layout.findIndex(w => w.id === draggedWidgetId);
    const toIdx = layout.findIndex(w => w.id === targetWidgetId);

    if (fromIdx === -1 || toIdx === -1) return;

    const updated = [...layout];
    const [movedItem] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, movedItem);

    setDraggedWidgetId(null);
    saveLayoutToStorage(updated);
  };

  const activeWidgetIds = layout.map(w => w.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Temporary Isolated Global Developer Size Switcher */}
      <DevWidgetSizeSwitcher devSize={devWidgetSize} setDevSize={setDevWidgetSize} />

      {/* Arrange Mode Toolbar */}
      {isArrangeMode && (
        <div className="glass-card animate-fade-in" style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Arrange Dashboard
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Drag or reorder widgets, resize cards, or add new widgets to customize your home screen.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} /> Add Widget
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <RotateCcw size={14} /> Reset
            </button>

            <button
              type="button"
              onClick={handleDone}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--accent-success)', border: 'none' }}
            >
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      )}

      {/* Grid of Widgets */}
      <div className={activeGridClass}>
        {layout.map((item, index) => (
          <DashboardWidgetWrapper
            key={item.id}
            widgetItem={item}
            overrideSize={devWidgetSize}
            isArrangeMode={isArrangeMode}
            onEnterArrangeMode={() => setIsArrangeMode(true)}
            onRemoveWidget={handleRemoveWidget}
            onChangeWidgetSize={handleChangeWidgetSize}
            onMoveWidget={handleMoveWidget}
            isFirst={index === 0}
            isLast={index === layout.length - 1}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Picker Modal */}
      <WidgetPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset your Dashboard layout?"
        message="This will restore the default DaySync Dashboard layout. Your tasks, expenses, and data will not be affected."
        confirmText="Reset Layout"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}
