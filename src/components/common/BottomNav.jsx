import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, CreditCard, Repeat, Users, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Home', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/app/task', icon: CheckSquare },
    { label: 'Expenses', path: '/app/expenses', icon: CreditCard },
    { label: 'Plans', path: '/app/plans', icon: Repeat },
    { label: 'Splits', path: '/app/splits', icon: Users },
    { label: 'Profile', path: '/app/settings', icon: User },
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
              <Icon size={18} />
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
