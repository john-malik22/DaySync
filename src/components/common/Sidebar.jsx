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
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
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

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      zIndex: 100
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px 24px 8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', letterSpacing: '-0.5px' }}>LUNA</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI for Everyday Life</p>
        </div>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
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
              <Icon size={18} color={isActive ? '#ffffff' : 'var(--accent-primary)'} />
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span style={{
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

      {/* User Footer Profile & Settings Option Nearby */}
      <div style={{
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
            border: '1px solid var(--border-color)'
          }}>
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="var(--accent-success)" /> Privacy Shield
            </div>
          </div>
        </div>

        {/* Settings button placed right next to user profile */}
        <button
          onClick={() => navigate('/app/settings')}
          className="btn-secondary"
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
  );
}
