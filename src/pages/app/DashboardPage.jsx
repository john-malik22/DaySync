import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, CreditCard, CheckCircle2, Sparkles, Activity, ArrowRight, Wallet, Edit2, Check, X, Repeat, Cake, Users, Clock, Calendar } from 'lucide-react';

export function DashboardPage() {
  const { tasks, expenses, routines, startingBalance, updateStartingBalance, toggleTask } = useLuna();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSaveAmount = (e) => {
    e.preventDefault();
    if (!inputAmount) return;
    updateStartingBalance(inputAmount);
    setIsEditingAmount(false);
  };

  const handleStartEdit = () => {
    setInputAmount(startingBalance !== null ? startingBalance.toString() : '');
    setIsEditingAmount(true);
  };

  // Today's Tasks
  const todayTasks = tasks.filter(t => !t.completed && (t.dueDate === todayStr || !t.dueDate));
  const upcomingReminders = tasks.filter(t => !t.completed && t.dueDate && t.dueDate > todayStr).slice(0, 5);

  // Plans Preview
  const activePlans = (expenses || []).filter(e => e.isPlan || e.isRecurring || e.frequency || ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category)).slice(0, 4);

  // Birthdays & Meetings
  const birthdaysAndMeetings = tasks.filter(t => t.taskType === 'birthday' || t.taskType === 'meeting' || t.isBirthday || t.isMeeting || (t.title && (t.title.toLowerCase().includes('birthday') || t.title.toLowerCase().includes('meeting')))).slice(0, 4);

  // Financial Metrics
  const totalReceived = expenses.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalSpent = expenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
  const currentBalance = (startingBalance !== null ? startingBalance : 0) + totalReceived - totalSpent;

  const formattedBalance = currentBalance >= 0 
    ? `+₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `-₹${Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formattedSpent = `-₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedReceived = `+₹${totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-container">
      {/* Top Header Row — greeting */}
      <PageHeaderRow title={`Hello, ${firstName}`} onSearch={setSearch} titleStyle={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }} />

      {/* Dashboard 2.0 Actionable Grid (2-Column Desktop, 1-Column Mobile) */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
        
        {/* ROW 1 LEFT: TODAY'S TASKS */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} color="var(--accent-primary)" /> TODAY'S TASKS ({todayTasks.length})
            </h3>
            <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No pending tasks for today. Great job! 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id, false)}
                      style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        border: '2px solid var(--accent-primary)', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.dueTime || 'Today'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 1 RIGHT: UPCOMING REMINDERS */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--accent-primary)" /> UPCOMING REMINDERS ({upcomingReminders.length})
            </h3>
            <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Tasks <ArrowRight size={13} />
            </Link>
          </div>

          {upcomingReminders.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No upcoming reminders scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingReminders.map(task => (
                <div key={task.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>{formatDate(task.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 2 LEFT: PLANS PREVIEW */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Repeat size={18} color="var(--accent-primary)" /> UPCOMING PLANS ({activePlans.length})
            </h3>
            <Link to="/app/plans" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Plans <ArrowRight size={13} />
            </Link>
          </div>

          {activePlans.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No active plans or subscriptions recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activePlans.map(plan => (
                <div key={plan.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{plan.description || plan.category}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{plan.amount} / {plan.frequency || 'month'}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-warning)', fontWeight: '700' }}>{formatDate(plan.endDate || plan.nextDueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 2 RIGHT: BIRTHDAYS & MEETINGS */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cake size={18} color="var(--accent-primary)" /> BIRTHDAYS & MEETINGS ({birthdaysAndMeetings.length})
            </h3>
            <Link to="/app/task" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Add <ArrowRight size={13} />
            </Link>
          </div>

          {birthdaysAndMeetings.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No birthdays or meetings recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {birthdaysAndMeetings.map(item => (
                <div key={item.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.taskType === 'birthday' || item.isBirthday ? <Cake size={15} color="var(--accent-warning)" /> : <Users size={15} color="var(--accent-primary)" />}
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>{formatDate(item.dueDate || item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 3 LEFT: SPENDING SNAPSHOT */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="var(--accent-primary)" /> SPENDING SNAPSHOT
            </h3>
            <Link to="/app/expenses" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Expenses <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: currentBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                {formattedBalance}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>SPENT</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-danger)' }}>{formattedSpent}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>RECEIVED</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-success)' }}>{formattedReceived}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3 RIGHT: LUNA SUGGESTION */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> LUNA ASSISTANT
            </h3>
            <Link to="/app/chat" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Chat <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.5'
          }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              🧠 <strong>Luna Focus:</strong> You have {todayTasks.length} task(s) for today and {activePlans.length} active plan(s). Ask Luna to organize your schedule or add recurring items anytime!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
