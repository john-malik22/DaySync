import React, { useState, useRef } from 'react';
import { renderWidgetById } from './WidgetComponents';
import { WIDGET_CATALOG, ACTIVE_WIDGET_SIZE } from './widgetCatalog';
import { GripVertical, X, Maximize2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export function DashboardWidgetWrapper({
  widgetItem,
  isArrangeMode,
  isEditActive,
  onEnterArrangeMode,
  onCloseEdit,
  onRemoveWidget,
  onChangeWidgetSize,
  onMoveWidget,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const [holdingProgress, setHoldingProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const catalogDef = WIDGET_CATALOG.find(w => w.id === widgetItem.id) || {
    supportedSizes: ['S', 'W', 'T', 'L'],
    defaultSize: 'S'
  };

  const currentSize = ACTIVE_WIDGET_SIZE || widgetItem.size || catalogDef.defaultSize || 'S';

  // Long-press handler (3.5 seconds)
  const handleTouchOrMouseDown = (e) => {
    if (isArrangeMode) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };

    let startTime = Date.now();
    setHoldingProgress(10);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / 3500) * 100));
      setHoldingProgress(pct);
    }, 100);

    timerRef.current = setTimeout(() => {
      clearHoldingState();
      onEnterArrangeMode();
    }, 3500);
  };

  const handleTouchOrMouseMove = (e) => {
    if (!timerRef.current && !progressIntervalRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);

    if (deltaX > 12 || deltaY > 12) {
      clearHoldingState();
    }
  };

  const clearHoldingState = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    timerRef.current = null;
    progressIntervalRef.current = null;
    setHoldingProgress(0);
  };

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

  const normalizedSize = ['S', 'W', 'T', 'L'].includes(currentSize)
    ? currentSize
    : (currentSize === 'small' ? 'S' : currentSize === 'tall' ? 'T' : currentSize === 'large' ? 'L' : 'W');

  return (
    <div
      className={`glass-card dashboard-widget-card ${sizeClassMap[normalizedSize] || 'widget-size-W'} ${isArrangeMode ? 'widget-arrange-active' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: isArrangeMode ? 'transform 0.18s ease, box-shadow 0.18s ease' : 'none',
        border: isArrangeMode ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
        boxShadow: isArrangeMode ? '0 8px 24px rgba(108, 99, 255, 0.18)' : 'var(--glass-shadow)',
        transform: isArrangeMode ? 'scale(0.99)' : 'none',
        userSelect: isArrangeMode ? 'none' : 'auto'
      }}
      draggable={isArrangeMode}
      onDragStart={(e) => isArrangeMode && onDragStart(e, widgetItem.id)}
      onDragOver={(e) => isArrangeMode && onDragOver(e)}
      onDrop={(e) => isArrangeMode && onDrop(e, widgetItem.id)}
      onMouseDown={handleTouchOrMouseDown}
      onMouseMove={handleTouchOrMouseMove}
      onMouseUp={clearHoldingState}
      onMouseLeave={clearHoldingState}
      onTouchStart={handleTouchOrMouseDown}
      onTouchMove={handleTouchOrMouseMove}
      onTouchEnd={clearHoldingState}
      onTouchCancel={clearHoldingState}
    >
      {/* Long-Press Progress Bar Indicator */}
      {holdingProgress > 0 && !isArrangeMode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '3px',
          width: `${holdingProgress}%`, background: 'var(--accent-primary)',
          transition: 'width 0.1s linear', zIndex: 10
        }} />
      )}

      {/* Arrange Overlay Actions */}
      {isArrangeMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed var(--border-color)'
        }}>
          {/* Movement Arrow Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!isFirst && (
              <button
                type="button"
                onClick={() => onMoveWidget(widgetItem.id, 'up')}
                title="Move up / left"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px' }}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => onMoveWidget(widgetItem.id, 'down')}
                title="Move down / right"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px' }}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Size Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(catalogDef.supportedSizes || ['S', 'W', 'T', 'L']).map(sz => {
              const szMap = { S: 'S (2×2)', W: 'W (2×4)', T: 'T (4×2)', L: 'L (4×4)' };
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChangeWidgetSize(widgetItem.id, sz)}
                  title={`Set size: ${szMap[sz] || sz}`}
                  aria-label={`Set size ${szMap[sz] || sz}`}
                  style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                    border: normalizedSize === sz ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: normalizedSize === sz ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: normalizedSize === sz ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer', textTransform: 'uppercase'
                  }}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          {/* Remove / Hide Control */}
          <button
            type="button"
            onClick={() => onRemoveWidget(widgetItem.id)}
            title="Remove widget from dashboard"
            style={{
              background: 'rgba(239, 68, 68, 0.12)', border: 'none', color: 'var(--accent-danger)',
              borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Widget Content Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
        {renderWidgetById(widgetItem.id, normalizedSize)}
      </div>
    </div>
  );
}
