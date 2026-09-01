import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { ReactionBadge } from '../../components/common/ReactionBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { useFormDraft } from '../../hooks/useFormDraft';
import {
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  DollarSign,
  Copy,
  AlertCircle,
  QrCode,
  RefreshCw,
  Trash2
} from 'lucide-react';

// Helper utilities for crash-proof member handling
const getMemberId = (m) => m?.userId || m?.id || '';
const getMemberName = (m) => m?.userName || m?.name || m?.userEmail || m?.email || 'Member';
const getMemberEmail = (m) => m?.userEmail || m?.email || '';
const getMemberInitial = (m) => {
  const name = getMemberName(m);
  return (name[0] || 'M').toUpperCase();
};

export function SplitsPage() {
  const { id: routeSplitId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id;

  const [splits, setSplits] = useState([]);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splitDetailLoading, setSplitDetailLoading] = useState(false);
  const [splitNotFound, setSplitNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses', 'balances', 'members'

  // Modals
  const [showCreateSplit, setShowCreateSplit] = useState(false);
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Form States
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitDesc, setNewSplitDesc] = useState('');
  const [newSplitCurrency, setNewSplitCurrency] = useState('₹');

  // Auto-Save & Draft Recovery Hook for Create Split
  const handleRestoreSplitDraft = useCallback((draftData) => {
    if (draftData.newSplitName !== undefined) setNewSplitName(draftData.newSplitName);
    if (draftData.newSplitDesc !== undefined) setNewSplitDesc(draftData.newSplitDesc);
    if (draftData.newSplitCurrency !== undefined) setNewSplitCurrency(draftData.newSplitCurrency);
  }, []);

  const { draftStatus: splitDraftStatus, clearDraft: clearSplitDraft } = useFormDraft(
    'split_create',
    { newSplitName, newSplitDesc, newSplitCurrency },
    handleRestoreSplitDraft
  );

  // Expense Form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitMethod, setExpSplitMethod] = useState('EQUAL'); // 'EQUAL', 'CUSTOM'
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});

  // Settlement Form
  const [settleToUser, setSettleToUser] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // Code-based Sharing & Joining States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // Fetch all user splits
  const fetchSplitsData = useCallback(async () => {
    if (!userId) return;
    try {
      const splitList = await api.getSplits().catch(() => []);
      const list = Array.isArray(splitList) ? splitList : [];
      setSplits(list);

      // Refresh selected split if currently open
      if (selectedSplit?.id) {
        const refreshed = await api.getSplitById(selectedSplit.id).catch(() => null);
        if (refreshed) {
          setSelectedSplit(refreshed);
        }
      }
    } catch (e) {
      console.warn('Error loading splits data:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedSplit?.id]);

  // Sync route param with backend fetch (Restores Split on page refresh)
  useEffect(() => {
    if (!routeSplitId) {
      setSelectedSplit(null);
      setSplitNotFound(false);
      return;
    }

    if (!userId) return; // Wait for auth initialization on refresh

    let isMounted = true;
    const loadSplitDetail = async () => {
      setSplitDetailLoading(true);
      setSplitNotFound(false);
      try {
        const data = await api.getSplitById(routeSplitId);
        if (isMounted) {
          setSelectedSplit(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err?.status === 404) {
            setSplitNotFound(true);
          } else if (showToast) {
            showToast(err?.message || 'Could not load Split details.', 'error');
          }
        }
      } finally {
        if (isMounted) setSplitDetailLoading(false);
      }
    };

    loadSplitDetail();
    return () => { isMounted = false; };
  }, [routeSplitId, userId]);

  // Polling interval (every 5 seconds when active)
  useEffect(() => {
    fetchSplitsData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchSplitsData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSplitsData]);

  // Navigation helpers
  const handleOpenSplit = (split) => {
    if (!split?.id) return;
    setSelectedSplit(split);
    navigate(`/app/splits/${split.id}`);
  };

  const handleBackToAllSplits = () => {
    setSelectedSplit(null);
    setSplitNotFound(false);
    navigate('/app/splits');
  };

  // Create Split Handler
  const handleCreateSplit = async (e) => {
    e.preventDefault();
    const trimmedName = newSplitName.trim();
    if (!trimmedName) {
      if (showToast) showToast('Please enter a Split name.', 'error');
      return;
    }

    if (isCreatingSplit) return;
    setIsCreatingSplit(true);

    try {
      const created = await api.createSplit({
        name: trimmedName,
        description: newSplitDesc.trim(),
        currency: newSplitCurrency
      });

      const fullCreated = {
        expenses: [],
        settlements: [],
        members: [],
        ...created
      };

      setShowCreateSplit(false);
      setNewSplitName('');
      setNewSplitDesc('');
      clearSplitDraft();
      if (showToast) showToast(`Split "${trimmedName}" created!`, 'success');

      setSplits(prev => [fullCreated, ...prev.filter(s => s.id !== fullCreated.id)]);
      handleOpenSplit(fullCreated);
    } catch (err) {
      if (showToast) showToast(err?.message || 'Unable to create this Split.', 'error');
    } finally {
      setIsCreatingSplit(false);
    }
  };

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    if (!selectedSplit) return;
    const members = selectedSplit.members || [];
    setExpDesc('');
    setExpAmount('');
    setExpPaidBy(userId);
    setExpSplitMethod('EQUAL');
    setSelectedParticipants(members.map(m => getMemberId(m)).filter(Boolean));
    setCustomAmounts({});
    setShowAddExpense(true);
  };

  // Submit Add Expense
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount || parseFloat(expAmount) <= 0) {
      if (showToast) showToast('Please enter description and a valid amount.', 'error');
      return;
    }
    if (selectedParticipants.length === 0) {
      if (showToast) showToast('Select at least one member to split between.', 'error');
      return;
    }

    const totalAmt = parseFloat(expAmount);
    let participantsData = [];

    if (expSplitMethod === 'EQUAL') {
      const share = totalAmt / selectedParticipants.length;
      participantsData = selectedParticipants.map(uid => ({
        userId: uid,
        owedAmount: Math.round(share * 100) / 100
      }));
    } else {
      let customSum = 0;
      participantsData = selectedParticipants.map(uid => {
        const amt = parseFloat(customAmounts[uid] || 0);
        customSum += amt;
        return { userId: uid, owedAmount: amt };
      });

      if (Math.abs(customSum - totalAmt) > 0.5) {
        if (showToast) showToast(`Custom amounts sum (${customSum}) must equal total expense amount (${totalAmt}).`, 'error');
        return;
      }
    }

    try {
      await api.addSplitExpense(selectedSplit.id, {
        description: expDesc.trim(),
        amount: totalAmt,
        paidByUserId: expPaidBy || userId,
        splitMethod: expSplitMethod,
        participants: participantsData
      });

      setShowAddExpense(false);
      if (showToast) showToast(`Added expense "${expDesc}" to ${selectedSplit.name}!`, 'success');
      const refreshed = await api.getSplitById(selectedSplit.id).catch(() => null);
      if (refreshed) setSelectedSplit(refreshed);
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not add expense.', 'error');
    }
  };

  // Submit Settlement
  const handleSettleUpSubmit = async (e) => {
    e.preventDefault();
    if (!settleToUser || !settleAmount || parseFloat(settleAmount) <= 0) return;

    try {
      await api.createSplitSettlement(selectedSplit.id, {
        toUserId: settleToUser,
        amount: parseFloat(settleAmount)
      });
      setShowSettleModal(false);
      setSettleToUser('');
      setSettleAmount('');
      if (showToast) showToast('Settlement marked as paid!', 'success');
      const refreshed = await api.getSplitById(selectedSplit.id).catch(() => null);
      if (refreshed) setSelectedSplit(refreshed);
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not record settlement.', 'error');
    }
  };

  // Code-based Sharing & Joining Handlers
  const handleOpenJoinModal = () => {
    setJoinCodeInput('');
    setJoinPreview(null);
    setJoinError('');
    setShowJoinModal(true);
  };

  const handleJoinCodeChange = (e) => {
    const raw = e.target.value;
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

    setJoinLoading(true);
    setJoinError('');
    try {
      const preview = await api.previewSplit(joinCodeInput.trim());
      setJoinPreview(preview);
    } catch (err) {
      setJoinError(err.message || "That Split code isn't valid.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleConfirmJoinCode = async () => {
    if (!joinCodeInput.trim()) return;
    setJoinLoading(true);
    setJoinError('');

    try {
      const res = await api.joinSplit(joinCodeInput.trim());
      if (showToast) showToast(res.message || 'Joined Split successfully!', 'success');
      setShowJoinModal(false);
      setJoinCodeInput('');
      setJoinPreview(null);
      await fetchSplitsData();
      if (res.split) {
        handleOpenSplit(res.split);
      }
    } catch (err) {
      setJoinError(err.message || "Couldn't join the Split right now. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyCode = async (codeToCopy) => {
    const code = codeToCopy || selectedSplit?.shareCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      if (showToast) showToast('Split code copied to clipboard!', 'success');
    } catch (e) {
      if (showToast) showToast(`Split Code: ${code}`, 'info');
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedSplit?.id) return;
    setRegeneratingCode(true);
    try {
      const res = await api.regenerateSplitCode(selectedSplit.id);
      if (showToast) showToast('Share code regenerated successfully.', 'success');
      setSelectedSplit(prev => prev ? { ...prev, shareCode: res.shareCode } : prev);
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not regenerate code.', 'error');
    } finally {
      setRegeneratingCode(false);
    }
  };

  // Crash-proof calculations for current selected split
  const membersMap = React.useMemo(() => {
    if (!selectedSplit?.members || !Array.isArray(selectedSplit.members)) return {};
    const map = {};
    selectedSplit.members.forEach(m => {
      const uid = getMemberId(m);
      if (uid) map[uid] = getMemberName(m);
    });
    return map;
  }, [selectedSplit]);

  // Compute Net Balances & Simplified Settlements
  const { totalSpent, myNetBalance, memberBalances, suggestedSettlements } = React.useMemo(() => {
    if (!selectedSplit) return { totalSpent: 0, myNetBalance: 0, memberBalances: {}, suggestedSettlements: [] };

    const expenses = Array.isArray(selectedSplit.expenses) ? selectedSplit.expenses : [];
    const settlements = Array.isArray(selectedSplit.settlements) ? selectedSplit.settlements : [];
    const members = Array.isArray(selectedSplit.members) ? selectedSplit.members : [];

    let total = 0;
    const balances = {};
    members.forEach(m => {
      const uid = getMemberId(m);
      if (uid) balances[uid] = 0;
    });

    // Process Expenses
    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount) || 0;
      total += amt;
      const paidBy = exp.paidByUserId || exp.paidBy;
      if (paidBy && balances[paidBy] !== undefined) {
        balances[paidBy] += amt;
      }

      const participants = Array.isArray(exp.participants) ? exp.participants : (Array.isArray(exp.splitWith) ? exp.splitWith : []);
      const count = participants.length || 1;

      participants.forEach(p => {
        const pUid = typeof p === 'string' ? p : getMemberId(p);
        const owed = typeof p === 'object' && p?.owedAmount !== undefined ? parseFloat(p.owedAmount) : (amt / count);
        if (pUid && balances[pUid] !== undefined) {
          balances[pUid] -= (owed || 0);
        }
      });
    });

    // Process Completed Settlements
    settlements.forEach(s => {
      if (s.status === 'completed' || s.from) {
        const fromId = s.fromUserId || s.from;
        const toId = s.toUserId || s.to;
        const amt = parseFloat(s.amount) || 0;
        if (fromId && balances[fromId] !== undefined) balances[fromId] += amt;
        if (toId && balances[toId] !== undefined) balances[toId] -= amt;
      }
    });

    const myNet = balances[userId] || 0;

    // Debt Simplification Algorithm
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([uid, net]) => {
      const rounded = Math.round(net * 100) / 100;
      if (rounded < -0.01) debtors.push({ userId: uid, amount: -rounded });
      else if (rounded > 0.01) creditors.push({ userId: uid, amount: rounded });
    });

    const suggestions = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmt = Math.min(debtor.amount, creditor.amount);

      suggestions.push({
        fromUserId: debtor.userId,
        fromName: membersMap[debtor.userId] || 'Member',
        toUserId: creditor.userId,
        toName: membersMap[creditor.userId] || 'Member',
        amount: Math.round(settleAmt * 100) / 100
      });

      debtor.amount -= settleAmt;
      creditor.amount -= settleAmt;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return {
      totalSpent: total,
      myNetBalance: myNet,
      memberBalances: balances,
      suggestedSettlements: suggestions
    };
  }, [selectedSplit, userId, membersMap]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '920px' }}>
      <PageHeaderRow title="Splits & Group Expenses" />

      {/* VIEW A: SPLIT NOT FOUND ERROR STATE */}
      {splitNotFound ? (
        <div className="glass-card animate-fade-in" style={{ padding: '40px 20px', textAlign: 'center', margin: '20px 0' }}>
          <AlertCircle size={44} color="var(--accent-danger)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Split not found.</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            The requested Split does not exist or you do not have permission to view it.
          </p>
          <button type="button" onClick={handleBackToAllSplits} className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
            Back to All Splits
          </button>
        </div>
      ) : splitDetailLoading ? (
        /* LOADING DETAIL STATE */
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading Split details...
        </div>
      ) : !selectedSplit ? (
        /* VIEW B: LIST OF ALL USER SPLITS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                Shared Splits & Group Expenses
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Track group trips, household bills, and shared events seamlessly.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCreateSplit(true)}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                <Plus size={16} /> Create Split
              </button>
              <button
                type="button"
                onClick={handleOpenJoinModal}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Join with Code
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading your Splits...
            </div>
          ) : splits.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No shared splits yet"
              description="Create a split when you share an expense."
              actionLabel="Create Split"
              onAction={() => setShowCreateSplit(true)}
              actionIcon={Plus}
              compact
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
              {splits.map(split => {
                const members = Array.isArray(split.members) ? split.members : [];
                const expenses = Array.isArray(split.expenses) ? split.expenses : [];
                const memberCount = members.length || 1;
                const totalExp = expenses.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);

                return (
                  <div
                    key={split.id}
                    onClick={() => handleOpenSplit(split)}
                    className="glass-card clickable animate-fade-in"
                    style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                          {split.name}
                        </h4>
                        {split.description && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {split.description}
                          </p>
                        )}
                      </div>
                      <span className="badge" style={{ fontSize: '11px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {memberCount} member{memberCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: 'auto'
                    }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {split.currency || '₹'}{totalExp.toLocaleString()}
                        </div>
                      </div>

                      <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Split <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW C: SELECTED SPLIT DETAIL VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Back Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={handleBackToAllSplits}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <ArrowLeft size={14} /> Back to All Splits
            </button>
          </div>

          {/* DESKTOP SPLIT SUMMARY HEADER CARD (Visible on Desktop >=769px) */}
          <div className="glass-card desktop-split-summary-card" style={{ padding: '20px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                  {selectedSplit.name}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Members: {(selectedSplit.members || []).map(m => getMemberName(m)).join(' • ')}
                </div>

                {/* Compact Secondary Split Code Control */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  marginTop: '10px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Split Code: <strong style={{ color: 'var(--accent-primary)', letterSpacing: '1px', userSelect: 'all', fontWeight: '700' }}>{selectedSplit.shareCode || 'GOA-7K4P2'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedSplit.shareCode)}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '2px 4px', fontSize: '11px', fontWeight: '600',
                      display: 'inline-flex', alignItems: 'center', gap: '3px', borderRadius: '4px'
                    }}
                    title="Copy Split Code"
                  >
                    <Copy size={12} /> Copy
                  </button>

                  {selectedSplit.ownerId === userId && (
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={regeneratingCode}
                      style={{
                        background: 'transparent', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: '2px 4px', fontSize: '11px',
                        display: 'inline-flex', alignItems: 'center', borderRadius: '4px'
                      }}
                      title="Regenerate Split Code"
                    >
                      <RefreshCw size={12} className={regeneratingCode ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Net Status</span>
                <ReactionBadge category="SPLITS" data={{ netAmount: myNetBalance, isSettled: Math.abs(myNetBalance) < 0.01 }} seed={Math.round(myNetBalance)} style={{ marginTop: '2px' }} />
                <div style={{
                  fontSize: '1.25rem', fontWeight: '800', marginTop: '2px',
                  color: myNetBalance > 0.01 ? 'var(--accent-success)' : myNetBalance < -0.01 ? 'var(--accent-danger)' : 'var(--text-primary)'
                }}>
                  {myNetBalance > 0.01
                    ? `You are owed ${selectedSplit.currency || '₹'}${myNetBalance.toFixed(2)}`
                    : myNetBalance < -0.01
                    ? `You owe ${selectedSplit.currency || '₹'}${Math.abs(myNetBalance).toFixed(2)}`
                    : 'Settled ✓'}
                </div>
              </div>
            </div>

            {/* Total Spent readout & Action buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
              paddingTop: '14px', borderTop: '1px solid var(--border-color)', marginTop: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Group Total Spent</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {selectedSplit.currency || '₹'}{totalSpent.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleOpenAddExpense}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  <Plus size={15} /> Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettleModal(true)}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px', color: 'var(--accent-success)' }}
                >
                  <DollarSign size={15} /> Settle Up
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE SPLIT SUMMARY HEADER CARD (Visible on Mobile <=768px) */}
          <div className="glass-card mobile-split-summary-card" style={{ padding: '16px', border: '1px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 2. Group Name & 3. Members */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '800', lineHeight: '1.2' }}>
                  {selectedSplit.name}
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Members: {(selectedSplit.members || []).map(m => getMemberName(m)).join(' • ')}
                </div>
              </div>

              {/* Split Code Pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', flexShrink: 0
              }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--accent-primary)', letterSpacing: '0.5px', userSelect: 'all', fontWeight: '700' }}>{selectedSplit.shareCode || 'GOA-7K4P2'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedSplit.shareCode)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '1px 3px', fontSize: '10px', display: 'inline-flex', alignItems: 'center' }}
                  title="Copy Split Code"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>

            {/* 4. Your Net Status */}
            <div style={{
              background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px',
              border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                YOUR NET STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <ReactionBadge category="SPLITS" data={{ netAmount: myNetBalance, isSettled: Math.abs(myNetBalance) < 0.01 }} seed={Math.round(myNetBalance)} style={{ margin: 0 }} />
                <div style={{
                  fontSize: '1.15rem', fontWeight: '800',
                  color: myNetBalance > 0.01 ? 'var(--accent-success)' : myNetBalance < -0.01 ? 'var(--accent-danger)' : 'var(--text-primary)'
                }}>
                  {myNetBalance > 0.01
                    ? `You are owed ${selectedSplit.currency || '₹'}${myNetBalance.toFixed(2)}`
                    : myNetBalance < -0.01
                    ? `You have to pay ${selectedSplit.currency || '₹'}${Math.abs(myNetBalance).toFixed(2)}`
                    : 'Settled ✓'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', margin: '2px 0' }} />

            {/* 5. Group Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                GROUP TOTAL
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {selectedSplit.currency || '₹'}{totalSpent.toLocaleString()}
              </span>
            </div>

            {/* 6. Action buttons (Same row, equal width) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleOpenAddExpense}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'center', width: '100%', whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Expense
              </button>
              <button
                type="button"
                onClick={() => setShowSettleModal(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'center', width: '100%', color: 'var(--accent-success)', whiteSpace: 'nowrap' }}
              >
                <DollarSign size={14} /> Settle Up
              </button>
            </div>
          </div>

          {/* 7. Sub-Tabs: Expenses, Balances, Members */}
          <div className="scroll-row splits-detail-tabs-nav" style={{ gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'expenses' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'expenses' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'expenses' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer',
                textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
              }}
            >
              Recent Expenses ({(selectedSplit.expenses || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('balances')}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'balances' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'balances' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'balances' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer',
                textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
              }}
            >
              Balances ({suggestedSettlements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'members' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'members' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer',
                textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
              }}
            >
              Members ({(selectedSplit.members || []).length})
            </button>
          </div>

          {/* TAB CONTENT 1: EXPENSE HISTORY */}
          {activeTab === 'expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(selectedSplit.expenses || []).length === 0 ? (
                <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No shared expenses logged in this Split yet. Tap <strong>+ Add Expense</strong> to start!
                </div>
              ) : (
                (selectedSplit.expenses || []).map(exp => {
                  const paidByUid = exp.paidByUserId || exp.paidBy;
                  const paidByName = membersMap[paidByUid] || exp.paidByName || 'Member';
                  const isPayer = paidByUid === userId;
                  const participants = Array.isArray(exp.participants) ? exp.participants : (Array.isArray(exp.splitWith) ? exp.splitWith : []);
                  const myParticipant = participants.find(p => (typeof p === 'object' ? (p.userId === userId || p.id === userId) : p === userId));
                  const owedAmount = myParticipant?.owedAmount !== undefined ? parseFloat(myParticipant.owedAmount) : ((parseFloat(exp.amount) || 0) / (participants.length || 1));

                  return (
                    <div
                      key={exp.id}
                      className="glass-card animate-fade-in"
                      style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {exp.description || exp.title || 'Expense'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Paid by <strong>{isPayer ? 'You' : paidByName}</strong> • {selectedSplit.currency || '₹'}{exp.amount} total
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isPayer ? (
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-success)' }}>
                            You lent {selectedSplit.currency || '₹'}{(exp.amount - owedAmount).toFixed(2)}
                          </div>
                        ) : myParticipant ? (
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-danger)' }}>
                            Your share: {selectedSplit.currency || '₹'}{owedAmount.toFixed(2)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not involved</div>
                        )}
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatDate(exp.date || exp.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT 2: BALANCES & SETTLEMENTS */}
          {activeTab === 'balances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  Member Balances
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {Object.entries(memberBalances).map(([uid, net]) => {
                    const name = membersMap[uid] || 'Member';
                    const isMe = uid === userId;
                    const roundedNet = Math.round(net * 100) / 100;

                    return (
                      <div
                        key={uid}
                        style={{
                          padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: isMe ? '700' : '500', color: 'var(--text-primary)' }}>
                          {isMe ? 'You' : name}
                        </span>
                        <span style={{
                          fontSize: '12px', fontWeight: '700',
                          color: roundedNet > 0.01 ? 'var(--accent-success)' : roundedNet < -0.01 ? 'var(--accent-danger)' : 'var(--text-muted)'
                        }}>
                          {roundedNet > 0.01 ? `+${selectedSplit.currency || '₹'}${roundedNet.toFixed(2)}` : roundedNet < -0.01 ? `-${selectedSplit.currency || '₹'}${Math.abs(roundedNet).toFixed(2)}` : 'Settled'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  Suggested Settlements
                </h4>

                {suggestedSettlements.length === 0 ? (
                  <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Everyone is fully settled up! 🎉
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {suggestedSettlements.map((s, idx) => {
                      const isDebtorMe = s.fromUserId === userId;
                      const isCreditorMe = s.toUserId === userId;

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: '10px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {isDebtorMe ? 'You' : s.fromName} owes {isCreditorMe ? 'You' : s.toName}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '2px' }}>
                              {selectedSplit.currency || '₹'}{s.amount.toFixed(2)}
                            </div>
                          </div>

                          {(isDebtorMe || isCreditorMe) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSettleToUser(isDebtorMe ? s.toUserId : s.fromUserId);
                                setSettleAmount(s.amount.toString());
                                setShowSettleModal(true);
                              }}
                              className="btn-primary"
                              style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--accent-success)', border: 'none' }}
                            >
                              <CheckCircle2 size={14} /> Settle Up
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: MEMBERS */}
          {activeTab === 'members' && (
            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  Members ({(selectedSplit.members || []).length})
                </h4>
              </div>

              {(selectedSplit.members || []).length === 0 ? (
                <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No members yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedSplit.members || []).map((m, idx) => {
                    const uid = getMemberId(m);
                    const name = getMemberName(m);
                    const email = getMemberEmail(m);
                    const initial = getMemberInitial(m);

                    return (
                      <div
                        key={uid || idx}
                        style={{
                          padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)',
                            color: '#FFFFFF', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {name} {uid === userId ? '(You)' : ''}
                            </div>
                            {email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{email}</div>}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: m.role === 'owner' ? 'rgba(255, 176, 32, 0.15)' : 'var(--color-primary-soft)',
                          color: m.role === 'owner' ? 'var(--accent-warning)' : 'var(--accent-primary)'
                        }}>
                          {m.role === 'owner' ? 'Owner' : 'Member'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE SPLIT */}
      {showCreateSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Create New Split
            </h3>

            <form onSubmit={handleCreateSplit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Split Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, Apartment Rent"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend getaway expenses"
                  value={newSplitDesc}
                  onChange={(e) => setNewSplitDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateSplit(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingSplit} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                  {isCreatingSplit ? 'Creating...' : 'Create Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD EXPENSE */}
      {showAddExpense && selectedSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Add Expense to "{selectedSplit.name}"
            </h3>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner, Fuel, Grocery"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Amount ({selectedSplit.currency || '₹'})</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Paid By</label>
                <select
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                >
                  {(selectedSplit.members || []).map(m => {
                    const uid = getMemberId(m);
                    return (
                      <option key={uid} value={uid}>
                        {uid === userId ? 'You' : getMemberName(m)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Split Method</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setExpSplitMethod('EQUAL')}
                    style={{
                      flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', borderRadius: 'var(--radius-sm)',
                      border: expSplitMethod === 'EQUAL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: expSplitMethod === 'EQUAL' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: expSplitMethod === 'EQUAL' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    Split Equally
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpSplitMethod('CUSTOM')}
                    style={{
                      flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', borderRadius: 'var(--radius-sm)',
                      border: expSplitMethod === 'CUSTOM' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: expSplitMethod === 'CUSTOM' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: expSplitMethod === 'CUSTOM' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    Custom Share
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Split Between Members
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {(selectedSplit.members || []).map(m => {
                    const uid = getMemberId(m);
                    const isChecked = selectedParticipants.includes(uid);
                    return (
                      <div key={uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants(prev => [...prev, uid]);
                              } else {
                                setSelectedParticipants(prev => prev.filter(id => id !== uid));
                              }
                            }}
                            style={{ accentColor: 'var(--accent-primary)' }}
                          />
                          <span>{uid === userId ? 'You' : getMemberName(m)}</span>
                        </label>

                        {expSplitMethod === 'CUSTOM' && isChecked && (
                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={customAmounts[uid] || ''}
                            onChange={(e) => setCustomAmounts({ ...customAmounts, [uid]: e.target.value })}
                            style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddExpense(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTLE UP */}
      {showSettleModal && selectedSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Settle Up Payment
            </h3>

            <form onSubmit={handleSettleUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Settle With Member</label>
                <select
                  value={settleToUser}
                  onChange={(e) => setSettleToUser(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="">Select Member...</option>
                  {(selectedSplit.members || []).filter(m => getMemberId(m) !== userId).map(m => {
                    const uid = getMemberId(m);
                    return (
                      <option key={uid} value={uid}>
                        {getMemberName(m)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Settlement Amount ({selectedSplit.currency || '₹'})</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowSettleModal(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px', background: 'var(--accent-success)', border: 'none' }}>
                  Mark as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: JOIN WITH CODE (COMPACT MOBILE FRIENDLY MODAL) */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Join a Split</h3>
              <button type="button" onClick={() => setShowJoinModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>

            {joinError && (
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{joinError}</span>
              </div>
            )}

            {!joinPreview ? (
              <form onSubmit={handlePreviewJoinCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Enter Split Code</label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={handleJoinCodeChange}
                    placeholder="e.g. GOA-7K4P2"
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px',
                      fontSize: '1.15rem', letterSpacing: '2px', textAlign: 'center', fontWeight: '700'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={joinLoading || !joinCodeInput.trim()} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    {joinLoading ? 'Checking...' : 'Preview Split'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{joinPreview.name}</h4>
                  {joinPreview.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>{joinPreview.description}</p>}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Created by: <strong style={{ color: 'var(--text-primary)' }}>{joinPreview.ownerName}</strong> • {joinPreview.membersCount} member{joinPreview.membersCount === 1 ? '' : 's'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setJoinPreview(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px' }}>
                    Back
                  </button>
                  <button type="button" onClick={handleConfirmJoinCode} disabled={joinLoading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px' }}>
                    {joinLoading ? 'Joining...' : 'Join Split'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
