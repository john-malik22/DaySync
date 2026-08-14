import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutDashboard, 
  CreditCard, 
  Brain, 
  CheckSquare,
  Settings, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar } = useLuna();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation Items per wireframe specification
  const navItems = [
    { label: 'Chat (AI)', icon: MessageSquare, path: '/app/chat' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Expenses', icon: CreditCard, path: '/app/expenses' },
    { label: 'Memory', icon: Brain, path: '/app/memories' },
    { label: 'Task', icon: CheckSquare, path: '/app/dashboard' }
  ];

  const handleNavClick = () => {
    closeSidebar();
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Main Sidebar Element */}
      <aside className={`sidebar-container ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
        {/* Brand & Collapse Header */}
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1C2528',
              fontWeight: '800',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div className="sidebar-text">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>DaySync</h2>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="btn-secondary"
            title="Toggle Sidebar"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)'
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={handleNavClick}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <span className="sidebar-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer & Settings */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--accent-secondary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0
            }}>
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="sidebar-user-details" style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', truncate: true }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user?.email || 'user@daysync.ai'}
              </div>
            </div>
          </div>

          {/* Settings Nav Item */}
          <NavLink
            to="/app/settings"
            onClick={handleNavClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: location.pathname === '/app/settings' ? '#FFFFFF' : 'var(--text-secondary)',
              background: location.pathname === '/app/settings' ? 'var(--bg-card)' : 'transparent',
              border: location.pathname === '/app/settings' ? '1px solid var(--accent-primary)' : '1px solid transparent',
              fontWeight: location.pathname === '/app/settings' ? '700' : '500',
              fontSize: '0.9rem'
            }}
          >
            <Settings size={18} color={location.pathname === '/app/settings' ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
