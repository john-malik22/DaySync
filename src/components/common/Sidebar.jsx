import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutDashboard, 
  CreditCard, 
  Brain, 
  CheckSquare,
  Activity,
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

  // Navigation Items per exact wireframe specification
  const navItems = [
    { label: 'Chat (AI)', icon: MessageSquare, path: '/app/chat' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Expenses', icon: CreditCard, path: '/app/expenses' },
    { label: 'Memory', icon: Brain, path: '/app/memories' },
    { label: 'Task', icon: CheckSquare, path: '/app/task' },
    { label: 'Habits', icon: Activity, path: '/app/habits' }
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
        {/* Brand & Header Logo Icon */}
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
          {/* DaySync Logo Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '800',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-text">
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#EBF2F7' }}>DaySync</h2>
              </div>
            )}
          </div>

          {/* Desktop Hamburger Toggle Button (Hidden on Mobile Rail) */}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="btn-secondary"
              title="Collapse Sidebar"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: 'none',
                color: '#9BAEB8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Menu size={18} />
            </button>
          )}
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : '#9BAEB8',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#FFFFFF' : '#A8D5CF'} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span className="sidebar-text">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer:
            Desktop Expanded: [ J ]  FirstName                 ⚙
            Desktop Collapsed / Mobile Rail:                   ⚙ (Centered Icon Only)
        */}
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
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {initial}
              </div>
              <div className="sidebar-text" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#EBF2F7', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
              color: location.pathname === '/app/settings' ? 'var(--accent-primary)' : '#9BAEB8',
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
