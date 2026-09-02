import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, CreditCard, Repeat, Users, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './CartoonAvatars';

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const avatarId = user?.avatar || localStorage.getItem('daysync_user_avatar');
  const userName = user?.name || user?.email || 'User';

  const navItems = [
    { label: 'Home', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/app/task', icon: CheckSquare },
    { label: 'Expenses', path: '/app/expenses', icon: CreditCard },
    { label: 'Plans', path: '/app/plans', icon: Repeat },
    { label: 'Splits', path: '/app/splits', icon: Users },
    { label: 'Profile', path: '/app/settings', icon: User, isProfile: true },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentPath === item.path ||
          (item.path === '/app/dashboard' && (currentPath === '/app' || currentPath === '/app/'));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrapper">
              {item.isProfile ? (
                <UserAvatar avatarId={avatarId} name={userName} size={22} />
              ) : (
                <Icon size={18} />
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
