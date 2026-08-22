import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { NotificationBell } from './NotificationBell';

export function PageHeaderRow({ title, onSearch, titleStyle }) {
  const { toggleSidebar } = useLuna();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(prev => !prev);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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

        {/* Page Title (Desktop/Tablet visible, Mobile hidden for icon-only header) */}
        <h1 className="page-header-title" style={titleStyle}>
          {title}
        </h1>

        {/* Mobile-Only Search Icon Button */}
        <button
          type="button"
          onClick={toggleMobileSearch}
          className="mobile-search-icon-btn btn-secondary"
          title="Search"
          aria-label="Search"
        >
          <Search size={16} color="var(--accent-primary)" />
        </button>

        {/* Header Search Bar (Desktop/Tablet visible) */}
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

      {/* Expanded Mobile Search Field */}
      {isMobileSearchOpen && (
        <div className="mobile-expanded-search-bar animate-fade-in">
          <Search size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search ${title || ''}...`}
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Clear search"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
