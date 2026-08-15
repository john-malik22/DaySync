import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { HabitTracker } from '../../components/routine/HabitTracker';

export function HabitsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="page-container">
      {/* Top Page Header Row */}
      <PageHeaderRow title="Habits" onSearch={setSearch} />

      {/* Standalone Habit Tracker Component */}
      <HabitTracker searchFilter={search} />
    </div>
  );
}
