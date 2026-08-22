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
      {/* Mobile-Only Hamburger Control (LEFT SIDE) */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="mobile-hamburger-btn btn-secondary"
        title="Open Navigation"
      >
        <Menu size={18} />
      </button>

      {/* Page Title */}
      <h1 className="page-header-title" style={titleStyle}>
        {title}
      </h1>

      {/* Header Search Bar */}
      <div className="header-search-bar">
        <Search size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Notification Bell Dropdown */}
      <div className="header-notification-container">
        <NotificationBell />
      </div>
    </div>
  );
}
