import React, { useState } from 'react';
import { Plus, CreditCard, CheckSquare, Bell, MessageSquare, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const { addExpense, addTask } = useLuna();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState(null); // 'expense', 'task', 'reminder'

  const [expData, setExpData] = useState({ amount: '', category: 'Food', description: '' });
  const [taskData, setTaskData] = useState({ title: '', priority: 'High', dueDate: new Date().toISOString().split('T')[0] });

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expData.amount) return;
    addExpense({ amount: parseFloat(expData.amount), category: expData.category, description: expData.description || expData.category });
    setModalType(null);
    setOpen(false);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskData.title) return;
    addTask(taskData);
    setModalType(null);
    setOpen(false);
  };

  return (
    <>
      {/* Floating Action Trigger (Simulating Android Persistent Widget / Quick Action Bar) */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}>
        {open && (
          <div className="animate-fade-in" style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '12px',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', padding: '0 8px 4px' }}>
              LUNA QUICK ACTIONS
            </div>
            
            <button
              onClick={() => { setModalType('expense'); }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <CreditCard size={15} color="var(--accent-warning)" /> + Expense
            </button>

            <button
              onClick={() => { navigate('/app/chat'); setOpen(false); }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <MessageSquare size={15} color="var(--accent-primary)" /> Ask Luna
            </button>

            <button
              onClick={() => { setModalType('task'); }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <CheckSquare size={15} color="var(--accent-success)" /> + Task
            </button>

            <button
              onClick={() => { setModalType('task'); }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <Bell size={15} color="var(--accent-secondary)" /> Reminder
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="btn-primary pulse-glow"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            padding: 0,
            justifyContent: 'center'
          }}
        >
          {open ? <X size={22} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Quick Add Expense Modal */}
      {modalType === 'expense' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>Quick Add Expense</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setModalType(null)} />
            </div>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="number"
                placeholder="Amount (e.g. 500)"
                value={expData.amount}
                onChange={e => setExpData({ ...expData, amount: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#fff' }}
              />
              <select
                value={expData.category}
                onChange={e => setExpData({ ...expData, category: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#fff' }}
              >
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Description (e.g. Lunch at café)"
                value={expData.description}
                onChange={e => setExpData({ ...expData, description: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#fff' }}
              />
              <button type="submit" className="btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Task Modal */}
      {modalType === 'task' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>Quick Add Task</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setModalType(null)} />
            </div>
            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Task title (e.g. Submit assignment)"
                value={taskData.title}
                onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#fff' }}
              />
              <select
                value={taskData.priority}
                onChange={e => setTaskData({ ...taskData, priority: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#fff' }}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
