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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: 'var(--accent-primary)', color: '#FFFFFF',
          borderRadius: 'var(--radius-md)', marginBottom: '16px', boxShadow: 'var(--glass-shadow)',
          position: 'sticky', top: '10px', zIndex: 30
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>
            Dashboard Edit Mode — Press & drag to reorder, use S/W/T/L to resize
          </span>
          <button
            type="button"
            onClick={handleDone}
            style={{
              background: '#FFFFFF', color: 'var(--accent-primary)', border: 'none',
              padding: '6px 16px', fontSize: '12.5px', fontWeight: '800', borderRadius: 'var(--radius-sm, 6px)',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Check size={14} /> Done
          </button>
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
    </div>
  );
}
