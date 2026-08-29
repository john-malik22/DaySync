import React from 'react';
import { renderWidgetById } from './WidgetComponents';
import { WIDGET_CATALOG } from './widgetCatalog';

export function DashboardWidgetWrapper({
  widgetItem,
  overrideSize,
  isArrangeMode,
  onRemoveWidget,
  onChangeWidgetSize,
  onMoveWidget,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const catalogDef = WIDGET_CATALOG.find(w => w.id === widgetItem.id) || {
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'W'
  };

  const rawSize = overrideSize || widgetItem.size || catalogDef.defaultSize || 'W';

  const sizeClassMap = {
    S: 'widget-size-S',
    W: 'widget-size-W',
    T: 'widget-size-T',
    L: 'widget-size-L',
    small: 'widget-size-S',
    wide: 'widget-size-W',
    tall: 'widget-size-T',
    large: 'widget-size-L'
  };

  const normalizedSize = ['S', 'W', 'T', 'L'].includes(rawSize)
    ? rawSize
    : (rawSize === 'small' ? 'S' : rawSize === 'tall' ? 'T' : rawSize === 'large' ? 'L' : 'W');

  return (
    <div
      className={`glass-card dashboard-widget-card ${sizeClassMap[normalizedSize] || 'widget-size-W'}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--glass-shadow)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      {/* Widget Content Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', padding: '12px' }}>
        {renderWidgetById(widgetItem.id, normalizedSize)}
      </div>
    </div>
  );
}

