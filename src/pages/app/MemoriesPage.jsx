import React from 'react';
import { MemoryCenter } from '../../components/memory/MemoryCenter';

export function MemoriesPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Memory Center</h1>
        <p>
          Inspect, edit, or delete any fact saved by Luna AI. Nothing is saved without your consent.
        </p>
      </div>

      <MemoryCenter />
    </div>
  );
}
