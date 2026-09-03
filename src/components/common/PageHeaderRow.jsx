import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function PageHeaderRow({ title, titleStyle }) {
  const navigate = useNavigate();

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

        {/* Right Side: Notification Control */}
        <div className="page-header-right">
          <div className="header-notification-container">
            <NotificationBell />
          </div>
        </div>
      </div>
    </div>
  );
}
