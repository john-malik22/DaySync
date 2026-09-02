import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './CartoonAvatars';

export function PageHeaderRow({ title, titleStyle }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const avatarId = user?.avatar || localStorage.getItem('daysync_user_avatar');
  const userName = user?.name || user?.email || 'User';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 'var(--space-md)' }}>
      <div className="page-header-row">
        {/* Left Side: Mobile Luna Chat Button & Page Title */}
        <div className="page-header-left">
          <button
            type="button"
            onClick={() => navigate('/app/chat')}
            className="mobile-luna-chat-btn btn-secondary"
            title="Open Luna Chat"
            aria-label="Open Luna Chat"
          >
            <Sparkles size={18} color="var(--accent-primary)" />
          </button>

          <h1 className="page-header-title" style={titleStyle}>
            {title}
          </h1>
        </div>

        {/* Right Side: Notification Control & Mobile Avatar */}
        <div className="page-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="header-notification-container">
            <NotificationBell />
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/settings')}
            className="mobile-header-account-avatar-btn"
            title="Account & Profile Settings"
            aria-label="Account Profile Settings"
            style={{
              background: 'transparent', border: 'none', padding: 0,
              cursor: 'pointer', display: 'none', flexShrink: 0
            }}
          >
            <UserAvatar avatarId={avatarId} name={userName} size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
