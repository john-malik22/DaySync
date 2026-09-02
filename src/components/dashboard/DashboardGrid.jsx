import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { WidgetPickerModal } from './WidgetPickerModal';
import { DEFAULT_WIDGET_LAYOUT, WIDGET_CATALOG, SHOW_DASHBOARD_WIDGETS } from './widgetCatalog';
import { Plus, Check, RotateCcw, Sliders } from 'lucide-react';

export function DashboardGrid() {
  if (!SHOW_DASHBOARD_WIDGETS) {
    return null;
  }

  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id || 'guest';
  const storageKey = `daysync_dashboard_layout_${userId}`;

  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

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

  // Size change handler for individual widget
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
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
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

  const fullLayout = React.useMemo(() => {
    const catalogMap = new Map(WIDGET_CATALOG.map(w => [w.id, w]));
    
    // Map user's saved layout items to include catalog definitions & per-widget size
    const userItems = (layout || []).map(item => {
      const catalogItem = catalogMap.get(item.id);
      return {
        ...catalogItem,
        ...item,
        size: item.size || catalogItem?.defaultSize || 'W',
        visible: item.visible !== false
      };
    }).filter(item => item.id && catalogMap.has(item.id));

    // Also include any catalog widgets missing from user layout (appended at end)
    const existingIds = new Set(userItems.map(i => i.id));
    WIDGET_CATALOG.forEach(catalogItem => {
      if (!existingIds.has(catalogItem.id)) {
        userItems.push({
          ...catalogItem,
          id: catalogItem.id,
          size: catalogItem.defaultSize || 'W',
          visible: true
        });
      }
    });

    return userItems.filter(item => item.visible !== false);
  }, [layout]);

  return (
    <div className="dashboard-grid-container" style={{ position: 'relative' }}>
      {/* Top Banner when in Edit Mode */}
      {isArrangeMode && (
        <div className="dashboard-edit-actions-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '8px', padding: '10px 14px', background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          marginBottom: '16px', boxShadow: 'var(--glass-shadow)', position: 'sticky', top: '10px', zIndex: 50
        }}>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="btn-primary"
            style={{
              fontSize: '12px', padding: '6px 14px', display: 'inline-flex',
              alignItems: 'center', gap: '5px', fontWeight: '700', borderRadius: 'var(--radius-sm, 6px)'
            }}
          >
            <Plus size={14} /> Add Widget
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              style={{
                fontSize: '12px', padding: '6px 14px', display: 'inline-flex',
                alignItems: 'center', gap: '5px', fontWeight: '600', borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>

            <button
              type="button"
              onClick={handleDone}
              style={{
                fontSize: '12px', padding: '6px 16px', display: 'inline-flex',
                alignItems: 'center', gap: '5px', fontWeight: '800', borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--accent-primary)', color: '#FFFFFF', border: 'none',
                cursor: 'pointer'
              }}
            >
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      )}

      {/* Grid of Visible Widgets */}
      {fullLayout.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', margin: '20px 0' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            No Dashboard widgets available
          </h4>
        </div>
      ) : (
        <div className="dashboard-widget-grid">
          {fullLayout.map((item, index) => (
            <DashboardWidgetWrapper
              key={item.id}
              widgetItem={item}
              isArrangeMode={isArrangeMode}
              onEnterArrangeMode={() => setIsArrangeMode(true)}
              onRemoveWidget={handleRemoveWidget}
              onChangeWidgetSize={handleChangeWidgetSize}
              onMoveWidget={handleMoveWidget}
              isFirst={index === 0}
              isLast={index === fullLayout.length - 1}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* Widget Picker Modal */}
      <WidgetPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        layout={layout}
        onSaveLayout={(newLayout) => saveLayoutToStorage(newLayout)}
        onResetLayout={() => saveLayoutToStorage(DEFAULT_WIDGET_LAYOUT)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset your Dashboard layout?"
        message="This will restore the default DaySync Dashboard layout positions and sizes."
        confirmText="Reset Layout"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}
