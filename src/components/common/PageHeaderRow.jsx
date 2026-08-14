import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function PageHeaderRow({ title, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="page-header-row">
      <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h1>

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
