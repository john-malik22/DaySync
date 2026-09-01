import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutDashboard, 
  CreditCard, 
  Brain, 
  CheckSquare,
  Activity,
  Repeat,
  Users,
  Bell,
  BarChart2,
  Settings, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';
import { UserAvatar } from './CartoonAvatars';

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar } = useLuna();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation Items for 2.0.0
  const navItems = [
    { label: 'Chat (AI)', icon: MessageSquare, path: '/app/chat' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Tasks', icon: CheckSquare, path: '/app/task' },
    { label: 'Expenses', icon: CreditCard, path: '/app/expenses' },
    { label: 'Plans', icon: Repeat, path: '/app/plans' },
    { label: 'Splits', icon: Users, path: '/app/splits' }
  ];

  const handleNavClick = () => {
    closeSidebar();
  };

  // Get user's first name & initial
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const initial = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Main Sidebar Element (Desktop: Expanded 250px / Collapsed 72px; Mobile Rail: 68px) */}
      <aside className={`sidebar-container ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
        {/* Brand & Header Logo Icon + Collapse Toggle */}
        <div 
          className="sidebar-header" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
            paddingBottom: '16px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
            marginBottom: '16px',
            width: '100%'
          }}
        >
          {/* Logo & Brand */}
          <div className="sidebar-logo-block" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/icons/icon-192.png"
              alt="DaySync Logo"
              className="daysync-sidebar-logo"
            />
            {!sidebarCollapsed && (
              <div className="sidebar-text">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--sidebar-text)', margin: 0, padding: 0 }}>DaySync</h2>
              </div>
            )}
          </div>

          {/* Desktop Hamburger Toggle Control (ALWAYS visible to toggle between Expanded and Collapsed) */}
          <button
            onClick={toggleSidebar}
            className="btn-secondary desktop-toggle-btn"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              color: 'var(--sidebar-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Main Navigation Links Rail */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', width: '100%' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={handleNavClick}
                title={item.label}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--sidebar-muted)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.18s ease'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--sidebar-muted)'} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span className="sidebar-text">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Anchored at Bottom (margin-top: auto) */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          width: '100%'
        }}>
          {/* User Profile Details (Desktop Expanded Only) */}
          {!sidebarCollapsed && (
            <div className="sidebar-profile-details" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <UserAvatar avatarId={user?.avatar} name={user?.name} size={34} />
              <div className="sidebar-text" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--sidebar-text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {firstName}
              </div>
            </div>
          )}

          {/* Settings Icon Button */}
          <button
            onClick={() => { handleNavClick(); navigate('/app/settings'); }}
            title="Settings"
            style={{
              background: 'transparent',
              border: 'none',
              color: location.pathname === '/app/settings' ? 'var(--accent-primary)' : 'var(--sidebar-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
