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

        {/* Right Side: Search Input + Notification Control */}
        <div className="page-header-right">
          {/* Mobile-Only Search Icon Button */}
          <button
            type="button"
            onClick={() => {
              if (window.__daysync_openCommandPalette) window.__daysync_openCommandPalette();
              else toggleMobileSearch();
            }}
            className="mobile-search-icon-btn btn-secondary"
            title="Global Search (Ctrl + K)"
            aria-label="Search"
          >
            <Search size={16} color="var(--accent-primary)" />
          </button>

          {/* Desktop Search Bar (Positioned beside notification bell) */}
          <div
            className="header-search-bar"
            onClick={() => {
              if (window.__daysync_openCommandPalette) window.__daysync_openCommandPalette();
            }}
            style={{ cursor: 'pointer' }}
          >
            <Search size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search or Ctrl + K..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (window.__daysync_openCommandPalette) window.__daysync_openCommandPalette();
              }}
              aria-label="Search input"
            />
          </div>

          {/* Notification Bell Dropdown */}
          <div className="header-notification-container">
            <NotificationBell />
          </div>
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
            aria-label="Mobile search input"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
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
