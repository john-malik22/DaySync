import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { MemoryCenter } from '../../components/memory/MemoryCenter';

export function MemoriesPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="page-container">
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title="Memory Center" onSearch={setSearch} />

      <MemoryCenter searchFilter={search} />
    </div>
  );
}
