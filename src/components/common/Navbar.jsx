import React from 'react';
import { Sun, Moon, Menu, Search, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';

export function Navbar() {
  const { theme, toggleTheme } = useAuth();
  const { toggleSidebar } = useLuna();

  return (
    <header className="navbar-container">
      {/* Single Sidebar Toggle Button & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleSidebar}
          className="btn-secondary"
          title="Toggle Sidemenu (Show / Hide)"
          style={{ padding: '8px 10px', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-success)',
            boxShadow: '0 0 10px var(--accent-success)',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            DaySync Engine • Active
          </span>
        </div>
      </div>

      {/* Center Search / Command Shortcut Trigger */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        color: 'var(--text-muted)',
        fontSize: '13px',
        cursor: 'pointer'
      }} className="hidden md:flex">
        <Search size={14} color="var(--text-muted)" />
        <span>Quick Command Search...</span>
        <span style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '1px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          marginLeft: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <Command size={10} /> K
        </span>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Prominent Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            minHeight: '38px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-primary)',
            fontWeight: '600'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} color="var(--accent-warning)" />
              <span style={{ display: 'var(--mobile-hide, inline)' }}>Light</span>
            </>
          ) : (
            <>
              <Moon size={16} color="var(--accent-primary)" />
              <span style={{ display: 'var(--mobile-hide, inline)' }}>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
