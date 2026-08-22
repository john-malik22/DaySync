import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  CheckSquare, 
  Activity, 
  CreditCard, 
  Sparkles, 
  Info, 
  RefreshCw, 
  AlertCircle,
  X,
  Target
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 172800) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCategoryIcon(type) {
  switch (type) {
    case 'TASK': return <CheckSquare size={16} color="var(--color-primary)" />;
    case 'HABIT': return <Activity size={16} color="var(--color-aqua)" />;
    case 'GOAL': return <Target size={16} color="var(--color-purple)" />;
    case 'EXPENSE':
    case 'BUDGET': return <CreditCard size={16} color="var(--color-pink)" />;
    case 'LUNA': return <Sparkles size={16} color="var(--color-secondary)" />;
    case 'UPDATE': return <RefreshCw size={16} color="var(--color-amber)" />;
    default: return <Info size={16} color="var(--text-secondary)" />;
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    newArrival, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearNotifications,
    refreshNotifications 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayNotifications = notifications.filter(n => n.createdAt && n.createdAt.startsWith(todayStr));
  const olderNotifications = notifications.filter(n => !n.createdAt || !n.createdAt.startsWith(todayStr));

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Header Notification Bell Control */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications, ${unreadCount} unread`}
        title={`Notifications (${unreadCount} unread)`}
        style={{
          position: 'relative',
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <Bell size={18} className={newArrival ? 'animate-bounce' : ''} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'var(--color-pink)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '99px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 107, 157, 0.4)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Liquid-Glass Notification Dropdown Panel */}
      {isOpen && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '520px',
            padding: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--bg-card)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--border-highlight)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Panel Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: '600' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCheck size={14} /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  title="Clear all notifications"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panel Scroll Content */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '2px' }}>
            {error ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--accent-danger)' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>{error}</p>
                <button type="button" onClick={refreshNotifications} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Retry
                </button>
              </div>
            ) : loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <Bell size={20} color="var(--color-primary)" />
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>You're all caught up</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>New notifications will appear here when something needs your attention.</p>
              </div>
            ) : (
              <>
                {/* Today Group */}
                {todayNotifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>Today</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {todayNotifications.map(notif => (
                        <NotificationItem 
                          key={notif.id} 
                          notif={notif} 
                          onClick={() => handleNotificationClick(notif)} 
                          onMarkRead={(e) => { e.stopPropagation(); markAsRead(notif.id); }} 
                          onDelete={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Older Group */}
                {olderNotifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>Older</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {olderNotifications.map(notif => (
                        <NotificationItem 
                          key={notif.id} 
                          notif={notif} 
                          onClick={() => handleNotificationClick(notif)} 
                          onMarkRead={(e) => { e.stopPropagation(); markAsRead(notif.id); }} 
                          onDelete={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notif, onClick, onMarkRead, onDelete }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: notif.read ? 'transparent' : 'var(--color-primary-soft)',
        border: '1px solid',
        borderColor: notif.read ? 'var(--border-subtle)' : 'var(--border-color)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        position: 'relative',
        transition: 'transform 0.18s ease, background 0.18s ease'
      }}
    >
      <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {getCategoryIcon(notif.type)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: notif.read ? '500' : '700', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {notif.title}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatRelativeTime(notif.createdAt)}
          </span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notif.message}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.8, flexShrink: 0 }}>
        {!notif.read && (
          <button
            type="button"
            onClick={onMarkRead}
            title="Mark as read"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px' }}
          >
            <Check size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
