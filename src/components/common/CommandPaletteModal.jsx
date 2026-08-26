import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLuna } from '../../context/LunaContext';
import { api } from '../../services/api';
import {
  Search,
  Plus,
  ArrowRight,
  CheckSquare,
  CreditCard,
  Repeat,
  Activity,
  Users,
  MessageSquare,
  Sliders,
  Sparkles,
  Layout,
  X
} from 'lucide-react';

export function CommandPaletteModal({ isOpen, onClose, onOpenQuickAdd }) {
  const navigate = useNavigate();
  const { tasks, expenses, plans, habits } = useLuna();
  const [searchTerm, setSearchTerm] = useState('');
  const [splits, setSplits] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch splits silently for search
      api.getSplits().then(res => setSplits(Array.isArray(res) ? res : [])).catch(() => {});
    }
  }, [isOpen]);

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (window.__daysync_openCommandPalette) window.__daysync_openCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.toLowerCase().trim();

  // Quick Commands
  const commandsList = [
    { type: 'command', id: 'add_task', label: 'Add Task', icon: Plus, route: '/app/task' },
    { type: 'command', id: 'add_expense', label: 'Add Expense', icon: Plus, route: '/app/expenses' },
    { type: 'command', id: 'add_plan', label: 'Add Plan', icon: Plus, route: '/app/plans' },
    { type: 'command', id: 'add_habit', label: 'Add Habit', icon: Plus, route: '/app/habits' },
    { type: 'command', id: 'add_split_expense', label: 'Add Split Expense', icon: Plus, route: '/app/splits' }
  ].filter(c => !query || c.label.toLowerCase().includes(query));

  // Page Shortcuts
  const pagesList = [
    { type: 'page', id: 'nav_dash', label: 'Open Dashboard', icon: Layout, route: '/app/dashboard' },
    { type: 'page', id: 'nav_tasks', label: 'Open Tasks', icon: CheckSquare, route: '/app/task' },
    { type: 'page', id: 'nav_exp', label: 'Open Expenses', icon: CreditCard, route: '/app/expenses' },
    { type: 'page', id: 'nav_plans', label: 'Open Plans', icon: Repeat, route: '/app/plans' },
    { type: 'page', id: 'nav_splits', label: 'Open Shared Splits', icon: Users, route: '/app/splits' },
    { type: 'page', id: 'nav_habits', label: 'Open Habits', icon: Activity, route: '/app/habits' },
    { type: 'page', id: 'nav_chat', label: 'Open Chat with Luna', icon: MessageSquare, route: '/app/chat' },
    { type: 'page', id: 'nav_settings', label: 'Open Settings', icon: Sliders, route: '/app/settings' }
  ].filter(p => !query || p.label.toLowerCase().includes(query));

  // Data Search Results
  const taskResults = query ? (tasks || []).filter(t => t.title.toLowerCase().includes(query)).slice(0, 3).map(t => ({
    type: 'data', id: `task_${t.id}`, label: t.title, sub: `Task • ${t.dueDate || 'Today'}`, icon: CheckSquare, route: '/app/task'
  })) : [];

  const expResults = query ? (expenses || []).filter(e => (e.description || '').toLowerCase().includes(query) || (e.category || '').toLowerCase().includes(query)).slice(0, 3).map(e => ({
    type: 'data', id: `exp_${e.id}`, label: e.description || e.category, sub: `Expense • ₹${e.amount}`, icon: CreditCard, route: '/app/expenses'
  })) : [];

  const planResults = query ? (plans || []).filter(p => (p.name || p.title || '').toLowerCase().includes(query)).slice(0, 3).map(p => ({
    type: 'data', id: `plan_${p.id}`, label: p.name || p.title, sub: `Plan • ₹${p.amount}/month`, icon: Repeat, route: '/app/plans'
  })) : [];

  const splitResults = query ? (splits || []).filter(s => (s.name || '').toLowerCase().includes(query)).slice(0, 3).map(s => ({
    type: 'data', id: `split_${s.id}`, label: s.name, sub: `Split • ${s.members?.length || 1} members`, route: `/app/splits/${s.id}`, icon: Users
  })) : [];

  const allItems = [...commandsList, ...pagesList, ...taskResults, ...expResults, ...planResults, ...splitResults];

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
      zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', paddingTop: '10vh'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '520px', maxHeight: '75vh', display: 'flex', flexDirection: 'column',
        padding: '16px', borderRadius: '16px', border: '1px solid var(--accent-primary)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)'
      }}>
        {/* Input Bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Search size={18} color="var(--accent-primary)" style={{ position: 'absolute', left: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to do? Search or type a command..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            aria-label="Command palette and global search"
            style={{
              width: '100%', padding: '10px 36px 10px 40px', borderRadius: '10px',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '13.5px', fontWeight: '600'
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
          {allItems.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands or items found for "{searchTerm}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const IconComponent = item.icon || ArrowRight;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.1s ease', minHeight: '40px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <IconComponent size={16} color={isSelected ? '#FFFFFF' : 'var(--accent-primary)'} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </div>
                      {item.sub && (
                        <div style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.sub}
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>
                    {item.type === 'command' ? 'Action' : item.type === 'page' ? 'Go to' : 'Open'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Press <strong>Ctrl + K</strong> anytime</span>
          <span>Use <strong>↑ ↓</strong> to navigate • <strong>↵</strong> to select</span>
        </div>
      </div>
    </div>
  );
}
