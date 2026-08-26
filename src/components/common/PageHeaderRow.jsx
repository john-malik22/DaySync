import React from 'react';
import { Menu } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { NotificationBell } from './NotificationBell';

export function PageHeaderRow({ title, titleStyle }) {
  const { toggleSidebar } = useLuna();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 'var(--space-md)' }}>
      <div className="page-header-row">
        {/* Left Side: Mobile Hamburger & Page Title */}
        <div className="page-header-left">
          <button
            type="button"
            onClick={toggleSidebar}
            className="mobile-hamburger-btn btn-secondary"
            title="Open Navigation"
            aria-label="Open Navigation"
          >
            <Menu size={18} />
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
