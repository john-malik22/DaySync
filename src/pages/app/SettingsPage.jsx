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
  HelpCircle,
  Download,
  Upload
} from 'lucide-react';

import { useLuna } from '../../context/LunaContext';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
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
  const { preferences, updatePreferences } = useNotifications();
  const { tasks, expenses, memories, startingBalance, updateStartingBalance, refreshData } = useLuna();
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
  const aboutRef = useRef(null);
  const actionsRef = useRef(null);

  const [activeSection, setActiveSection] = useState('account');

  // Modals & Sheets State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    { key: 'profile', label: 'Profile', icon: User, ref: accountRef },
    { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal, ref: preferencesRef },
    { key: 'dashboard', label: 'Dashboard', icon: Layout, ref: dashboardRef },
    { key: 'notifications', label: 'Notifications', icon: Bell, ref: notificationsRef },
    { key: 'luna', label: 'Luna', icon: Sparkles, ref: lunaRef },
    { key: 'privacy', label: 'Privacy', icon: Shield, ref: privacyRef },
    { key: 'app', label: 'App / PWA', icon: Smartphone, ref: appRef },
    { key: 'about', label: 'About', icon: Info, ref: aboutRef },
    { key: 'actions', label: 'Actions', icon: Lock, ref: actionsRef }
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

      {/* SETTINGS CONTENT DIRECTLY ON MAIN PAGE BODY (NO CARD CONTAINERS) */}
      {/* REDESIGNED SINGLE-PAGE SETTINGS CONTAINER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. PROFILE SECTION */}
        <div ref={accountRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <UserAvatar avatarId={user?.avatar} name={user?.name} size={84} />
            <button
              type="button"
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--accent-primary)', color: '#FFFFFF',
                border: '2px solid var(--bg-primary, #18181B)', borderRadius: '50%',
                width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', padding: 0
              }}
              title="Change Cartoon Avatar"
            >
              <Edit2 size={12} />
            </button>
          </div>

          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {user?.name || 'User'}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '12px' }}>
            {user?.email || 'user@daysync.app'}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '440px', width: '100%' }}>
            <button type="button" onClick={() => setIsEditingAvatar(!isEditingAvatar)} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px', flex: '1 1 130px', justifyContent: 'center' }}>
              <Sparkles size={13} /> {isEditingAvatar ? 'Close Avatar Editor' : 'Choose Character'}
            </button>
            <button type="button" onClick={handleOpenChangeName} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px', flex: '1 1 110px', justifyContent: 'center' }}>
              <Edit2 size={13} /> Edit Name
            </button>
            <button type="button" onClick={handleOpenChangeEmail} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px', flex: '1 1 110px', justifyContent: 'center' }}>
              <Mail size={13} /> Edit Email
            </button>
          </div>

          <div style={{ marginTop: '8px', maxWidth: '440px', width: '100%' }}>
            <button type="button" onClick={handleOpenChangePassword} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px', width: '100%', justifyContent: 'center' }}>
              <Key size={13} /> Change Password
            </button>
          </div>

          {/* INLINE AVATAR SELECTION GRID */}
          {isEditingAvatar && (
            <div style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                Select a 2D Cartoon Avatar
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '8px' }}>
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
                        borderRadius: '10px',
                        padding: '8px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <CartoonAvatar id={av.id} size={44} />
                      <span style={{ fontSize: '10.5px', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                        {av.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 3. APP & SYSTEM PREFERENCES */}
        <div ref={preferencesRef}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--accent-primary)" /> App & System Preferences
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Configure functional date, startup, timezone, and system preferences across DaySync.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Transaction Messages</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Control transaction-message read behavior</div>
              </div>
              <select
                value={transactionMsgBehavior}
                onChange={(e) => handleTransactionMsgBehaviorChange(e.target.value)}
                style={{ width: '170px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 }}
              >
                <option value="automatic">Automatic</option>
                <option value="prompt">Prompt</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Clear Luna Chat */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Clear Luna Chat</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Remove stored conversation history</div>
              </div>
              <button type="button" onClick={() => setShowClearHistoryModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-danger)', flexShrink: 0 }}>
                <Trash2 size={14} /> Clear History
              </button>
            </div>

            {/* Open Page on Startup */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Open Page on Startup</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Default launch page</div>
              </div>
              <select
                value={defaults.startupPage}
                onChange={(e) => handleDefaultChange('startupPage', e.target.value)}
                style={{ width: '170px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 }}
              >
                <option value="dashboard">Dashboard</option>
                <option value="tasks">Tasks</option>
                <option value="finance">Expenses</option>
                <option value="plans">Plans</option>
                <option value="splits">Splits</option>
              </select>
            </div>

            {/* Week Start Day */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Week Start Day</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>First day of calendar week</div>
              </div>
              <select
                value={weekStartDay}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                style={{ width: '170px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 }}
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* Date Format */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Date Format</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Date display format</div>
              </div>
              <select
                value={dateFormat}
                onChange={(e) => handleDateFormatChange(e.target.value)}
                style={{ width: '170px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 }}
              >
                <option value="DD MMM YYYY">DD MMM YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>

            {/* Confirm Before Deleting (TOGGLE SWITCH) */}
            <div style={{ borderBottom: '1px solid var(--border-color)' }}>
              <ToggleSwitch
                checked={confirmDelete}
                onChange={handleToggleConfirmDelete}
                label="Confirm Before Deleting"
                description="Show confirmation modal before deleting items"
              />
            </div>

            {/* Currency */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Currency</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Default currency code</div>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>INR (₹)</span>
            </div>

            {/* Starting Account Balance */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Starting Account Balance</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Wallet baseline balance: ₹{startingBalance !== null ? startingBalance : 0}</div>
              </div>
              <button type="button" onClick={handleStartEditBalance} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                Edit Baseline
              </button>
            </div>

            {/* Auto Backup (TOGGLE SWITCH) */}
            <div>
              <ToggleSwitch
                checked={autoBackup}
                onChange={handleToggleAutoBackup}
                label="Auto Backup"
                description="Automatically back up DaySync user data"
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 4. DASHBOARD SETTINGS */}
        <div ref={dashboardRef}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={18} color="var(--accent-primary)" /> Dashboard Settings
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Arrange, resize, add, or remove widgets anytime to make DaySync fit the way you use it.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Active Widgets: <strong style={{ color: 'var(--text-primary)' }}>{activeWidgetIds.length}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setIsWidgetPickerOpen(true)} className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} /> Manage Widgets
              </button>
              <button type="button" onClick={() => setShowDashboardResetModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Reset Layout
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 5. NOTIFICATION SETTINGS */}
        <div ref={notificationsRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="var(--accent-primary)" /> Notification Settings
            </h3>
            <button type="button" onClick={handleTestNotification} className="btn-secondary" style={{ fontSize: '11.5px', padding: '4px 10px' }}>
              Test Notification
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Control what DaySync can notify you about even when the app is closed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { key: 'masterPush', label: 'Push Notifications (Master Toggle)', desc: 'Device WebPush availability' },
              { key: 'taskDue', label: 'Tasks', desc: 'Due and overdue task reminders' },
              { key: 'planExpiry', label: 'Plans', desc: 'Plan expiry and payment reminders' },
              { key: 'habitReminders', label: 'Habits', desc: 'Daily habit completion reminders' },
              { key: 'splitUpdates', label: 'Splits', desc: 'Shared expense and settlement updates' },
              { key: 'lunaSuggestions', label: 'Luna Suggestions', desc: 'Daily briefing and proactive help' }
            ].map(item => (
              <div key={item.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <ToggleSwitch
                  checked={!!notifSettings[item.key]}
                  onChange={() => handleToggleNotifSetting(item.key)}
                  label={item.label}
                  description={item.desc}
                />
              </div>
            ))}

            {/* Quiet Hours */}
            <div style={{ paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Quiet Hours Schedule</div>
                <button type="button" onClick={handleOpenQuietHoursModal} className="btn-secondary" style={{ fontSize: '11.5px', padding: '3px 8px' }}>
                  <Edit2 size={11} /> Edit Schedule
                </button>
              </div>
              <ToggleSwitch
                checked={quietHoursEnabled}
                onChange={handleToggleQuietHours}
                label="Quiet Hours ON/OFF"
                description={`Schedule: ${quietStart} – ${quietEnd} (Local Time)`}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 6. LUNA AI SETTINGS */}
        <div ref={lunaRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> Luna AI Settings
            </h3>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
              background: lunaSettings.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: lunaSettings.enabled ? 'var(--accent-success)' : 'var(--accent-danger)'
            }}>
              Luna: {lunaSettings.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Luna uses your DaySync activity to help you focus on tasks, plans, habits, and important moments.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { key: 'enabled', label: 'Luna AI Assistant (Master ON/OFF)', desc: 'Enable or disable Luna intelligence across DaySync' },
              { key: 'suggestions', label: 'Daily Focus & Productivity Suggestions', desc: 'Contextual Hinglish tips and daily insights' },
              { key: 'dailyBriefing', label: 'Morning Daily Briefing', desc: 'Summarizes your day each morning' },
              { key: 'taskSuggestions', label: 'Automated Task Priority Suggestions', desc: 'Recommends priority order for task list' },
              { key: 'planReminders', label: 'Proactive Plan Expiry Alerts', desc: 'Alerts you before subscriptions renew or expire' },
              { key: 'splitAssistance', label: 'Split Debt Simplification Assistance', desc: 'Offers settlement assistance for group balances' }
            ].map(item => (
              <div key={item.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <ToggleSwitch
                  checked={!!lunaSettings[item.key]}
                  onChange={() => handleToggleLunaSetting(item.key)}
                  label={item.label}
                  description={item.desc}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 7. PRIVACY & SECURITY */}
        <div ref={privacyRef}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-primary)" /> Privacy & Security
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Keep your account credentials and conversation history protected.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Security Status</span>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Protected
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Email Verification</span>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={13} /> Verified
              </span>
            </div>

            {/* DATA BACKUP & RESTORE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Export & Restore Data</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Backup or restore your tasks, expenses, plans, habits & settings</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={13} /> Export My Data
                </button>

                <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} /> Restore Data
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelectForRestore}
                    style={{ display: 'none' }}
                    ref={restoreFileInputRef}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Conversation History</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Remove stored Luna chat logs</div>
              </div>
              <button type="button" onClick={() => setShowClearHistoryModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-danger)' }}>
                <Trash2 size={13} /> Clear Chat History
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 8. APP & PWA STATUS */}
        <div ref={appRef}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="var(--accent-primary)" /> App & PWA Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Version</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>2.0.0</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Update Check</span>
                {updateAvailable && <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-warning)' }}>New version available</div>}
                {hasCheckedManually && !updateAvailable && !checking && !fetchError && <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-success)' }}>✓ Up to date</div>}
              </div>
              {updateAvailable ? (
                <button type="button" onClick={updateApp} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  Update Now ↻
                </button>
              ) : (
                <button type="button" onClick={checkForUpdates} disabled={checking} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  {checking ? 'Checking...' : 'Check for Updates ↻'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Developer Support</span>
              <a href="mailto:support@daysync.app?subject=DaySync%20Support" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> Contact Developer
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 9. ABOUT DAYSYNC & HELP */}
        <div ref={aboutRef}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="var(--accent-primary)" /> About DaySync & Help
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.5' }}>
            DaySync brings your tasks, expenses, plans, reminders, shared splits, and Luna assistance together in one everyday workspace.
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>Version: <strong style={{ color: 'var(--text-primary)' }}>2.0.0</strong></div>
            <div>Engine: <strong style={{ color: 'var(--text-primary)' }}>Antigravity Core</strong></div>
            <div>Platform: <strong style={{ color: 'var(--text-primary)' }}>{isStandalone ? 'PWA' : 'Web Browser'}</strong></div>
            <div>Network: <strong style={{ color: navigator.onLine ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{navigator.onLine ? 'Online' : 'Offline'}</strong></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} color="var(--accent-primary)" /> Need help or have questions?
            </div>
            <button type="button" onClick={() => navigate('/app/chat')} className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
              Ask Luna Assistant
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* 10. ACCOUNT ACTIONS */}
        <div ref={actionsRef}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--accent-primary)" /> Account Actions
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Manage your active session status or permanently delete your account.
          </p>

          <div className="account-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <button type="button" onClick={() => setShowLogoutModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'center', width: '100%' }}>
              <LogOut size={14} /> Log Out
            </button>
            <button type="button" onClick={() => setShowDeleteModal(true)} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'center', color: 'var(--accent-danger)', width: '100%' }}>
              <UserX size={14} /> Delete Account
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

      {/* RESTORE DATA CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        title="Restore DaySync Data?"
        message="This will restore your tasks, expenses, plans, habits, memories, and settings from the backup file. Existing local data will be replaced/updated."
        confirmText="Confirm Restore"
        cancelText="Cancel"
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setShowRestoreModal(false);
          setRestorePayload(null);
        }}
      />
    </div>
  );
}
