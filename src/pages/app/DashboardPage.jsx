import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { DashboardGrid } from '../../components/dashboard/DashboardGrid';

export function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <div className="page-container">
      {/* Top Header Row — greeting & search */}
      <PageHeaderRow
        title={`Hello, ${firstName}`}
        onSearch={setSearch}
        titleStyle={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}
      />

      {/* Customizable Dashboard Grid System */}
      <DashboardGrid />
    </div>
  );
}
