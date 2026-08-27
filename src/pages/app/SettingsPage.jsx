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
  Key,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  Layers,
  Activity,
  Repeat,
  CreditCard,
  Users,
  Calendar,
  Globe,
  HelpCircle
} from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, theme, toggleTheme, logout, deleteAccount, updateUser } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
  const [dashboardRefresh, setDashboardRefresh] = useState(() => {
    return localStorage.getItem('daysync_dashboard_refresh') || 'auto';
  });
  const [refreshOnReturn, setRefreshOnReturn] = useState(() => {
    return localStorage.getItem('daysync_widget_refresh_on_return') !== 'false';
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

  const handleDashboardRefreshChange = (mode) => {
    setDashboardRefresh(mode);
    localStorage.setItem('daysync_dashboard_refresh', mode);
    if (showToast) showToast(`Dashboard refresh strategy set to ${mode}.`, 'info');
  };

  const handleToggleRefreshOnReturn = (val) => {
    setRefreshOnReturn(val);
    localStorage.setItem('daysync_widget_refresh_on_return', val ? 'true' : 'false');
    if (showToast) showToast(val ? 'Widget data will refresh when returning to Dashboard.' : 'Widget data reuse enabled on return.', 'info');
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

  const getUpdateStatusText = () => {
    if (checking) return 'Checking...';
    if (updateAvailable) return 'Update available';
    if (hasCheckedManually) return '✓ Up to date';
    if (fetchError) return 'Unable to check';
    return 'Not checked';
  };

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

        {/* 1. ACCOUNT SECTION */}
        <div ref={accountRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--accent-primary)" /> Account
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
            Manage your personal profile, verified credentials, and active account security.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-primary)',
                color: '#FFFFFF', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {user?.name || 'User'}
                  <button type="button" onClick={handleOpenChangeName} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '2px' }} title="Change Name">
                    <Edit2 size={13} />
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  {user?.email || 'user@daysync.app'}
                  <button type="button" onClick={handleOpenChangeEmail} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '2px' }} title="Change Email">
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
              <Edit2 size={14} style={{ flexShrink: 0 }} /> Change Name
            </button>
            <button type="button" onClick={handleOpenChangeEmail} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Mail size={14} style={{ flexShrink: 0 }} /> Change Email
            </button>
            <button type="button" onClick={handleOpenChangePassword} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Key size={14} style={{ flexShrink: 0 }} /> Change Password
            </button>
            <button type="button" onClick={() => setShowLogoutModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', minHeight: '38px', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <LogOut size={14} style={{ flexShrink: 0 }} /> Log Out
            </button>
          </div>
        </div>

        {/* 2. UPGRADE DAYSYNC SECTION */}
        <div ref={upgradeRef} className="glass-card" style={{ border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.08) 0%, rgba(18, 18, 26, 0.6) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '800' }}>
                <Sparkles size={18} color="var(--accent-primary)" /> Upgrade DaySync
              </h3>
              <p style={{ margin: '6px 0 12px 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Get more personalization and advanced DaySync experiences.
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <div>Current Plan: <strong style={{ color: 'var(--accent-success)' }}>Free</strong></div>
                <div>Available: <strong style={{ color: 'var(--accent-primary)' }}>DaySync Plus</strong></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              aria-label="View DaySync Plus plans"
            >
              <Zap size={14} /> View Plans
            </button>
          </div>
        </div>

        {/* 3. SYSTEM & FUNCTIONAL PREFERENCES */}
        <div ref={preferencesRef} className="glass-card">
          <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--accent-primary)" /> App & System Preferences
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Configure functional date, refresh, startup, timezone, and theme preferences across DaySync.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Theme Mode */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Theme Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Current: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{theme} Mode</strong></div>
              <button type="button" onClick={toggleTheme} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                {theme === 'dark' ? <Sun size={14} color="var(--accent-warning)" /> : <Moon size={14} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>

            {/* Dashboard Data Refresh */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Dashboard Data Refresh</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Strategy: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{dashboardRefresh}</strong></div>
              <select
                value={dashboardRefresh}
                onChange={(e) => handleDashboardRefreshChange(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="auto">Automatic (Background Sync)</option>
                <option value="manual">Manual Refresh Only</option>
              </select>
            </div>

            {/* Refresh Data on Return */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Refresh on Return</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Refresh widgets when returning to Dashboard</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={refreshOnReturn}
                  onChange={(e) => handleToggleRefreshOnReturn(e.target.checked)}
                />
                Enabled (Refetches stale data)
              </label>
            </div>

            {/* Startup Page */}
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

            {/* Week Start Day */}
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

            {/* Date Format */}
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

            {/* Confirm Before Deleting */}
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

            {/* Currency */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Currency</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Primary system currency</div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '700' }}>
                ₹ INR (Indian Rupee)
              </div>
            </div>

            {/* Language & Region */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>Language & Region</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>System language & locale</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                English (India • {detectedTimezoneName()})
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                More languages coming soon.
              </div>
            </div>
          </div>
        </div>

        {/* 4. DASHBOARD SECTION */}
        <div ref={dashboardRef} className="glass-card">
          <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={18} color="var(--accent-primary)" /> Dashboard Settings
          </h3>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Arrange, resize, add, or remove widgets anytime to make DaySync fit the way you use it.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Active Widgets: <strong style={{ color: 'var(--text-primary)' }}>{activeWidgetIds.length}</strong>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Layout: <strong style={{ color: 'var(--text-primary)' }}>Custom Arrangement</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setIsWidgetPickerOpen(true)} className="btn-primary" style={{ fontSize: '12.5px' }}>
              Manage Widgets
            </button>
            <button type="button" onClick={() => setShowDashboardResetModal(true)} className="btn-secondary" style={{ fontSize: '12.5px' }}>
              Reset Dashboard Layout
            </button>
          </div>
        </div>

        {/* 5. NOTIFICATIONS SECTION */}
        <div ref={notificationsRef} className="glass-card">
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

        {/* 6. LUNA SETTINGS SECTION */}
        <div ref={lunaRef} className="glass-card">
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

        {/* 7. PRIVACY & SECURITY SECTION */}
        <div ref={privacyRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-primary)" /> Privacy & Security
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
            Manage account protection, active browser sessions, and personal conversation privacy.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Security Summary</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email Verified • Password Protected • 1 Active Session</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: '700' }}>Protected</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button type="button" onClick={() => setShowClearHistoryModal(true)} className="btn-secondary" style={{ fontSize: '12px', color: 'var(--accent-danger)' }}>
                <Trash2 size={14} /> Clear Chat History
              </button>
            </div>
          </div>
        </div>

        {/* 8. APP / PWA SECTION */}
        <div ref={appRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="var(--accent-primary)" /> App & PWA Status
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Card 1 — Version */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '94px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Version</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>2.0.0</div>
            </div>

            {/* Card 2 — Update Status */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '94px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Update Status</div>
                <div style={{
                  fontSize: '13.5px', fontWeight: '700',
                  color: updateAvailable ? 'var(--accent-warning)' : (hasCheckedManually && !fetchError) ? 'var(--accent-success)' : 'var(--text-primary)'
                }}>
                  {getUpdateStatusText()}
                </div>
              </div>

              <div style={{ marginTop: '6px' }}>
                {updateAvailable ? (
                  <button
                    type="button"
                    onClick={updateApp}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    [ Update Now ]
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={checkForUpdates}
                    disabled={checking}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: '11.5px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: checking ? 0.7 : 1 }}
                  >
                    {checking ? 'Checking...' : 'Check for Updates ↻'}
                  </button>
                )}
              </div>
            </div>

            {/* Card 3 — Installation */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '94px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Installation</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-success)' }}>
                {isStandalone ? 'Installed (PWA)' : 'Browser Mode'}
              </div>
            </div>
          </div>
        </div>

        {/* 9. ABOUT DAYSYNC & HELP SECTION */}
        <div ref={aboutRef} className="glass-card">
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

      {/* 5. Upgrade Preview Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-primary)" /> DaySync Plus Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close upgrade preview modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Current Membership</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                Free Plan <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-success)' }}>(Active)</span>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(108, 99, 255, 0.08)', border: '1px solid var(--accent-primary)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>DaySync Plus</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)' }}>₹199 / month</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Enhanced capabilities for ultimate productivity and automated organization.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <div>✦ Unlimited executive widgets & layouts</div>
                <div>✦ Advanced Split debt simplification</div>
                <div>✦ Priority AI assistant response time</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowUpgradeModal(false)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 16px' }}>Close</button>
              <button type="button" disabled className="btn-primary" aria-label="Upgrade to DaySync Plus coming soon" style={{ fontSize: '12px', padding: '8px 16px', opacity: 0.8, cursor: 'not-allowed' }}>Coming Soon</button>
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
    </div>
  );
}
