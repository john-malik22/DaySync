import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { NotificationBell } from './NotificationBell';

export function PageHeaderRow({ title, onSearch, titleStyle }) {
  const { toggleSidebar } = useLuna();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="page-header-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: 0 }}>
        {/* Mobile-Only Hamburger Control (LEFT SIDE) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="mobile-hamburger-btn btn-secondary"
          title="Open Navigation"
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            minHeight: '36px',
            flexShrink: 0
          }}
        >
          <Menu size={18} />
        </button>

        <h1 style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...titleStyle }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Header Search Bar */}
        <div className="header-search-bar">
          <Search size={15} color="var(--accent-primary)" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Notification Bell Dropdown */}
        <NotificationBell />
      </div>
    </div>
  );
}
