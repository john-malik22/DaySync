import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function OfflineBanner() {
  const { syncState, pendingQueueCount, retrySync } = useLuna();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSyncedBanner, setShowSyncedBanner] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      setShowSyncedBanner(true);
      const timer = setTimeout(() => setShowSyncedBanner(false), 3500);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOffline(true);
      setShowSyncedBanner(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine indicator display properties
  let label = 'Online / Synced';
  let icon = <CheckCircle2 size={13} />;
  let bgColor = 'rgba(16, 185, 129, 0.94)'; // Green
  let textColor = '#FFFFFF';
  let isVisible = false;

  if (isOffline || syncState === 'offline') {
    label = 'Offline';
    icon = <WifiOff size={13} />;
    bgColor = 'rgba(245, 158, 11, 0.94)'; // Amber
    isVisible = true;
  } else if (syncState === 'syncing') {
    label = 'Syncing…';
    icon = <RefreshCw size={13} className="spin-animation" />;
    bgColor = 'rgba(91, 80, 230, 0.94)'; // Indigo
    isVisible = true;
  } else if (syncState === 'pending' || (pendingQueueCount && pendingQueueCount > 0)) {
    label = `Pending changes (${pendingQueueCount || 1})`;
    icon = <Clock size={13} />;
    bgColor = 'rgba(245, 158, 11, 0.94)'; // Amber
    isVisible = true;
  } else if (syncState === 'failed') {
    label = 'Sync failed — retrying';
    icon = <AlertCircle size={13} />;
    bgColor = 'rgba(239, 68, 68, 0.94)'; // Danger Red
    isVisible = true;
  } else if (showSyncedBanner || syncState === 'synced') {
    label = 'Online / Synced';
    icon = <Wifi size={13} />;
    bgColor = 'rgba(16, 185, 129, 0.94)'; // Green
    // Only show synced badge briefly when transition happens or when pending items clear
    isVisible = showSyncedBanner;
  }

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      <div
        onClick={syncState === 'failed' ? retrySync : undefined}
        style={{
          pointerEvents: 'auto',
          background: bgColor,
          backdropFilter: 'blur(8px)',
          color: textColor,
          padding: '5px 14px',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
          letterSpacing: '-0.1px',
          cursor: syncState === 'failed' ? 'pointer' : 'default',
          transition: 'all 0.2s ease'
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
