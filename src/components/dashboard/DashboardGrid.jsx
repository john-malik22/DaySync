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
  const [devWidgetSize, setDevWidgetSize] = useState('W');
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

  const fullLayout = React.useMemo(() => {
    const catalogMap = new Map(WIDGET_CATALOG.map(w => [w.id, w]));
    
    // Map user's saved layout items to include catalog definitions & devWidgetSize
    const userItems = (layout || []).map(item => {
      const catalogItem = catalogMap.get(item.id);
      return {
        ...catalogItem,
        ...item,
        size: devWidgetSize,
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
          size: devWidgetSize,
          visible: true
        });
      }
    });

    // Filter ONLY visible widgets for the active Dashboard view
    return userItems.filter(item => item.visible !== false);
  }, [layout, devWidgetSize]);

  return (
    <div className="dashboard-grid-container">
      {/* Top Controls Bar: Manage Widgets & Widget Size Switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', marginBottom: '18px'
      }}>
        {/* Manage Widgets Button */}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="btn-primary"
          style={{
            fontSize: '12.5px', padding: '8px 16px', display: 'inline-flex',
            alignItems: 'center', gap: '6px', fontWeight: '700', borderRadius: 'var(--radius-md)'
          }}
        >
          <Sliders size={15} /> Manage Widgets ({fullLayout.length}/20)
        </button>

        {/* Global Development Size Switcher */}
        <div
          className="dev-widget-size-switcher"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 12px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Widget Size
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {['S', 'W', 'T', 'L'].map(sz => (
              <button
                key={sz}
                type="button"
                onClick={() => setDevWidgetSize(sz)}
                aria-label={`Set all widgets to ${sz} size`}
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: devWidgetSize === sz ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: devWidgetSize === sz ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: devWidgetSize === sz ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {sz}{devWidgetSize === sz ? '●' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Visible Widgets */}
      {fullLayout.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', margin: '20px 0' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            All Dashboard widgets are currently hidden
          </h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Click Manage Widgets to enable the widgets you'd like to see.
          </p>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="btn-primary"
            style={{ fontSize: '13px', padding: '8px 18px' }}
          >
            <Sliders size={14} /> Manage Widgets
          </button>
        </div>
      ) : (
        <div className={`dashboard-widget-grid grid-mode-${devWidgetSize}`}>
          {fullLayout.map((item, index) => (
            <DashboardWidgetWrapper
              key={item.id}
              widgetItem={{ ...item, size: devWidgetSize }}
              isArrangeMode={isArrangeMode}
              isEditActive={false}
              onEnterArrangeMode={() => {}}
              onCloseEdit={() => {}}
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

      {/* Manage Widgets Modal */}
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
