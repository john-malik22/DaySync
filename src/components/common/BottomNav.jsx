import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, CreditCard, Repeat, Menu } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function BottomNav() {
  const { toggleSidebar } = useLuna();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Home', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/app/task', icon: CheckSquare },
    { label: 'Expenses', path: '/app/expenses', icon: CreditCard },
    { label: 'Plans', path: '/app/plans', icon: Repeat },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path === '/app/dashboard' && (currentPath === '/app' || currentPath === '/app/'));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon size={20} />
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        );
      })}

      {/* More Button to trigger existing drawer/sidebar navigation */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="bottom-nav-item bottom-nav-more-btn"
        aria-label="Open More Navigation Options"
      >
        <div className="bottom-nav-icon-wrapper">
          <Menu size={20} />
        </div>
        <span className="bottom-nav-label">More</span>
      </button>
    </nav>
  );
}
