import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';
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
  HelpCircle,
  Download,
  Upload,
  MessageSquare,
  Wrench,
  DollarSign
} from 'lucide-react';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <div style={{ flex: 1, paddingRight: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>}
      </div>

      <div style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary, rgba(255,255,255,0.15))',
        border: '1px solid var(--border-color)',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s ease',
        flexShrink: 0
      }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, theme, toggleTheme, logout, deleteAccount, updateUser } = useAuth();
  const {
    preferences,
    updatePreferences,
    pushSupported,
    pushPermission,
    pushEnabled,
    pushLoading,
    enablePush,
    disablePush
  } = useNotifications();
  const { tasks, expenses, memories, startingBalance, updateStartingBalance, refreshData, clearChatHistory } = useLuna();
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

  // Data Export & Restore State
  const [restorePayload, setRestorePayload] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const restoreFileInputRef = useRef(null);

  // 1. Export Data Handler
  const handleExportData = () => {
    try {
      const exportData = {
        app: 'DaySync',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        userProfile: {
          id: user?.id || 'user',
          name: user?.name || 'DaySync User',
          email: user?.email || '',
          avatar: user?.avatar || 'dog'
        },
        tasks: tasks || [],
        expenses: expenses || [],
        memories: memories || [],
        startingBalance: startingBalance !== null ? startingBalance : 0,
        settings: {
          theme,
          transactionMsgBehavior: localStorage.getItem('daysync_transaction_msg_behavior') || 'automatic',
          autoBackup: localStorage.getItem('daysync_auto_backup') !== 'false',
          weekStartDay: localStorage.getItem('daysync_week_start') || 'monday',
          dateFormat: localStorage.getItem('daysync_date_format') || 'DD MMM YYYY',
          confirmDelete: localStorage.getItem('daysync_confirm_delete') !== 'false',
          currency: localStorage.getItem('daysync_currency') || 'INR (₹)',
          activeWidgetIds: (() => {
            try {
              const layoutKey = `daysync_dashboard_layout_${user?.id || 'guest'}`;
              const saved = localStorage.getItem(layoutKey);
              if (saved) return JSON.parse(saved);
            } catch (e) {}
            return [];
          })()
        }
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const todayStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `daysync-backup-${todayStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) showToast('DaySync data exported successfully!', 'success');
    } catch (err) {
      if (showToast) showToast('Failed to export data. Please try again.', 'error');
    }
  };

  // 2. Select File for Restore
  const handleFileSelectForRestore = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        if (parsed.app !== 'DaySync' && !parsed.tasks && !parsed.expenses && !parsed.settings) {
          throw new Error('Unrecognized DaySync backup structure');
        }

        setRestorePayload(parsed);
        setShowRestoreModal(true);
      } catch (err) {
        if (showToast) showToast('Invalid or corrupted DaySync backup file. Please select a valid JSON backup.', 'error');
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 3. Confirm Restore Handler
  const handleConfirmRestore = async () => {
    if (!restorePayload) return;

    try {
      const { settings, tasks: restoredTasks, expenses: restoredExpenses, memories: restoredMemories, startingBalance: restoredBal, userProfile } = restorePayload;

      // 1. Restore User Profile Avatar
      if (userProfile && userProfile.avatar) {
        updateUser({ avatar: userProfile.avatar });
      }

      // 2. Restore Baseline Balance
      if (restoredBal !== undefined) {
        updateStartingBalance(restoredBal);
      }

      // 3. Restore Settings to localStorage
      if (settings) {
        if (settings.theme && settings.theme !== theme) {
          toggleTheme();
        }
        if (settings.transactionMsgBehavior) {
          localStorage.setItem('daysync_transaction_msg_behavior', settings.transactionMsgBehavior);
        }
        if (settings.autoBackup !== undefined) {
          localStorage.setItem('daysync_auto_backup', String(settings.autoBackup));
        }
        if (settings.weekStartDay) {
          localStorage.setItem('daysync_week_start', settings.weekStartDay);
        }
        if (settings.dateFormat) {
          localStorage.setItem('daysync_date_format', settings.dateFormat);
        }
        if (settings.confirmDelete !== undefined) {
          localStorage.setItem('daysync_confirm_delete', String(settings.confirmDelete));
        }
        if (settings.currency) {
          localStorage.setItem('daysync_currency', settings.currency);
        }
        if (settings.activeWidgetIds && user?.id) {
          const layoutKey = `daysync_dashboard_layout_${user.id}`;
          localStorage.setItem(layoutKey, JSON.stringify(settings.activeWidgetIds));
        }
      }

      // 4. Restore Tasks, Expenses, Memories to clientCache
      if (user?.id) {
        if (Array.isArray(restoredTasks)) clientCache.save(user.id, 'tasks', restoredTasks);
        if (Array.isArray(restoredExpenses)) clientCache.save(user.id, 'expenses', restoredExpenses);
        if (Array.isArray(restoredMemories)) clientCache.save(user.id, 'memories', restoredMemories);
      }

      setShowRestoreModal(false);
      setRestorePayload(null);

      if (showToast) showToast('Data restored successfully! Refreshing app...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      if (showToast) showToast('Failed to restore data. Please check the backup file.', 'error');
    }
  };

  const handleSaveStartingBalance = (e) => {
    e?.preventDefault();
    if (!balanceInput) return;
    updateStartingBalance(balanceInput);
    setIsEditingBalance(false);
    if (showToast) showToast('Starting account balance updated.', 'success');
  };

  const handleStartEditBalance = () => {
    setBalanceInput(startingBalance !== null ? startingBalance.toString() : '0');
    setIsEditingBalance(true);
  };

  // Modals & Sheets State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const handleSelectAvatar = async (avatarId) => {
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
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('daysync_currency') || 'INR (₹)';
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
      planExpiry: true,
      splitUpdates: true,
      quietHours: false
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
      dailyFocus: true,
      morningBriefing: true,
      taskSuggestions: true,
      planReminders: true,
      splitAssistance: true
    };
  });

  // Startup Page preference state
  const VALID_STARTUP_PAGES = ['dashboard', 'tasks', 'expenses', 'plans', 'splits', 'chat', 'settings'];
  const [startupPage, setStartupPage] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_startup_page');
      if (saved && VALID_STARTUP_PAGES.includes(saved.toLowerCase())) {
        return saved.toLowerCase();
      }
    } catch (e) {}
    return 'dashboard';
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

  const handleTogglePush = async () => {
    if (pushEnabled) {
      await disablePush();
      if (showToast) showToast('Push notifications disabled on this device.', 'info');
    } else {
      const res = await enablePush();
      if (res.success) {
        if (showToast) showToast('Push notifications enabled for this device!', 'success');
      } else {
        if (showToast) showToast(res.error || 'Could not enable push notifications.', 'error');
      }
    }
  };

  const handleStartupPageChange = (e) => {
    const value = e.target.value;
    setStartupPage(value);
    try {
      localStorage.setItem('daysync_startup_page', value);
    } catch (e) {}
    if (showToast) showToast('Startup page updated.', 'success');
  };

  const handleTransactionMsgBehaviorChange = (mode) => {
    setTransactionMsgBehavior(mode);
    localStorage.setItem('daysync_transaction_msg_behavior', mode);
    if (showToast) showToast(`Transaction message behavior set to ${mode}.`, 'success');
  };

  const handleCurrencyChange = (val) => {
    setCurrency(val);
    localStorage.setItem('daysync_currency', val);
    if (showToast) showToast(`Currency updated to ${val}.`, 'success');
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

  const handleTestNotification = async () => {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
      if (showToast) showToast('Test native alert scheduled.', 'success');
      return;
    }

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
        new Notification('DaySync Alert', {
          body: 'This is a test notification from DaySync!',
          icon: '/icons/icon-192.png'
        });
        if (showToast) showToast('Test notification sent.', 'success');
      } else {
        if (showToast) showToast("Push notification permission not granted.", 'error');
      }
    } catch (err) {
      if (showToast) showToast("Push notifications aren't available right now.", 'error');
    }
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

  const handleConfirmClearHistory = async () => {
    if (isClearingHistory) return;
    setIsClearingHistory(true);
    try {
      if (clearChatHistory) {
        await clearChatHistory();
      } else {
        await api.clearHistory();
      }
      setShowClearHistoryModal(false);
      if (showToast) showToast('Chat history cleared.', 'success');
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

  return (
    <div className="page-container settings-page-container">
      {/* Top Header Row */}
      <PageHeaderRow title="SETTINGS" />

      {/* COMPACT SINGLE-PAGE SETTINGS CONTAINER */}
      <div className="settings-compact-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        
        {/* 1. PROFILE SECTION */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <User size={18} color="var(--accent-primary)" /> Profile & Account Information
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowProfileModal(prev => !prev)} title="Click to edit cartoon avatar">
              <UserAvatar avatarId={user?.avatar} name={user?.name} size={72} />
              <div style={{
                position: 'absolute', bottom: '0', right: '0',
                background: 'var(--accent-primary)', color: '#FFFFFF',
                borderRadius: '50%', width: '24px', height: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-card)'
              }}>
                <Edit2 size={12} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {user?.name || 'DaySync User'}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user?.email || 'user@daysync.app'}
              </div>
            </div>
          </div>

          {/* AVATAR SELECTION POPUP DIRECTLY BELOW THE PFP / AVATAR ROW */}
          {showProfileModal && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '10px',
                marginBottom: '16px',
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Choose Cartoon Avatar
                </h4>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '260px', overflowY: 'auto', padding: '2px' }}>
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
                      <CartoonAvatar id={av.id} size={44} />
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

          <div className="profile-actions-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button type="button" onClick={() => setShowProfileModal(prev => !prev)} className="btn-secondary" style={{ fontSize: '11.5px', padding: '8px 6px', justifyContent: 'center' }}>
              <Sparkles size={13} /> Edit Avatar
            </button>
            <button type="button" onClick={handleOpenChangeName} className="btn-secondary" style={{ fontSize: '11.5px', padding: '8px 6px', justifyContent: 'center' }}>
              <Edit2 size={13} /> Edit Name
            </button>
            <button type="button" onClick={handleOpenChangeEmail} className="btn-secondary" style={{ fontSize: '11.5px', padding: '8px 6px', justifyContent: 'center' }}>
              <Mail size={13} /> Edit Email
            </button>
            <button type="button" onClick={handleOpenChangePassword} className="btn-secondary" style={{ fontSize: '11.5px', padding: '8px 6px', justifyContent: 'center' }}>
              <Key size={13} /> Change Password
            </button>
          </div>
        </div>

        {/* 2. APP & SYSTEM PREFERENCES */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--accent-primary)" /> App & System Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Theme Mode */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Theme Mode</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Current: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{theme} Mode</strong></div>
              </div>
              <button type="button" onClick={toggleTheme} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {theme === 'dark' ? <Sun size={14} color="var(--accent-warning)" /> : <Moon size={14} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Transaction Messages */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Transaction Message Behavior</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Handling for expense and payment messages</div>
              </div>
              <select
                value={transactionMsgBehavior}
                onChange={(e) => handleTransactionMsgBehaviorChange(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="automatic">Automatic Log</option>
                <option value="confirm">Confirm Before Sending</option>
              </select>
            </div>

            {/* Clear Luna Chat */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Clear Luna Chat</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Remove all stored conversations with Luna</div>
              </div>
              <button type="button" onClick={() => setShowClearHistoryModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-warning)' }}>
                <Trash2 size={13} /> Clear Chat
              </button>
            </div>

            {/* Open Page on Startup */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Open Page on Startup</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Initial landing screen when launching app</div>
              </div>
              <select
                value={startupPage}
                onChange={handleStartupPageChange}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="dashboard">Dashboard</option>
                <option value="tasks">Tasks</option>
                <option value="expenses">Expenses</option>
                <option value="plans">Plans</option>
                <option value="splits">Splits</option>
                <option value="chat">Luna Chat</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            {/* Week Start Day */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Week Start Day</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Calendar & analytics start day</div>
              </div>
              <select
                value={weekStartDay}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* Date Format */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Date Format</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Display format across dates</div>
              </div>
              <select
                value={dateFormat}
                onChange={(e) => handleDateFormatChange(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="DD MMM YYYY">DD MMM YYYY (e.g. 04 Sep 2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/04/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-04)</option>
              </select>
            </div>

            {/* Confirm Before Deleting */}
            <ToggleSwitch
              checked={confirmDelete}
              onChange={handleToggleConfirmDelete}
              label="Confirm Before Deleting"
              description="Show confirmation modal before deleting tasks or expenses"
            />

            {/* Currency */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Primary Currency</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Symbol used in expense snapshots</div>
              </div>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="INR (₹)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>

            {/* Starting Account Balance */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Starting Account Balance</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Current Baseline: <strong>₹{(startingBalance !== null ? startingBalance : 0).toLocaleString()}</strong>
                </div>
              </div>

              {!isEditingBalance ? (
                <button type="button" onClick={handleStartEditBalance} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  <Edit2 size={13} /> Edit Balance
                </button>
              ) : (
                <form onSubmit={handleSaveStartingBalance} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    style={{ width: '90px', padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    placeholder="0"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}><Check size={13} /></button>
                  <button type="button" onClick={() => setIsEditingBalance(false)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}><X size={13} /></button>
                </form>
              )}
            </div>

            {/* Auto Backup */}
            <ToggleSwitch
              checked={autoBackup}
              onChange={handleToggleAutoBackup}
              label="Auto Data Backup"
              description="Keep local user-scoped cache synchronized with cloud profile"
            />
          </div>
        </div>

        {/* 3. DASHBOARD SETTINGS */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layout size={18} color="var(--accent-primary)" /> Dashboard & Widgets
          </h3>

          <div className="dashboard-widgets-setting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Active Widgets Count</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <strong>{activeWidgetIds.length}</strong> widget{activeWidgetIds.length !== 1 ? 's' : ''} visible on your dashboard
              </div>
            </div>
            <div className="dashboard-widgets-buttons-wrapper" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button type="button" onClick={() => setIsWidgetPickerOpen(true)} className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={13} /> Manage Widgets
              </button>
              <button type="button" onClick={() => setShowDashboardResetModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                Reset Layout
              </button>
            </div>
          </div>
        </div>

        {/* 4. NOTIFICATION SETTINGS */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Bell size={18} color="var(--accent-primary)" /> Notification Settings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Master Push */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Push Notifications</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Device and system push alerts</div>
              </div>
              {pushSupported && pushPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className={pushEnabled ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {pushLoading ? 'Processing...' : pushEnabled ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>

            {/* Task Alerts */}
            <ToggleSwitch
              checked={notifSettings.taskDue}
              onChange={() => handleToggleNotifSetting('taskDue')}
              label="Tasks & Reminders"
              description="Alerts for due dates, overdue items, and meetings"
            />

            {/* Plan Expiry */}
            <ToggleSwitch
              checked={notifSettings.planExpiry}
              onChange={() => handleToggleNotifSetting('planExpiry')}
              label="Plans & Subscriptions"
              description="Notifications for plan renewals and upcoming bills"
            />

            {/* Split Updates */}
            <ToggleSwitch
              checked={notifSettings.splitUpdates}
              onChange={() => handleToggleNotifSetting('splitUpdates')}
              label="Splits & Group Expenses"
              description="Alerts when new split expenses or settlements occur"
            />

            {/* Quiet Hours */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Quiet Hours</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Silence non-critical alerts ({quietStart} – {quietEnd})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={handleOpenQuietHoursModal} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  Schedule
                </button>
                <div
                  onClick={() => handleToggleQuietHours(!quietHoursEnabled)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: quietHoursEnabled ? 'var(--accent-primary)' : 'var(--bg-tertiary, rgba(255,255,255,0.15))',
                    border: '1px solid var(--border-color)', padding: '2px', display: 'flex', alignItems: 'center',
                    cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF',
                    transform: quietHoursEnabled ? 'translateX(20px)' : 'translateX(0px)', transition: 'transform 0.2s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Test Notification Button */}
            <div style={{ paddingTop: '12px' }}>
              <button type="button" onClick={handleTestNotification} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={14} /> Send Test Notification
              </button>
            </div>
          </div>
        </div>

        {/* 5. LUNA AI SETTINGS */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={18} color="var(--accent-primary)" /> Luna AI Companion Settings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Luna AI Master Toggle */}
            <ToggleSwitch
              checked={lunaSettings.enabled}
              onChange={() => handleToggleLunaSetting('enabled')}
              label="Luna AI Master Companion"
              description="Enable or disable Luna AI contextual insights across the app"
            />

            {/* Daily Focus & Productivity */}
            <ToggleSwitch
              checked={lunaSettings.dailyFocus}
              onChange={() => handleToggleLunaSetting('dailyFocus')}
              label="Daily Focus & Productivity Suggestions"
              description="Contextual suggestions on task prioritization"
            />

            {/* Morning Daily Briefing */}
            <ToggleSwitch
              checked={lunaSettings.morningBriefing}
              onChange={() => handleToggleLunaSetting('morningBriefing')}
              label="Morning Daily Briefing"
              description="Proactive morning summary of scheduled items"
            />

            {/* Automated Task Priority */}
            <ToggleSwitch
              checked={lunaSettings.taskSuggestions}
              onChange={() => handleToggleLunaSetting('taskSuggestions')}
              label="Automated Task Priority Assistance"
              description="Smart detection of high priority deadlines"
            />

            {/* Proactive Plan Expiry Alerts */}
            <ToggleSwitch
              checked={lunaSettings.planReminders}
              onChange={() => handleToggleLunaSetting('planReminders')}
              label="Proactive Plan Expiry Alerts"
              description="Automatic renewal reminders for utility plans"
            />

            {/* Split Debt Simplification */}
            <ToggleSwitch
              checked={lunaSettings.splitAssistance}
              onChange={() => handleToggleLunaSetting('splitAssistance')}
              label="Split Debt Simplification Assistance"
              description="Smart calculation of minimum transaction settlements"
            />
          </div>
        </div>

        {/* 6. PRIVACY & SECURITY */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Shield size={18} color="var(--accent-primary)" /> Privacy & Security
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Security Status</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>JWT Authenticated • Encrypted TLS Session</div>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(47, 111, 115, 0.15)', color: 'var(--accent-primary)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                Protected ✓
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Email Verification</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Status for {user?.email || 'account'}</div>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(47, 111, 115, 0.15)', color: 'var(--accent-primary)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                Verified ✓
              </span>
            </div>
          </div>
        </div>

        {/* 7. DATA BACKUP & RESTORE */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Database size={18} color="var(--accent-primary)" /> Data & Backup Management
          </h3>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
            Export or restore your DaySync tasks, expenses, plans, and preferences to a JSON backup file.
          </p>

          <div className="data-backup-buttons-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handleExportData}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px' }}
            >
              <Download size={14} /> Export My Data (.json)
            </button>

            <button
              type="button"
              onClick={() => restoreFileInputRef.current?.click()}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px' }}
            >
              <Upload size={14} /> Restore Data File
            </button>

            <input
              type="file"
              ref={restoreFileInputRef}
              onChange={handleFileSelectForRestore}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>

          <div className="data-backup-history-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)', gap: '16px' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Conversation History</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Stored chat logs with Luna AI</div>
            </div>
            <button
              type="button"
              onClick={() => setShowClearHistoryModal(true)}
              className="btn-secondary"
              style={{ color: 'var(--accent-warning)', fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}
            >
              <Trash2 size={13} /> Clear Chat History
            </button>
          </div>
        </div>

        {/* 8. APP & PWA STATUS */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Smartphone size={18} color="var(--accent-primary)" /> App & PWA Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>App Version</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>DaySync Release 2.0.0</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>v2.0.0</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Update Status</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {updateAvailable ? 'New release available!' : 'App is up to date'}
                </div>
              </div>
              <button
                type="button"
                onClick={checkForUpdates}
                disabled={checking}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {checking ? 'Checking...' : 'Check Updates'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Developer Support</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Need help or found a bug?</div>
              </div>
              <a
                href="mailto:support@daysync.ai"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
              >
                <Mail size={13} /> Contact Developer
              </a>
            </div>
          </div>
        </div>

        {/* 9. ABOUT DAYSYNC & HELP */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Info size={18} color="var(--accent-primary)" /> About DaySync & Help
          </h3>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
            DaySync 2.0 is your intelligent life, expense, subscription, and split-sharing companion powered by Luna AI.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>VERSION</div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>2.0.0</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ENGINE</div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>Luna 2.0</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PLATFORM</div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() ? 'Android Native' : 'Web PWA'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NETWORK</div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--accent-success)' }}>
                {typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* 10. ACCOUNT ACTIONS */}
        <div className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lock size={18} color="var(--accent-primary)" /> Account Actions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="btn-secondary"
              style={{ fontSize: '12.5px', padding: '10px', justifyContent: 'center', fontWeight: '700' }}
            >
              <LogOut size={14} /> Log Out
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn-secondary"
              style={{ color: 'var(--accent-danger)', fontSize: '12.5px', padding: '10px', justifyContent: 'center', fontWeight: '700' }}
            >
              <UserX size={14} /> Delete Account
            </button>
          </div>
        </div>

      </div>

      {/* Account Modals */}
      {showChangeNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Edit Display Name</h3>
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

      {/* Quiet Hours Schedule Edit Modal */}
      {showQuietHoursModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Quiet Hours Schedule</h3>
              <button type="button" onClick={() => setShowQuietHoursModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveQuietHoursModal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Start Time</label>
                  <input
                    type="time"
                    value={tempQuietStart}
                    onChange={(e) => setTempQuietStart(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>End Time</label>
                  <input
                    type="time"
                    value={tempQuietEnd}
                    onChange={(e) => setTempQuietEnd(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowQuietHoursModal(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal isOpen={showLogoutModal} title="Log out of DaySync?" message="Are you sure you want to log out of your session?" confirmText="Log Out" cancelText="Cancel" isDanger={false} isLoading={isLoggingOut} onConfirm={handleConfirmLogout} onCancel={() => setShowLogoutModal(false)} />
      <ConfirmationModal isOpen={showDeleteModal} title="Delete your DaySync account?" message="Your account and associated data will be permanently deleted. This action cannot be undone." confirmText="Delete Account" cancelText="Cancel" isDanger={true} isLoading={isDeletingAccount} onConfirm={handleConfirmDeleteAccount} onCancel={() => setShowDeleteModal(false)} />
      <ConfirmationModal isOpen={showClearHistoryModal} title="Clear your conversation history?" message="Are you sure you want to clear your stored chat messages? This action cannot be undone." confirmText="Clear History" cancelText="Cancel" isDanger={true} isLoading={isClearingHistory} onConfirm={handleConfirmClearHistory} onCancel={() => setShowClearHistoryModal(false)} />
      <ConfirmationModal isOpen={showDashboardResetModal} title="Reset Dashboard Layout?" message="This will restore the default widget arrangement and sizes. Your tasks, expenses, and data will not be affected." confirmText="Reset Layout" cancelText="Cancel" isDanger={true} onConfirm={handleConfirmResetDashboard} onCancel={() => setShowDashboardResetModal(false)} />

      {/* RESTORE DATA CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        title="Restore DaySync Data?"
        message="This will restore your tasks, expenses, plans, habits, memories, and settings from the backup file. Existing local data will be replaced/updated."
        confirmText="Confirm Restore"
        cancelText="Cancel"
        isDanger={false}
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setShowRestoreModal(false);
          setRestorePayload(null);
        }}
      />

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
