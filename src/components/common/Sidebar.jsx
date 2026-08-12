import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutDashboard, 
  CreditCard, 
  Calendar, 
  FileText, 
  Brain, 
  Settings, 
  Sparkles,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar } = useLuna();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Chat', icon: MessageSquare, path: '/app/chat', highlight: true },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Planner', icon: Calendar, path: '/app/planner' },
    { label: 'Expenses', icon: CreditCard, path: '/app/expenses' },
    { label: 'Memories', icon: Brain, path: '/app/memories' },
    { label: 'Summary', icon: FileText, path: '/app/summary' },
  ];

  const handleNavClick = () => {
    // Close mobile drawer when user selects a link
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
        {/* Brand Header & Hide/Show Sidebar Toggle Button */}
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 24px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div className="sidebar-text">
              <h2 style={{ fontSize: '1.3rem', letterSpacing: '-0.5px' }}>LUNA</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Companion</p>
            </div>
          </div>

          {/* Desktop & Mobile Hide/Show Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="btn-secondary"
            title={sidebarCollapsed ? "Expand Sidebar" : "Hide / Collapse Sidebar"}
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)'
            }}
          >
            {sidebarOpen ? (
              <X size={20} />
            ) : sidebarCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '11px 0' : '11px 14px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive 
                    ? item.highlight ? 'var(--accent-gradient)' : 'var(--bg-tertiary)' 
                    : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : 'var(--accent-primary)'} style={{ flexShrink: 0 }} />
                <span className="sidebar-text">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="sidebar-badge" style={{
                    marginLeft: 'auto',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontWeight: '600'
                  }}>Central</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile & Settings Option */}
        <div className="sidebar-footer-user" style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              flexShrink: 0
            }}>
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="sidebar-user-details">
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--accent-success)" /> Privacy Shield
              </div>
            </div>
          </div>

          <button
            onClick={() => { handleNavClick(); navigate('/app/settings'); }}
            className="btn-secondary sidebar-text"
            title="Settings & Privacy"
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: location.pathname === '/app/settings' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: location.pathname === '/app/settings' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
