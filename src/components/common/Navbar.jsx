import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';

export function Navbar() {
  const { theme, toggleTheme } = useAuth();
  const { toggleSidebar } = useLuna();

  return (
    <header className="navbar-container" style={{
      height: '64px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Single Sidebar Toggle Button & AI Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleSidebar}
          className="btn-secondary"
          title="Toggle Sidemenu (Show / Hide)"
          style={{ padding: '8px', borderRadius: '10px' }}
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
          <span style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            DaySync Engine • Luna AI Active
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          title="Toggle Dark/Light Theme"
          style={{ padding: '8px', borderRadius: '50%' }}
        >
          {theme === 'dark' ? <Sun size={18} color="var(--accent-warning)" /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
