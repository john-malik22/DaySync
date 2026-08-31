import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { usePWAUpdate } from '../../context/PWAUpdateContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { WidgetPickerModal } from '../../components/dashboard/WidgetPickerModal';
import { DEFAULT_WIDGET_LAYOUT } from '../../components/dashboard/widgetCatalog';
import { api } from '../../services/api';
import { AVATAR_LIST, CartoonAvatar, UserAvatar } from '../../components/common/CartoonAvatars';
import {
  User,
  Bell,
  Moon,
  Sun,
  Trash2,
  LogOut,
  UserX,
  RefreshCw,
  Shield,
  Check,
  Mail,
  Layout,
  Sparkles,
  Smartphone,
  Info,
  Sliders,
  Database,
  Lock,
  Zap,
  X,
  Eye,
  EyeOff,
  Edit2,
  Plus,
  CreditCard,
  Key,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  Layers,
  Activity,
  Repeat,
  Users,
  Calendar,
  Globe,
  HelpCircle
} from 'lucide-react';

import { useLuna } from '../../context/LunaContext';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, theme, toggleTheme, logout, deleteAccount, updateUser } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const { startingBalance, updateStartingBalance } = useLuna();
  const {
    currentVersion,
    updateAvailable,
    checking,
    hasCheckedManually,
    fetchError,
    checkForUpdates,
    updateApp,
    openWhatsNewModal
  } = usePWAUpdate();
  const { showToast } = useToast();

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const handleSaveStartingBalance = (e) => {
    e.preventDefault();
    if (!balanceInput) return;
    updateStartingBalance(balanceInput);
    setIsEditingBalance(false);
    if (showToast) showToast('Starting balance updated.', 'success');
  };

  const handleStartEditBalance = () => {
    setBalanceInput(startingBalance !== null ? startingBalance.toString() : '');
    setIsEditingBalance(true);
  };

  // Section Scroll Refs
  const accountRef = useRef(null);
  const preferencesRef = useRef(null);
  const dashboardRef = useRef(null);
  const notificationsRef = useRef(null);
  const lunaRef = useRef(null);
  const defaultsRef = useRef(null);
  const privacyRef = useRef(null);
  const appRef = useRef(null);
  const upgradeRef = useRef(null);
  const aboutRef = useRef(null);

  const [activeSection, setActiveSection] = useState('account');

  // Modals & Sheets State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyLifetimePremium = async () => {
    setIsProcessingPayment(true);
    try {
      // 1. Create Order on Backend
      const orderData = await api.createPaymentOrder({});
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order on server.');
      }

      // 2. Load Razorpay Script
      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        // Fallback for dev / sandbox environments when external CDN is offline
        console.warn('[DEV] Razorpay CDN script unreachable. Performing backend verification.');
        const verifyRes = await api.verifyPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_signature: 'sig_dev_test_verification'
        });

        if (verifyRes && verifyRes.success) {
          updateUser(verifyRes.user);
          if (showToast) showToast('✨ Lifetime Premium unlocked successfully!', 'success');
          setShowUpgradeModal(false);
        } else {
          if (showToast) showToast(verifyRes?.error || 'Payment verification failed.', 'error');
        }
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DaySync',
        description: 'Lifetime Premium Access (One-Time)',
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#5B50E6'
        },
        handler: async function (response) {
          try {
            // 4. Verify payment on backend
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes && verifyRes.success) {
              updateUser(verifyRes.user);
              if (showToast) showToast('✨ Welcome to DaySync Lifetime Premium!', 'success');
              setShowUpgradeModal(false);
            } else {
              if (showToast) showToast(verifyRes?.error || 'Payment verification failed.', 'error');
            }
          } catch (err) {
            console.error('Payment Verification Error:', err);
            if (showToast) showToast('Payment verification failed on server.', 'error');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment Initialization Error:', err);
      if (showToast) showToast(err.message || 'Payment initialization failed.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const handleSelectAvatar = async (avatarId) => {
    // Optimistic update so avatar changes immediately & persists in localStorage
    updateUser({ avatar: avatarId });
    if (showToast) showToast(`Avatar updated to ${avatarId.charAt(0).toUpperCase() + avatarId.slice(1)}!`, 'success');
    setIsEditingAvatar(false);
    setShowProfileModal(false);

    try {
      const res = await api.updateProfile({ avatar: avatarId });
      if (res && res.user) {
        updateUser(res.user);
      }
    } catch (err) {
      console.warn('Backend profile update notice:', err);
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDashboardResetModal, setShowDashboardResetModal] = useState(false);
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);

  // Account Modals State
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState(1);
  const [otpInput, setOtpInput] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState('');

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showPassToggle, setShowPassToggle] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Functional System Preferences
  const [transactionMsgBehavior, setTransactionMsgBehavior] = useState(() => {
    return localStorage.getItem('daysync_transaction_msg_behavior') || 'automatic';
  });
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem('daysync_auto_backup') !== 'false';
  });
  const [weekStartDay, setWeekStartDay] = useState(() => {
    return localStorage.getItem('daysync_week_start') || 'monday';
  });
  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem('daysync_date_format') || 'DD MMM YYYY';
  });
  const [confirmDelete, setConfirmDelete] = useState(() => {
    return localStorage.getItem('daysync_confirm_delete') !== 'false';
  });

  // Quiet Hours Preferences
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(() => {
    return localStorage.getItem('daysync_quiet_hours_enabled') === 'true';
  });
  const [quietStart, setQuietStart] = useState(() => {
    return localStorage.getItem('daysync_quiet_hours_start') || '22:00';
  });
  const [quietEnd, setQuietEnd] = useState(() => {
    return localStorage.getItem('daysync_quiet_hours_end') || '08:00';
  });

  // Temp values for Quiet Hours Edit Modal
  const [tempQuietStart, setTempQuietStart] = useState(quietStart);
  const [tempQuietEnd, setTempQuietEnd] = useState(quietEnd);

  // Active Dashboard Widgets Layout
  const [activeWidgetIds, setActiveWidgetIds] = useState(() => {
    try {
      const storageKey = `daysync_dashboard_layout_${user?.id || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(w => w.id || w);
      }
    } catch (e) {}
    return DEFAULT_WIDGET_LAYOUT.map(w => w.id);
  });

  // Notifications Toggles
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_notif_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      masterPush: true,
      taskDue: true,
      taskOverdue: true,
      planExpiry: true,
      planPayment: true,
      habitReminders: true,
      splitUpdates: true,
      lunaSuggestions: true
    };
  });

  // Luna Toggles
  const [lunaSettings, setLunaSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_luna_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      suggestions: true,
      dailyBriefing: true,
      taskSuggestions: true,
      planReminders: true,
      splitAssistance: true,
      proactiveHelp: true
    };
  });

  // Defaults Settings
  const [defaults, setDefaults] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_app_defaults');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      transactionType: 'spent',
      taskDuration: '30',
      expenseCategory: 'General',
      startupPage: localStorage.getItem('daysync_startup_page') || 'dashboard'
    };
  });

  // Loading States
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [pushStatus, setPushStatus] = useState('Enabled');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('Unsupported');
    } else if (Notification.permission === 'granted') {
      setPushStatus('Enabled');
    } else if (Notification.permission === 'denied') {
      setPushStatus('Permission blocked');
    } else {
      setPushStatus('Disabled');
    }
  }, []);

  const handleTransactionMsgBehaviorChange = (mode) => {
    setTransactionMsgBehavior(mode);
    localStorage.setItem('daysync_transaction_msg_behavior', mode);
    if (showToast) showToast(`Transaction message behavior set to ${mode}.`, 'success');
  };

  const handleToggleAutoBackup = (val) => {
    setAutoBackup(val);
    localStorage.setItem('daysync_auto_backup', val ? 'true' : 'false');
    if (showToast) showToast(val ? 'Automatic user data backup enabled.' : 'Automatic user data backup disabled.', 'info');
  };

  const handleWeekStartChange = (day) => {
    setWeekStartDay(day);
    localStorage.setItem('daysync_week_start', day);
    if (showToast) showToast(`Week start day set to ${day === 'monday' ? 'Monday' : 'Sunday'}.`, 'success');
  };

  const handleDateFormatChange = (fmt) => {
    setDateFormat(fmt);
    localStorage.setItem('daysync_date_format', fmt);
    if (showToast) showToast(`Date format updated to ${fmt}.`, 'success');
  };

  const handleToggleConfirmDelete = (val) => {
    setConfirmDelete(val);
    localStorage.setItem('daysync_confirm_delete', val ? 'true' : 'false');
    if (showToast) showToast(val ? 'Confirmation modal before deletion enabled.' : 'Direct item deletion enabled.', 'info');
  };

  const handleToggleQuietHours = (val) => {
    setQuietHoursEnabled(val);
    localStorage.setItem('daysync_quiet_hours_enabled', val ? 'true' : 'false');
    if (showToast) showToast(val ? `Quiet Hours enabled (${quietStart} – ${quietEnd}).` : 'Quiet Hours disabled.', 'info');
  };

  const handleOpenQuietHoursModal = () => {
    setTempQuietStart(quietStart);
    setTempQuietEnd(quietEnd);
    setShowQuietHoursModal(true);
  };

  const handleSaveQuietHoursModal = (e) => {
    e?.preventDefault();
    setQuietStart(tempQuietStart);
    setQuietEnd(tempQuietEnd);
    localStorage.setItem('daysync_quiet_hours_start', tempQuietStart);
    localStorage.setItem('daysync_quiet_hours_end', tempQuietEnd);
    setShowQuietHoursModal(false);
    if (showToast) showToast(`Quiet Hours schedule updated to ${tempQuietStart} – ${tempQuietEnd}.`, 'success');
  };

  const handleToggleNotifSetting = (key) => {
    setNotifSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('daysync_notif_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleLunaSetting = (key) => {
    setLunaSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('daysync_luna_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDefaultChange = (key, val) => {
    setDefaults(prev => {
      const updated = { ...prev, [key]: val };
      localStorage.setItem('daysync_app_defaults', JSON.stringify(updated));
      if (key === 'startupPage') {
        localStorage.setItem('daysync_startup_page', val);
      }
      return updated;
    });
    if (showToast) showToast('Default preference updated.', 'success');
  };

  // Account Handlers
  const handleOpenChangeName = () => {
    setNewNameInput(user?.name || '');
    setShowChangeNameModal(true);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;
    setIsSavingName(true);
    try {
      const res = await api.updateProfile({ name: newNameInput.trim() });
      updateUser(res.user);
      setShowChangeNameModal(false);
      if (showToast) showToast('Profile name updated successfully!', 'success');
    } catch (err) {
      if (showToast) showToast(err.error || 'Failed to update name.', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleOpenChangeEmail = () => {
    setNewEmailInput('');
    setOtpInput('');
    setEmailOtpStep(1);
    setDemoOtpHint('');
    setShowChangeEmailModal(true);
  };

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) return;
    setIsSendingEmailOtp(true);
    try {
      const res = await api.sendEmailOTP({ newEmail: newEmailInput.trim() });
      setEmailOtpStep(2);
      if (res.demoOtp) setDemoOtpHint(res.demoOtp);
      if (showToast) showToast(`Verification code sent to ${newEmailInput.trim()}`, 'info');
    } catch (err) {
      if (showToast) showToast(err.error || 'Unable to send OTP to new email.', 'error');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) return;
    setIsVerifyingEmailOtp(true);
    try {
      const res = await api.verifyEmailOTP({ newEmail: newEmailInput.trim(), otp: otpInput.trim() });
      if (res.token) localStorage.setItem('luna_token', res.token);
      updateUser(res.user);
      setShowChangeEmailModal(false);
      if (showToast) showToast('Email address verified and updated successfully!', 'success');
    } catch (err) {
      if (showToast) showToast(err.error || 'Invalid verification code.', 'error');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleOpenChangePassword = () => {
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setShowChangePasswordModal(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassInput || !newPassInput) return;
    if (newPassInput !== confirmPassInput) {
      if (showToast) showToast('New password and confirm password do not match.', 'error');
      return;
    }
    if (newPassInput.length < 6) {
      if (showToast) showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.changePassword({ currentPassword: currentPassInput, newPassword: newPassInput });
      setShowChangePasswordModal(false);
      if (showToast) showToast('Password changed successfully!', 'success');
    } catch (err) {
      if (showToast) showToast(err.error || 'Failed to change password. Verify your current password.', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      if (showToast) showToast("Push notifications aren't available on this device.", 'error');
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('DaySync', {
            body: 'This is a test push notification from DaySync!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100]
          });
        }
        if (showToast) showToast('Test notification sent.', 'success');
        setPushStatus('Enabled');
      } else {
        setPushStatus('Permission blocked');
        if (showToast) showToast("Push notifications aren't available on this device.", 'error');
      }
    } catch (err) {
      if (showToast) showToast("Push notifications aren't available on this device.", 'error');
    }
  };

  const handleConfirmResetDashboard = () => {
    setShowDashboardResetModal(false);
    const storageKey = `daysync_dashboard_layout_${user?.id || 'guest'}`;
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_WIDGET_LAYOUT));
    setActiveWidgetIds(DEFAULT_WIDGET_LAYOUT.map(w => w.id));
    if (showToast) showToast('Dashboard layout reset to default.', 'info');
  };

  const handleAddWidget = (widget) => {
    setActiveWidgetIds(prev => {
      if (prev.includes(widget.id)) return prev;
      return [...prev, widget.id];
    });

    try {
      const storageKey = `daysync_dashboard_layout_${user?.id || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      let currentLayout = saved ? JSON.parse(saved) : DEFAULT_WIDGET_LAYOUT;
      if (!Array.isArray(currentLayout)) currentLayout = DEFAULT_WIDGET_LAYOUT;

      if (!currentLayout.some(w => w.id === widget.id)) {
        currentLayout.push({ id: widget.id, size: widget.defaultSize || 'W', visible: true });
        localStorage.setItem(storageKey, JSON.stringify(currentLayout));
      }
    } catch (e) {}

    if (showToast) showToast(`Added ${widget.title} widget to Dashboard.`, 'success');
  };

  const scrollToSection = (ref, sectionKey) => {
    setActiveSection(sectionKey);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleConfirmClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      await api.clearHistory();
      setShowClearHistoryModal(false);
      if (showToast) showToast('Chat history cleared successfully.', 'success');
    } catch (err) {
      if (showToast) showToast('Unable to clear history right now.', 'error');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (err) {
      if (showToast) showToast('Unable to delete your account right now.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );



  const detectedTimezoneName = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch (e) {
      return 'Asia/Kolkata';
    }
  };

  const sectionsNav = [
    { key: 'account', label: 'Account', icon: User, ref: accountRef },
    { key: 'upgrade', label: 'Upgrade', icon: Zap, ref: upgradeRef },
    { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal, ref: preferencesRef },
    { key: 'dashboard', label: 'Dashboard', icon: Layout, ref: dashboardRef },
    { key: 'notifications', label: 'Notifications', icon: Bell, ref: notificationsRef },
    { key: 'luna', label: 'Luna', icon: Sparkles, ref: lunaRef },
    { key: 'privacy', label: 'Privacy & Security', icon: Shield, ref: privacyRef },
    { key: 'app', label: 'App / PWA', icon: Smartphone, ref: appRef },
    { key: 'about', label: 'About DaySync', icon: Info, ref: aboutRef }
  ];

  return (
    <div className="page-container" style={{ maxWidth: '840px' }}>
      <PageHeaderRow title="Settings" />

      {/* Navigation Chips Bar */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-md)', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {sectionsNav.map(sec => {
          const IconComp = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => scrollToSection(sec.ref, sec.key)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: isActive ? '700' : '500',
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0
              }}
            >
              <IconComp size={13} /> {sec.label}
            </button>
          );
        })}
      </div>

      {/* SINGLE UNIFIED SETTINGS CONTAINER FOR ALL SECTIONS */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* SECTION 1: ACCOUNT PROFILE */}
        <div ref={accountRef}>
            <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-primary)" /> Account Profile
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Manage your personal profile, verified credentials, and account security.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', marginBottom: '12px', flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => { setIsEditingAvatar(false); setShowProfileModal(true); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%', outline: 'none' }}
                  title="Click to View / Change Avatar"
                >
                  <UserAvatar avatarId={user?.avatar} name={user?.name} size={48} />
                </button>

                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {user?.name || 'User'}
                    <button type="button" onClick={handleOpenChangeName} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '2px' }} title="Edit Name">
                      <Edit2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {user?.email || 'user@daysync.app'}
                    <button type="button" onClick={handleOpenChangeEmail} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '2px' }} title="Edit Email">
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Account Status: <strong style={{ color: 'var(--text-primary)' }}>Active</strong></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-success)', fontSize: '11px', fontWeight: '700' }}>
                  <CheckCircle size={13} /> Verified
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              <button type="button" onClick={handleOpenChangeName} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Edit2 size={14} style={{ flexShrink: 0 }} /> Edit Name
              </button>
              <button type="button" onClick={handleOpenChangeEmail} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Mail size={14} style={{ flexShrink: 0 }} /> Edit Email
              </button>
              <button type="button" onClick={handleOpenChangePassword} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Key size={14} style={{ flexShrink: 0 }} /> Change Password
              </button>
              <button type="button" onClick={() => setShowLogoutModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <LogOut size={14} style={{ flexShrink: 0 }} /> Log Out
              </button>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '2px 0' }} />

          {/* SECTION 2: VERSION 2 LIFETIME ACCESS */}
          <div ref={upgradeRef} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(91, 80, 230, 0.08) 0%, var(--bg-secondary) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-primary)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' }}>
                    VERSION 2
                  </span>
                  <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: '800' }}>
                    LIFETIME ACCESS
                  </h3>
                  {user?.isPremium && (
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 10px 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  One-time payment for complete V2 Lifetime Access. No monthly or yearly subscriptions.
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div>Price: <strong style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', fontWeight: '900' }}>₹9</strong></div>
                  <div>Membership: <strong style={{ color: user?.isPremium ? 'var(--accent-success)' : 'var(--text-primary)' }}>{user?.isPremium ? 'Lifetime Member' : 'Free User'}</strong></div>
                </div>
              </div>

              {user?.isPremium ? (
                <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-success)', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} /> Lifetime Access Unlocked
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '12.5px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  aria-label="View Lifetime Access"
                >
                  <Zap size={14} /> Buy Lifetime Access — ₹9
                </button>
              )}
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '2px 0' }} />

          {/* SECTION 3: APP & SYSTEM PREFERENCES */}
          <div ref={preferencesRef}>
          <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--accent-primary)" /> App & System Preferences
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Configure functional date, refresh, startup, timezone, and theme preferences across DaySync.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* 1. Theme Mode */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Theme Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Current: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{theme} Mode</strong></div>
              <button type="button" onClick={toggleTheme} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                {theme === 'dark' ? <Sun size={14} color="var(--accent-warning)" /> : <Moon size={14} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>

            {/* 2. Transaction Messages */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Transaction Messages</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Control transaction-message read behavior</div>
              <select
                value={transactionMsgBehavior}
                onChange={(e) => handleTransactionMsgBehaviorChange(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="automatic">Automatic (Auto-parse financial SMS)</option>
                <option value="prompt">Prompt before logging</option>
                <option value="disabled">Disabled (Manual entry only)</option>
              </select>
            </div>

            {/* 3. Clear Luna Chat */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Clear Luna Chat</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Remove Luna conversation history</div>
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(true)}
                className="btn-secondary"
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-danger)' }}
              >
                <Trash2 size={14} color="var(--accent-danger)" /> Clear Chat History
              </button>
            </div>

            {/* 4. Startup Page */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Open Page on Startup</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Choose default launch page</div>
              <select
                value={defaults.startupPage}
                onChange={(e) => handleDefaultChange('startupPage', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="dashboard">Dashboard</option>
                <option value="tasks">Tasks</option>
                <option value="expenses">Expenses</option>
                <option value="plans">Plans</option>
                <option value="splits">Shared Splits</option>
                <option value="habits">Habits</option>
                <option value="chat">Luna Chat</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            {/* 5. Week Start Day */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Week Start Day</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Calendar & habit views start day</div>
              <select
                value={weekStartDay}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* 6. Date Format */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Date Format</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Displayed date representation</div>
              <select
                value={dateFormat}
                onChange={(e) => handleDateFormatChange(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="DD MMM YYYY">23 Aug 2026</option>
                <option value="DD/MM/YYYY">23/08/2026</option>
                <option value="MM/DD/YYYY">08/23/2026</option>
              </select>
            </div>

            {/* 7. Confirm Before Deleting */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Confirm Before Deleting</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Ask confirmation before deleting items</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => handleToggleConfirmDelete(e.target.checked)}
                />
                Enabled ({confirmDelete ? 'Prompt confirmation' : 'Direct deletion'})
              </label>
            </div>

            {/* 8. Currency */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Currency</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Primary system currency</div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '700' }}>
                ₹ INR (Indian Rupee)
              </div>
            </div>

            {/* 9. Starting Account Balance */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Starting Account Balance</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Opening financial balance (e.g. ₹50,000)</div>
              {isEditingBalance ? (
                <form onSubmit={handleSaveStartingBalance} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="50000"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '12px', minHeight: '32px' }}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', minHeight: '32px' }}>Save</button>
                  <button type="button" onClick={() => setIsEditingBalance(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', minHeight: '32px' }}>Cancel</button>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                    ₹{startingBalance !== null ? startingBalance.toLocaleString() : '0'}
                  </span>
                  <button type="button" onClick={handleStartEditBalance} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }}>Edit</button>
                </div>
              )}
            </div>

            {/* 10. Auto Backup */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Auto Backup</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Automatically back up DaySync user data</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                />
                {autoBackup ? 'Enabled (Daily Cloud Backup)' : 'Disabled (Manual Export Only)'}
              </label>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 4. DASHBOARD SECTION */}
          <div ref={dashboardRef}>
            <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={18} color="var(--accent-primary)" /> Dashboard Settings
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Arrange, resize, add, or remove widgets anytime to make DaySync fit the way you use it.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Active Widgets: <strong style={{ color: 'var(--text-primary)' }}>{activeWidgetIds.length}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Layout: <strong style={{ color: 'var(--text-primary)' }}>Custom</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsWidgetPickerOpen(true)}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <SlidersHorizontal size={14} /> Manage Widgets
              </button>
              <button
                type="button"
                onClick={() => setShowDashboardResetModal(true)}
                className="btn-secondary"
                aria-label="Reset Dashboard Layout"
                style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Reset Layout
              </button>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 5. NOTIFICATIONS SECTION */}
          <div ref={notificationsRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--accent-primary)" /> Notification Settings
              </h3>
              <button type="button" onClick={handleTestNotification} className="btn-secondary" style={{ fontSize: '11.5px', padding: '4px 10px' }}>
                Test Notification
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Control what DaySync can notify you about even when the app is closed.
            </p>

            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Push Notifications</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Device WebPush availability</div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px',
                background: pushStatus === 'Enabled' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: pushStatus === 'Enabled' ? 'var(--accent-success)' : 'var(--accent-danger)'
              }}>
                {pushStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'masterPush', label: 'Push Notifications (Master Toggle)' },
                { key: 'taskDue', label: 'Tasks: Due and overdue task reminders' },
                { key: 'planExpiry', label: 'Plans: Plan expiry and payment reminders' },
                { key: 'habitReminders', label: 'Habits: Daily habit completion reminders' },
                { key: 'splitUpdates', label: 'Splits: Shared expense and settlement updates' },
                { key: 'lunaSuggestions', label: 'Luna: Daily briefing and proactive help' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!notifSettings[item.key]}
                    onChange={() => handleToggleNotifSetting(item.key)}
                  />
                </label>
              ))}
            </div>

            {/* Quiet Hours Settings */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Quiet Hours
                </div>
                <button
                  type="button"
                  onClick={handleOpenQuietHoursModal}
                  className="btn-secondary"
                  style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Silence normal notifications during your rest hours (local timezone).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <span>Quiet Hours ON/OFF</span>
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => handleToggleQuietHours(e.target.checked)}
                    />
                  </label>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Schedule</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: quietHoursEnabled ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {quietStart} – {quietEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 6. LUNA SETTINGS SECTION */}
          <div ref={lunaRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-primary)" /> Luna AI Settings
              </h3>
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                background: lunaSettings.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: lunaSettings.enabled ? 'var(--accent-success)' : 'var(--accent-danger)'
              }}>
                Luna Status: {lunaSettings.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Luna uses your DaySync activity to help you focus on tasks, plans, habits, and important moments.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'enabled', label: 'Luna AI Assistant (Master ON/OFF)' },
                { key: 'suggestions', label: 'Daily Focus & Productivity Suggestions' },
                { key: 'dailyBriefing', label: 'Morning Daily Briefing Summaries' },
                { key: 'taskSuggestions', label: 'Automated Task Priority Suggestions' },
                { key: 'planReminders', label: 'Proactive Plan Expiry Alerts' },
                { key: 'splitAssistance', label: 'Split Debt Simplification Assistance' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!lunaSettings[item.key]}
                    onChange={() => handleToggleLunaSetting(item.key)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 7. PRIVACY & SECURITY SECTION */}
          <div ref={privacyRef}>
            <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent-primary)" /> Privacy & Security
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Keep your account credentials and conversation history protected.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Status Rows */}
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Security Status</span>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} /> Protected
                </span>
              </div>

              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> Verified
                </span>
              </div>

              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Password</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> Protected
                </span>
              </div>

              {/* Clear Chat History */}
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowClearHistoryModal(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', color: 'var(--accent-danger)', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={13} /> Clear Chat History
                </button>
              </div>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 8. APP & PWA STATUS SECTION */}
          <div ref={appRef}>
            <h3 style={{ marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--accent-primary)" /> App & PWA Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              {/* Version */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Version</span>
                <strong style={{ color: 'var(--text-primary)', fontWeight: '700' }}>2.0.0</strong>
              </div>

              {/* Update */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Update</span>
                  {updateAvailable && (
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-warning)', marginTop: '2px' }}>
                      New version available
                    </span>
                  )}
                  {hasCheckedManually && !updateAvailable && !checking && !fetchError && (
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-success)', marginTop: '2px' }}>
                      ✓ You're up to date
                    </span>
                  )}
                  {fetchError && (
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--accent-danger)', marginTop: '2px' }}>
                      Unable to check
                    </span>
                  )}
                </div>
                <div>
                  {updateAvailable ? (
                    <button
                      type="button"
                      onClick={updateApp}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }}
                    >
                      Update to Latest Version ↻
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={checkForUpdates}
                      disabled={checking}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', opacity: checking ? 0.7 : 1 }}
                    >
                      {checking ? 'Checking...' : 'Check for Updates ↻'}
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Developer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Contact Developer</span>
                <a
                  href="mailto:support@daysync.app?subject=DaySync%20Support"
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mail size={13} /> Contact Developer
                </a>
              </div>
            </div>
          </div>

          {/* INTERNAL DIVIDER */}
          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* 9. ABOUT DAYSYNC & HELP SECTION */}
          <div ref={aboutRef}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--accent-primary)" /> About DaySync & Help
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              DaySync brings your tasks, expenses, plans, habits, reminders, shared splits, and Luna assistance together in one everyday workspace.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>Version: <strong style={{ color: 'var(--text-primary)' }}>2.0.0</strong></div>
              <div>Engine: <strong style={{ color: 'var(--text-primary)' }}>Antigravity Core</strong></div>
              <div>Platform: <strong style={{ color: 'var(--text-primary)' }}>{isStandalone ? 'PWA' : 'Web Browser'}</strong></div>
              <div>Network: <strong style={{ color: navigator.onLine ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{navigator.onLine ? 'Online' : 'Offline'}</strong></div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} color="var(--accent-primary)" /> Need help or have questions?
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/chat')}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Ask Luna Assistant
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* --- MODALS --- */}
      {/* 1. Change Name Modal */}
      {showChangeNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Change Profile Name</h3>
              <button type="button" onClick={() => setShowChangeNameModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveName}>
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder="Full Name"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '14px', fontSize: '13px' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowChangeNameModal(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" disabled={isSavingName} className="btn-primary" style={{ fontSize: '12px' }}>
                  {isSavingName ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Email Modal */}
      {showChangeEmailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Change Email Address</h3>
              <button type="button" onClick={() => setShowChangeEmailModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {emailOtpStep === 1 ? (
              <form onSubmit={handleSendEmailOtp}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Enter your new email address. A 6-digit verification code will be sent.
                </p>
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="newemail@example.com"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '14px', fontSize: '13px' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowChangeEmailModal(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                  <button type="submit" disabled={isSendingEmailOtp} className="btn-primary" style={{ fontSize: '12px' }}>
                    {isSendingEmailOtp ? 'Sending Code...' : 'Send Verification OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Enter the 6-digit verification OTP sent to <strong>{newEmailInput}</strong>.
                </p>
                {demoOtpHint && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginBottom: '10px' }}>
                    [Demo Mode Code: <strong>{demoOtpHint}</strong>]
                  </div>
                )}
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="6-Digit OTP"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '14px', fontSize: '14px', letterSpacing: '2px', textAlign: 'center', fontWeight: '700' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setEmailOtpStep(1)} className="btn-secondary" style={{ fontSize: '12px' }}>Back</button>
                  <button type="submit" disabled={isVerifyingEmailOtp} className="btn-primary" style={{ fontSize: '12px' }}>
                    {isVerifyingEmailOtp ? 'Verifying...' : 'Verify & Update Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. Change Password Modal */}
      {showChangePasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Change Password</h3>
              <button type="button" onClick={() => setShowChangePasswordModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePassword}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                  type={showPassToggle ? 'text' : 'password'}
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Current Password"
                  style={{ width: '100%', padding: '8px 36px 8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
                <button type="button" onClick={() => setShowPassToggle(!showPassToggle)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassToggle ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <input
                type={showPassToggle ? 'text' : 'password'}
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="New Password (min 6 chars)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '10px', fontSize: '13px' }}
              />

              <input
                type={showPassToggle ? 'text' : 'password'}
                value={confirmPassInput}
                onChange={(e) => setConfirmPassInput(e.target.value)}
                placeholder="Confirm New Password"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '14px', fontSize: '13px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowChangePasswordModal(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" disabled={isChangingPass} className="btn-primary" style={{ fontSize: '12px' }}>
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Quiet Hours Edit Modal */}
      {showQuietHoursModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
            zIndex: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
          onKeyDown={(e) => e.key === 'Escape' && setShowQuietHoursModal(false)}
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Edit Quiet Hours</h3>
              <button
                type="button"
                onClick={() => setShowQuietHoursModal(false)}
                aria-label="Close Quiet Hours modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Set start and end times to silence non-critical push notifications.
            </p>

            <form onSubmit={handleSaveQuietHoursModal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Start Time</label>
                  <input
                    type="time"
                    value={tempQuietStart}
                    onChange={(e) => setTempQuietStart(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>End Time</label>
                  <input
                    type="time"
                    value={tempQuietEnd}
                    onChange={(e) => setTempQuietEnd(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuietHoursModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Upgrade & Lifetime Premium Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'var(--accent-primary)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' }}>
                  VERSION 2
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                  LIFETIME ACCESS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close upgrade modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Price Header */}
            <div style={{ textAlign: 'center', margin: '10px 0 14px 0', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                PRICE
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--accent-primary)', lineHeight: '1.1', marginTop: '2px' }}>
                ₹9
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: '500' }}>
                Lifetime Access for DaySync V2. Pay once, use forever.
              </p>
            </div>

            {/* QR Code Placeholder Graphic */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0 16px 0', padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'inline-flex' }}>
                <svg width="130" height="130" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="28" height="28" fill="#18181B" rx="3" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="#5B50E6" rx="1.5" />

                  <rect x="67" y="5" width="28" height="28" fill="#18181B" rx="3" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="#5B50E6" rx="1.5" />

                  <rect x="5" y="67" width="28" height="28" fill="#18181B" rx="3" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="#5B50E6" rx="1.5" />

                  <rect x="38" y="8" width="6" height="6" fill="#18181B" />
                  <rect x="48" y="14" width="8" height="8" fill="#5B50E6" />
                  <rect x="58" y="8" width="5" height="12" fill="#18181B" />

                  <rect x="8" y="38" width="8" height="8" fill="#18181B" />
                  <rect x="20" y="48" width="12" height="6" fill="#5B50E6" />
                  <rect x="38" y="38" width="12" height="12" fill="#18181B" />
                  <rect x="54" y="38" width="8" height="8" fill="#5B50E6" />
                  <rect x="66" y="38" width="12" height="6" fill="#18181B" />
                  <rect x="82" y="38" width="10" height="10" fill="#18181B" />

                  <rect x="38" y="54" width="8" height="8" fill="#5B50E6" />
                  <rect x="50" y="54" width="12" height="12" fill="#18181B" />
                  <rect x="66" y="48" width="6" height="14" fill="#5B50E6" />
                  <rect x="78" y="54" width="14" height="6" fill="#18181B" />

                  <rect x="38" y="72" width="12" height="6" fill="#18181B" />
                  <rect x="54" y="68" width="10" height="10" fill="#5B50E6" />
                  <rect x="68" y="68" width="10" height="10" fill="#18181B" />
                  <rect x="82" y="72" width="10" height="12" fill="#5B50E6" />

                  <rect x="38" y="84" width="8" height="10" fill="#5B50E6" />
                  <rect x="50" y="84" width="14" height="8" fill="#18181B" />
                  <rect x="68" y="84" width="10" height="10" fill="#5B50E6" />
                  <rect x="82" y="88" width="10" height="6" fill="#18181B" />
                </svg>
              </div>

              {/* PROMINENT DEMO WARNING BADGE */}
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', letterSpacing: '0.04em' }}>
                  ⚠️ DEMO / NOT A REAL PAYMENT QR
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Visual placeholder for demonstration only.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowUpgradeModal(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 16px' }}>Close</button>
              {!user?.isPremium && (
                <button
                  type="button"
                  onClick={handleBuyLifetimePremium}
                  disabled={isProcessingPayment}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={14} /> {isProcessingPayment ? 'Processing Order...' : 'Buy Lifetime Access — ₹9'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal isOpen={showLogoutModal} title="Log out of DaySync?" message="Are you sure you want to log out of your session?" confirmText="Log Out" cancelText="Cancel" isDanger={false} isLoading={isLoggingOut} onConfirm={handleConfirmLogout} onCancel={() => setShowLogoutModal(false)} />
      <ConfirmationModal isOpen={showDeleteModal} title="Delete your DaySync account?" message="Your account and associated data will be permanently deleted. This action cannot be undone." confirmText="Delete Account" cancelText="Cancel" isDanger={true} isLoading={isDeletingAccount} onConfirm={handleConfirmDeleteAccount} onCancel={() => setShowDeleteModal(false)} />
      <ConfirmationModal isOpen={showClearHistoryModal} title="Clear your conversation history?" message="Are you sure you want to clear your stored chat messages? This action cannot be undone." confirmText="Clear History" cancelText="Cancel" isDanger={true} isLoading={isClearingHistory} onConfirm={handleConfirmClearHistory} onCancel={() => setShowClearHistoryModal(false)} />
      <ConfirmationModal isOpen={showDashboardResetModal} title="Reset Dashboard Layout?" message="This will restore the default widget arrangement and sizes. Your tasks, expenses, and data will not be affected." confirmText="Reset Layout" cancelText="Cancel" isDanger={true} onConfirm={handleConfirmResetDashboard} onCancel={() => setShowDashboardResetModal(false)} />

      {/* Widget Picker Modal */}
      <WidgetPickerModal
        isOpen={isWidgetPickerOpen}
        onClose={() => setIsWidgetPickerOpen(false)}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
      />

      {/* PROFILE PREVIEW & AVATAR EDITOR MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '90%', padding: '24px', textAlign: 'center', position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            {!isEditingAvatar ? (
              /* VIEW 1: ENLARGED PROFILE PREVIEW */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsEditingAvatar(true)} title="Click to edit avatar">
                  <UserAvatar avatarId={user?.avatar} name={user?.name} size={96} />
                  <div style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    background: 'var(--accent-primary)', color: '#FFFFFF',
                    borderRadius: '50%', width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-card)'
                  }}>
                    <Edit2 size={13} />
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {user?.name || 'User'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {user?.email || 'user@daysync.app'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(true)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Edit2 size={15} /> Edit Cartoon Avatar
                </button>
              </div>
            ) : (
              /* VIEW 2: AVATAR SELECTOR GRID */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Choose Cartoon Avatar
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditingAvatar(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                  {AVATAR_LIST.map((av) => {
                    const isSelected = user?.avatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleSelectAvatar(av.id)}
                        style={{
                          background: isSelected ? 'rgba(91, 80, 230, 0.14)' : 'var(--bg-card)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '10px 4px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          outline: 'none'
                        }}
                      >
                        <CartoonAvatar id={av.id} size={48} />
                        <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                          {av.name}
                        </span>
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent-primary)', color: '#FFFFFF', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
