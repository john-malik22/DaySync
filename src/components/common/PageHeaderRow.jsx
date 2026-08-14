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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleSidebar}
          className="btn-secondary"
          title="Open Sidebar"
          style={{
            padding: '6px 10px',
            minHeight: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'var(--mobile-menu-display, inline-flex)'
          }}
        >
          <Menu size={18} />
        </button>

        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      <div className="header-search-bar">
        <Search size={15} color="var(--accent-primary)" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
}
