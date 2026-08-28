import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { TaskManager } from '../../components/planner/TaskManager';

export function TaskPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="page-container">
      {/* Top Header Row: Page Title TASK */}
      <PageHeaderRow title="TASK" onSearch={setSearch} />

      {/* Standalone Task Manager */}
      <TaskManager searchFilter={search} />
    </div>
  );
}
