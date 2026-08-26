import React, { useState, useEffect, useCallback } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  Users,
  Plus,
  QrCode,
  Share2,
  Copy,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';

export function SplitsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Active Split View
  const [selectedSplit, setSelectedSplit] = useState(null);

  // Modals: 'CREATE', 'JOIN', 'SHARE', 'ADD_EXPENSE', 'SETTLE', null
  const [activeModal, setActiveModal] = useState(null);

  // Create Modal State
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Join Modal State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Share Modal State
  const [shareCodeState, setShareCodeState] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Expense Modal State
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '' });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Settle Modal State
  const [settleForm, setSettleForm] = useState({ toUserId: '', amount: '' });
  const [submittingSettle, setSubmittingSettle] = useState(false);

  const fetchSplits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getSplits();
      const list = Array.isArray(data) ? data : [];
      setSplits(list);

      // Refresh selected split if currently viewing one
      if (selectedSplit) {
        const updated = list.find(s => s.id === selectedSplit.id);
        if (updated) setSelectedSplit(updated);
      }
    } catch (err) {
      console.error('Error fetching splits:', err);
      setError('Unable to load splits right now.');
    } finally {
      setLoading(false);
    }
  }, [selectedSplit]);

  useEffect(() => {
    fetchSplits();
  }, []);

  // --- CREATE SPLIT HANDLER ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreating(true);
    try {
      const newSplit = await api.createSplit({
        name: createForm.name.trim(),
        description: createForm.description.trim()
      });
      showToast(`Split "${newSplit.name}" created.`, 'success');
      setCreateForm({ name: '', description: '' });
      setActiveModal(null);
      await fetchSplits();
      setSelectedSplit(newSplit);
    } catch (err) {
      showToast(err.message || 'Could not create Split.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // --- JOIN CODE PREVIEW & SUBMIT HANDLER ---
  const handleJoinCodeChange = (e) => {
    const raw = e.target.value;
    // Auto-normalize code to uppercase and trim spaces
    const clean = raw.toUpperCase().replace(/\s+/g, '');
    setJoinCodeInput(clean);
    setJoinError('');
    setJoinPreview(null);
  };

  const handlePreviewJoinCode = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a Split code.');
      return;
    }

    setJoining(true);
    setJoinError('');
    try {
      const preview = await api.previewSplit(joinCodeInput.trim());
      setJoinPreview(preview);
    } catch (err) {
      const msg = err.message || "That Split code isn't valid.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!joinCodeInput.trim()) return;
    setJoining(true);
    setJoinError('');

    try {
      const res = await api.joinSplit(joinCodeInput.trim());
      showToast(res.message || 'Joined Split successfully!', 'success');
      setJoinCodeInput('');
      setJoinPreview(null);
      setActiveModal(null);
      await fetchSplits();
      if (res.split) {
        setSelectedSplit(res.split);
      }
    } catch (err) {
      const msg = err.message || "Couldn't join the Split right now. Please try again.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  };

  // --- SHARE MODAL & REGENERATE HANDLER ---
  const openShareModal = (split) => {
    setShareCodeState(split.shareCode);
    setActiveModal('SHARE');
  };

  const handleCopyCode = async (codeToCopy) => {
    const code = codeToCopy || shareCodeState;
    try {
      await navigator.clipboard.writeText(code);
      showToast('Split code copied to clipboard!', 'success');
    } catch (e) {
      showToast(`Share Code: ${code}`, 'info');
    }
  };

  const handleNativeShare = async (split) => {
    const code = split?.shareCode || shareCodeState;
    const shareText = `Join my DaySync Split: ${split?.name || 'Group'}\nSplit Code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${split?.name || 'DaySync Split'}`,
          text: shareText
        });
      } catch (err) {
        handleCopyCode(code);
      }
    } else {
      handleCopyCode(code);
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedSplit) return;
    setRegenerating(true);
    try {
      const res = await api.regenerateSplitCode(selectedSplit.id);
      showToast('Share code regenerated successfully.', 'success');
      setShareCodeState(res.shareCode);
      await fetchSplits();
    } catch (err) {
      showToast(err.message || 'Could not regenerate code.', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  // --- EXPENSE HANDLERS ---
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSplit || !expenseForm.title.trim() || !expenseForm.amount) return;

    setSubmittingExpense(true);
    try {
      const updated = await api.addSplitExpense(selectedSplit.id, {
        title: expenseForm.title.trim(),
        amount: parseFloat(expenseForm.amount)
      });
      showToast('Expense added.', 'success');
      setExpenseForm({ title: '', amount: '' });
      setActiveModal(null);
      setSelectedSplit(updated);
      await fetchSplits();
    } catch (err) {
      showToast(err.message || 'Could not add expense.', 'error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!selectedSplit) return;
    try {
      const updated = await api.deleteSplitExpense(selectedSplit.id, expenseId);
      showToast('Expense deleted.', 'info');
      setSelectedSplit(updated);
      await fetchSplits();
    } catch (err) {
      showToast(err.message || 'Could not delete expense.', 'error');
    }
  };

  // --- BALANCE CALCULATIONS ---
  const calculateBalances = (split) => {
    if (!split || !split.members || split.members.length === 0) return { net: 0, breakdown: [] };

    const memberIds = split.members.map(m => m.id);
    const totalMembers = memberIds.length;
    const balances = {};
    memberIds.forEach(id => balances[id] = 0);

    (split.expenses || []).forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      const payerId = exp.paidBy;
      const targetMembers = (exp.splitWith && exp.splitWith.length > 0) ? exp.splitWith : memberIds;
      const share = amount / targetMembers.length;

      targetMembers.forEach(mId => {
        if (mId === payerId) {
          balances[mId] += (amount - share);
        } else {
          balances[mId] -= share;
        }
      });
    });

    (split.settlements || []).forEach(st => {
      const amt = parseFloat(st.amount) || 0;
      if (balances[st.from] !== undefined) balances[st.from] += amt;
      if (balances[st.to] !== undefined) balances[st.to] -= amt;
    });

    const currentUserId = user?.id;
    const net = balances[currentUserId] || 0;

    return { net, balances };
  };

  return (
    <div className="splits-page-wrapper animate-fade-in" style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Row */}
      <PageHeaderRow title="Splits">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveModal('CREATE')}
            className="btn-primary"
            aria-label="Create Split"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
          >
            <Plus size={16} /> + Create Split
          </button>
          <button
            onClick={() => {
              setJoinCodeInput('');
              setJoinPreview(null);
              setJoinError('');
              setActiveModal('JOIN');
            }}
            className="btn-secondary"
            aria-label="Join Split with Code"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
          >
            <QrCode size={16} /> Join with Code
          </button>
        </div>
      </PageHeaderRow>

      {/* DETAILED SPLIT VIEW */}
      {selectedSplit ? (
        <div className="glass-card" style={{ padding: '28px', borderRadius: '16px', marginTop: '16px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => setSelectedSplit(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              <ArrowLeft size={16} /> Back to Splits
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveModal('ADD_EXPENSE')}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 14px' }}
              >
                + Add Expense
              </button>

              <button
                onClick={() => openShareModal(selectedSplit)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>

          {/* Split Info Banner */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{selectedSplit.name}</h2>
            {selectedSplit.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{selectedSplit.description}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
                {selectedSplit.members?.length || 1} members: {selectedSplit.members?.map(m => m.name.split(' ')[0]).join(' • ')}
              </span>
            </div>
          </div>

          {/* Balance Breakdown Banner */}
          {(() => {
            const { net, balances } = calculateBalances(selectedSplit);
            const isOwed = net > 0.01;
            const owes = net < -0.01;

            return (
              <div style={{
                padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                background: isOwed ? 'rgba(0, 229, 195, 0.1)' : owes ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${isOwed ? 'var(--accent-success)' : owes ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Your Net Balance</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: isOwed ? 'var(--accent-success)' : owes ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                    {isOwed && `You are owed ₹${Math.abs(net).toFixed(2)}`}
                    {owes && `You owe ₹${Math.abs(net).toFixed(2)}`}
                    {!isOwed && !owes && 'You are completely settled up!'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Expenses List */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Recent Expenses</h3>
          {(!selectedSplit.expenses || selectedSplit.expenses.length === 0) ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              No expenses recorded yet. Tap "+ Add Expense" above to start splitting!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSplit.expenses.slice().reverse().map(exp => (
                <div
                  key={exp.id}
                  style={{
                    padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{exp.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Paid by <strong style={{ color: 'var(--text-primary)' }}>{exp.paidByName || 'Member'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      ₹{parseFloat(exp.amount).toFixed(2)}
                    </span>
                    {(exp.paidBy === user?.id || selectedSplit.ownerId === user?.id) && (
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        aria-label="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MAIN SPLITS LIST VIEW */
        <div style={{ marginTop: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading your Splits...</div>
          ) : splits.length === 0 ? (
            /* EMPTY STATE */
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px', marginTop: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(47, 111, 115, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Users size={32} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Split expenses with friends</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 24px auto' }}>
                Create a Split or join one using a code.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveModal('CREATE')} className="btn-primary">
                  + Create Split
                </button>
                <button
                  onClick={() => {
                    setJoinCodeInput('');
                    setJoinPreview(null);
                    setJoinError('');
                    setActiveModal('JOIN');
                  }}
                  className="btn-secondary"
                >
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            /* SPLITS CARDS GRID */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {splits.map(split => {
                const { net } = calculateBalances(split);
                const isOwed = net > 0.01;
                const owes = net < -0.01;

                return (
                  <div
                    key={split.id}
                    className="glass-card"
                    style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{split.name}</h3>
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                          {split.members?.length || 1} members
                        </span>
                      </div>

                      {split.description && (
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{split.description}</p>
                      )}

                      <div style={{ marginTop: '14px', fontSize: '0.9rem', fontWeight: '600' }}>
                        {isOwed && <span style={{ color: 'var(--accent-success)' }}>You are owed ₹{Math.abs(net).toFixed(2)}</span>}
                        {owes && <span style={{ color: 'var(--accent-danger)' }}>You owe ₹{Math.abs(net).toFixed(2)}</span>}
                        {!isOwed && !owes && <span style={{ color: 'var(--text-secondary)' }}>Settled up</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSplit(split)}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem', padding: '10px' }}
                    >
                      View Split <ArrowRight size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: CREATE SPLIT --- */}
      {activeModal === 'CREATE' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Create Split</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Split Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Goa Trip"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Optional Description</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Trip expenses"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
                />
              </div>

              <button type="submit" disabled={creating} className="btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }}>
                {creating ? 'Creating...' : 'Create Split'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: JOIN WITH CODE (COMPACT MOBILE FRIENDLY) --- */}
      {activeModal === 'JOIN' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Join a Split</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {joinError && (
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', fontSize: '0.84rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{joinError}</span>
              </div>
            )}

            {!joinPreview ? (
              <form onSubmit={handlePreviewJoinCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Enter Split Code</label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={handleJoinCodeChange}
                    placeholder="GOA-7K4P2"
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px',
                      fontSize: '1.1rem', letterSpacing: '2px', textAlign: 'center', fontWeight: '700'
                    }}
                  />
                </div>

                <button type="submit" disabled={joining || !joinCodeInput.trim()} className="btn-primary" style={{ justifyContent: 'center' }}>
                  {joining ? 'Checking...' : 'Preview Split'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px 0' }}>{joinPreview.name}</h4>
                  {joinPreview.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{joinPreview.description}</p>}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Created by: <strong style={{ color: 'var(--text-primary)' }}>{joinPreview.ownerName}</strong> • {joinPreview.membersCount} members
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setJoinPreview(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmJoin} disabled={joining} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    {joining ? 'Joining...' : 'Join Split'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: SHARE CODE (COMPACT INVITE MODAL) --- */}
      {activeModal === 'SHARE' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Invite Friends</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Share Code</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '3px', color: 'var(--accent-primary)', marginTop: '4px', userSelect: 'all' }}>
                {shareCodeState}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => handleCopyCode(shareCodeState)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                <Copy size={16} /> Copy
              </button>
              <button onClick={() => handleNativeShare(selectedSplit)} className="btn-primary" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                <Share2 size={16} /> Share
              </button>
            </div>

            {selectedSplit && selectedSplit.ownerId === user?.id && (
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} /> {regenerating ? 'Regenerating...' : 'Regenerate Code'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 4: ADD EXPENSE --- */}
      {activeModal === 'ADD_EXPENSE' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Add Split Expense</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Expense Description</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="Food, Movie, Dinner"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="500"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
                />
              </div>

              <button type="submit" disabled={submittingExpense} className="btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }}>
                {submittingExpense ? 'Saving...' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
