import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { HabitTracker } from '../../components/routine/HabitTracker';

export function PlannerPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="page-container">
      {/* Top Page Header Row */}
      <PageHeaderRow title="Health & Habit Tracker" onSearch={setSearch} />

      {/* Compact Habit & Health Tracker */}
      <HabitTracker />
    </div>
  );
}
