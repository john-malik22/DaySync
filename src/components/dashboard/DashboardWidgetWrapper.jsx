import React, { useState, useRef } from 'react';
import { renderWidgetById } from './WidgetComponents';
import { WIDGET_CATALOG } from './widgetCatalog';
import { GripVertical, X, Maximize2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export function DashboardWidgetWrapper({
  widgetItem,
  isArrangeMode,
  onEnterArrangeMode,
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
    supportedSizes: ['small', 'wide'],
    defaultSize: 'wide'
  };

  const currentSize = widgetItem.size || catalogDef.defaultSize || 'wide';

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
    small: 'widget-size-small',
    wide: 'widget-size-wide',
    tall: 'widget-size-tall',
    large: 'widget-size-large'
  };

  return (
    <div
      className={`glass-card dashboard-widget-card ${sizeClassMap[currentSize] || 'widget-size-wide'} ${isArrangeMode ? 'widget-arrange-active' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
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
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'rgba(108, 99, 255, 0.2)', borderTopLeftRadius: 'var(--radius-sm)',
          borderTopRightRadius: 'var(--radius-sm)', overflow: 'hidden', zIndex: 10
        }}>
          <div style={{
            height: '100%', width: `${holdingProgress}%`, background: 'var(--accent-primary)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      )}

      {/* Arrange Mode Toolbar Overlay inside widget */}
      {isArrangeMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '6px 8px'
        }}>
          {/* Drag Handle & Move Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ cursor: 'grab', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }} title="Drag to reorder">
              <GripVertical size={16} />
            </span>

            {/* Reorder directional buttons for accessibility / mobile */}
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
            {catalogDef.supportedSizes.map(sz => (
              <button
                key={sz}
                type="button"
                onClick={() => onChangeWidgetSize(widgetItem.id, sz)}
                title={`Set size: ${sz}`}
                style={{
                  fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                  border: currentSize === sz ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: currentSize === sz ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: currentSize === sz ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer', textTransform: 'uppercase'
                }}
              >
                {sz[0]}
              </button>
            ))}
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

      {/* Widget Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {renderWidgetById(widgetItem.id)}
      </div>
    </div>
  );
}
