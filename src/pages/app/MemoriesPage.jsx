import React from 'react';
import { MemoryCenter } from '../../components/memory/MemoryCenter';

export function MemoriesPage() {
  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Memory Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Inspect, edit, or delete any fact saved by Luna. Nothing is saved without your consent.
        </p>
      </div>

      <MemoryCenter />
    </div>
  );
}
