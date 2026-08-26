import React, { useState, useEffect, useCallback } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import {
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Share2,
  DollarSign,
  UserPlus,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Receipt,
  Search,
  UserCheck
} from 'lucide-react';

export function SplitsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id;

  const [splits, setSplits] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses', 'balances', 'members'

  // Modals
  const [showCreateSplit, setShowCreateSplit] = useState(false);
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Form States
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitDesc, setNewSplitDesc] = useState('');
  const [newSplitCurrency, setNewSplitCurrency] = useState('₹');

  // Expense Form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitMethod, setExpSplitMethod] = useState('EQUAL'); // 'EQUAL', 'CUSTOM'
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});

  // Add Member Form
  const [memberTargetInput, setMemberTargetInput] = useState('');

  // Settlement Form
  const [settleToUser, setSettleToUser] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // Code-based Sharing & Joining States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalSplit, setShareModalSplit] = useState(null);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // Fetch all user splits & invitations
  const fetchSplitsData = useCallback(async () => {
    if (!userId) return;
    try {
      const [splitList, inviteList] = await Promise.all([
        api.getSplits().catch(() => []),
        api.getMySplitInvitations().catch(() => [])
      ]);
      setSplits(Array.isArray(splitList) ? splitList : []);
      setInvitations(Array.isArray(inviteList) ? inviteList : []);

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

  // Near-real-time polling interval (every 5 seconds when active)
  useEffect(() => {
    fetchSplitsData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchSplitsData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSplitsData]);

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
        ...created
      };

      setShowCreateSplit(false);
      setNewSplitName('');
      setNewSplitDesc('');
      if (showToast) showToast('Split created.', 'success');

      setSplits(prev => [fullCreated, ...prev]);
      setSelectedSplit(fullCreated);
    } catch (err) {
      const userMsg = (err?.status === 404 || err?.type === 'NOT_FOUND')
        ? 'Unable to create this Split. Please try again.'
        : (err?.message || 'Unable to create this Split. Please try again.');
      if (showToast) showToast(userMsg, 'error');
    } finally {
      setIsCreatingSplit(false);
    }
  };

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    if (!selectedSplit) return;
    setExpDesc('');
    setExpAmount('');
    setExpPaidBy(userId);
    setExpSplitMethod('EQUAL');
    setSelectedParticipants(selectedSplit.members.map(m => m.userId));
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
      // Custom Amount
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
      const refreshed = await api.getSplitById(selectedSplit.id);
      setSelectedSplit(refreshed);
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not add expense.', 'error');
    }
  };

  // Invite Member Handler
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!memberTargetInput.trim() || !selectedSplit) return;

    try {
      const res = await api.inviteSplitMember(selectedSplit.id, memberTargetInput.trim());
      setShowAddMember(false);
      setMemberTargetInput('');
      if (showToast) showToast(res.message || 'Invitation sent successfully!', 'success');
      const refreshed = await api.getSplitById(selectedSplit.id);
      setSelectedSplit(refreshed);
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not send invitation.', 'error');
    }
  };

  // Accept / Decline Invitation
  const handleAcceptInvite = async (token) => {
    try {
      await api.acceptSplitInvitation(token);
      if (showToast) showToast('Joined Split successfully!', 'success');
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not accept invitation.', 'error');
    }
  };

  const handleDeclineInvite = async (token) => {
    try {
      await api.declineSplitInvitation(token);
      if (showToast) showToast('Invitation declined.', 'info');
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not decline invitation.', 'error');
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
      const refreshed = await api.getSplitById(selectedSplit.id);
      setSelectedSplit(refreshed);
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
        setSelectedSplit(res.split);
      }
    } catch (err) {
      setJoinError(err.message || "Couldn't join the Split right now. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleShareSplit = (split) => {
    setShareModalSplit(split);
    setShowShareModal(true);
  };

  const handleCopyCode = async (codeToCopy) => {
    const code = codeToCopy || shareModalSplit?.shareCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      if (showToast) showToast('Split code copied to clipboard!', 'success');
    } catch (e) {
      if (showToast) showToast(`Share Code: ${code}`, 'info');
    }
  };

  const handleNativeShare = async (split) => {
    const code = split?.shareCode || shareModalSplit?.shareCode;
    if (!code) return;
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
    if (!shareModalSplit?.id) return;
    setRegeneratingCode(true);
    try {
      const res = await api.regenerateSplitCode(shareModalSplit.id);
      if (showToast) showToast('Share code regenerated successfully.', 'success');
      setShareModalSplit(prev => prev ? { ...prev, shareCode: res.shareCode } : prev);
      if (selectedSplit && selectedSplit.id === shareModalSplit.id) {
        setSelectedSplit(prev => prev ? { ...prev, shareCode: res.shareCode } : prev);
      }
      await fetchSplitsData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not regenerate code.', 'error');
    } finally {
      setRegeneratingCode(false);
    }
  };

  // Calculations for current selected split
  const membersMap = React.useMemo(() => {
    if (!selectedSplit?.members) return {};
    const map = {};
    selectedSplit.members.forEach(m => {
      map[m.userId] = m.userName || m.userEmail || `User ${m.userId.slice(-4)}`;
    });
    return map;
  }, [selectedSplit]);

  // Compute Net Balances & Simplified Settlements
  const { totalSpent, myNetBalance, memberBalances, suggestedSettlements } = React.useMemo(() => {
    if (!selectedSplit) return { totalSpent: 0, myNetBalance: 0, memberBalances: {}, suggestedSettlements: [] };

    const expenses = selectedSplit.expenses || [];
    const settlements = selectedSplit.settlements || [];
    const members = selectedSplit.members || [];

    let total = 0;
    const balances = {};
    members.forEach(m => { balances[m.userId] = 0; });

    // Process Expenses
    expenses.forEach(exp => {
      total += (exp.amount || 0);
      const paidBy = exp.paidByUserId;
      if (balances[paidBy] !== undefined) {
        balances[paidBy] += exp.amount;
      }
      (exp.participants || []).forEach(p => {
        if (balances[p.userId] !== undefined) {
          balances[p.userId] -= (p.owedAmount || 0);
        }
      });
    });

    // Process Completed Settlements
    settlements.forEach(s => {
      if (s.status === 'completed') {
        if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += s.amount;
        if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= s.amount;
      }
    });

    const myNet = balances[userId] || 0;

    // Debt Simplification Algorithm
    const debtors = [];  // net < 0
    const creditors = []; // net > 0

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

  return (
    <div className="page-container" style={{ maxWidth: '920px' }}>
      <PageHeaderRow title="Splits & Shared Expenses" />

      {/* Pending Invitations Banner */}
      {invitations.length > 0 && !selectedSplit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-md)' }}>
          {invitations.map(inv => (
            <div
              key={inv.id}
              className="glass-card animate-fade-in"
              style={{
                padding: '12px 16px', background: 'rgba(108, 99, 255, 0.12)',
                border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--accent-primary)" /> Invitation to join "{inv.splitName || 'Shared Split'}"
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Invited by {inv.inviterName || 'a DaySync user'}.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleAcceptInvite(inv.token)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--accent-success)', border: 'none' }}
                >
                  <CheckCircle2 size={14} /> Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineInvite(inv.token)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--accent-danger)' }}
                >
                  <XCircle size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW A: LIST OF USER SPLITS */}
      {!selectedSplit ? (
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

          {splits.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={44} color="var(--accent-primary)" style={{ margin: '0 auto 12px auto', opacity: 0.7 }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Split expenses with friends
              </h4>
              <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                Create a shared Split for trips, rent, or dining out to track shared expenses and settle balances easily.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateSplit(true)}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Create Split
                </button>
                <button
                  type="button"
                  onClick={handleOpenJoinModal}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
              {splits.map(split => {
                const memberCount = (split.members || []).length;
                const totalExp = (split.expenses || []).reduce((a, b) => a + (b.amount || 0), 0);

                return (
                  <div
                    key={split.id}
                    className="glass-card animate-fade-in"
                    onClick={() => setSelectedSplit(split)}
                    style={{
                      padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      gap: '12px', border: '1px solid var(--border-color)', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                          {split.name}
                        </h4>
                        {split.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {split.description}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-soft)', color: 'var(--accent-primary)'
                      }}>
                        {memberCount} Member{memberCount > 1 ? 's' : ''}
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
                        Open <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW B: SELECTED SPLIT DETAIL VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Back Header & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setSelectedSplit(null)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <ArrowLeft size={14} /> Back to All Splits
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <UserPlus size={14} /> Add Members
              </button>
              <button
                type="button"
                onClick={() => handleShareSplit(selectedSplit)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Share2 size={14} /> Share Invite Link
              </button>
            </div>
          </div>

          {/* Split Summary Header Card */}
          <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                  {selectedSplit.name}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Members: {(selectedSplit.members || []).map(m => m.userName || m.userEmail).join(' • ')}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Net Status</span>
                <div style={{
                  fontSize: '1.25rem', fontWeight: '800',
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
              paddingTop: '14px', borderTop: '1px solid var(--border-color)'
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
                  <Plus size={15} /> Add Shared Expense
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

          {/* Sub-Tabs: Expenses, Balances & Settlements, Members */}
          <div className="scroll-row" style={{ gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('expenses')}
              style={{
                padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'expenses' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'expenses' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'expenses' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              Expense History ({(selectedSplit.expenses || []).length})
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              style={{
                padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'balances' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'balances' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'balances' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              Balances & Settlements ({suggestedSettlements.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              style={{
                padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
                border: activeTab === 'members' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'members' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer'
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
                  No shared expenses logged in this Split yet. Tap <strong>+ Add Shared Expense</strong> to start!
                </div>
              ) : (
                (selectedSplit.expenses || []).map(exp => {
                  const paidByName = membersMap[exp.paidByUserId] || 'Member';
                  const myParticipant = (exp.participants || []).find(p => p.userId === userId);
                  const isPayer = exp.paidByUserId === userId;

                  return (
                    <div
                      key={exp.id}
                      className="glass-card animate-fade-in"
                      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {exp.description}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Paid by <strong>{isPayer ? 'You' : paidByName}</strong> • {selectedSplit.currency || '₹'}{exp.amount} total
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {isPayer ? (
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-success)' }}>
                            You lent {selectedSplit.currency || '₹'}{(exp.amount - (myParticipant?.owedAmount || 0)).toFixed(2)}
                          </div>
                        ) : myParticipant ? (
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-danger)' }}>
                            Your share: {selectedSplit.currency || '₹'}{myParticipant.owedAmount.toFixed(2)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not involved</div>
                        )}
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatDate(exp.date)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT 2: BALANCES & SIMPLIFIED SETTLEMENTS */}
          {activeTab === 'balances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Member Individual Balances */}
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

              {/* Simplified Settlement Plan */}
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
                              <CheckCircle2 size={14} /> Mark as Paid
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  Persistent Members ({(selectedSplit.members || []).length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  <UserPlus size={14} /> Add Member
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedSplit.members || []).map(m => (
                  <div
                    key={m.userId}
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
                        {(m.userName || m.userEmail || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {m.userName || m.userEmail} {m.userId === userId ? '(You)' : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.userEmail || 'DaySync Member'}</div>
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
                ))}
              </div>
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Create New Shared Split</h3>
            <form onSubmit={handleCreateSplit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Split Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, Flatmates, Dinner"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Optional Description</label>
                <input
                  type="text"
                  placeholder="e.g. Beach house & food expenses"
                  value={newSplitDesc}
                  onChange={(e) => setNewSplitDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  disabled={isCreatingSplit}
                  onClick={() => setShowCreateSplit(false)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSplit}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 16px', opacity: isCreatingSplit ? 0.7 : 1 }}
                >
                  {isCreatingSplit ? 'Creating...' : 'Create Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SHARED EXPENSE */}
      {showAddExpense && selectedSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Add Expense to "{selectedSplit.name}"
            </h3>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner, Fuel, Hotel"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
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
                  {selectedSplit.members.map(m => (
                    <option key={m.userId} value={m.userId}>
                      {m.userId === userId ? 'You' : (m.userName || m.userEmail)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Split Method</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setExpSplitMethod('EQUAL')}
                    className={expSplitMethod === 'EQUAL' ? 'btn-primary' : 'btn-secondary'}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpSplitMethod('CUSTOM')}
                    className={expSplitMethod === 'CUSTOM' ? 'btn-primary' : 'btn-secondary'}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    Custom Amounts
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Split Between Members</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {selectedSplit.members.map(m => {
                    const isChecked = selectedParticipants.includes(m.userId);
                    return (
                      <div
                        key={m.userId}
                        style={{
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants(prev => [...prev, m.userId]);
                              } else {
                                setSelectedParticipants(prev => prev.filter(id => id !== m.userId));
                              }
                            }}
                            style={{ accentColor: 'var(--accent-primary)' }}
                          />
                          <span>{m.userId === userId ? 'You' : (m.userName || m.userEmail)}</span>
                        </label>

                        {expSplitMethod === 'CUSTOM' && isChecked && (
                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={customAmounts[m.userId] || ''}
                            onChange={(e) => setCustomAmounts({ ...customAmounts, [m.userId]: e.target.value })}
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

      {/* MODAL 3: ADD / INVITE MEMBER */}
      {showAddMember && selectedSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Invite Member to "{selectedSplit.name}"
            </h3>

            <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>DaySync Email or Name</label>
                <input
                  type="text"
                  placeholder="e.g. bhoomi@daysync.ai or Rahul"
                  value={memberTargetInput}
                  onChange={(e) => setMemberTargetInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SETTLE UP */}
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
                  {selectedSplit.members.filter(m => m.userId !== userId).map(m => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName || m.userEmail}
                    </option>
                  ))}
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

      {/* MODAL 5: JOIN WITH CODE (COMPACT MOBILE FRIENDLY MODAL) */}
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

      {/* MODAL 6: SHARE CODE POPUP */}
      {showShareModal && shareModalSplit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Invite Friends</h3>
              <button type="button" onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share Code for "{shareModalSplit.name}"</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '3px', color: 'var(--accent-primary)', marginTop: '6px', userSelect: 'all' }}>
                {shareModalSplit.shareCode || 'GOA-7K4P2'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => handleCopyCode(shareModalSplit.shareCode)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '9px', gap: '6px' }}>
                Copy Code
              </button>
              <button type="button" onClick={() => handleNativeShare(shareModalSplit)} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '9px', gap: '6px' }}>
                Share
              </button>
            </div>

            {shareModalSplit.ownerId === userId && (
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={regeneratingCode}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} /> {regeneratingCode ? 'Regenerating...' : 'Regenerate Code'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
