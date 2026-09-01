import React from 'react';

/**
 * Reusable Minimalist 2D Empty State Component
 * Provides clean, consistent, compact empty states across DaySync pages.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  compact = false,
  style = {}
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: compact ? '20px 14px' : '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))',
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px dashed var(--border-color)',
        margin: '8px 0',
        ...style
      }}
    >
      {Icon && (
        <div
          style={{
            width: compact ? '36px' : '44px',
            height: compact ? '36px' : '44px',
            borderRadius: '50%',
            background: 'var(--accent-soft, rgba(91, 80, 230, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            marginBottom: '2px',
            flexShrink: 0
          }}
        >
          <Icon size={compact ? 18 : 22} />
        </div>
      )}

      <div style={{ fontWeight: '700', fontSize: compact ? '13px' : '14px', color: 'var(--text-primary)' }}>
        {title}
      </div>

      {description && (
        <div style={{ fontSize: compact ? '11.5px' : '12px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.4' }}>
          {description}
        </div>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary"
          style={{
            marginTop: '6px',
            fontSize: '12px',
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {ActionIcon && <ActionIcon size={14} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
