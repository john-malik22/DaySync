import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function PageHeaderRow({ title, onSearch }) {
  const { toggleSidebar } = useLuna();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="page-header-row">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
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

          {/* Mobile-Only Hamburger Control (Opens Narrow Icon Rail) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="mobile-hamburger-btn btn-secondary"
            title="Open Mobile Navigation Rail"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              minHeight: '38px'
            }}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
