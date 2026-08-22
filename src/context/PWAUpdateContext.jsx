import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import pkg from '../../package.json';

const PWAUpdateContext = createContext();

export function compareSemVer(v1, v2) {
  if (!v1 || !v2) return 0;
  const p1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

const DEFAULT_HIGHLIGHTS = [
  "Bug fixes and performance improvements."
];

export function PWAUpdateProvider({ children }) {
  const currentVersion = pkg.version || '1.1.2';

  const [checking, setChecking] = useState(false);
  const [hasCheckedManually, setHasCheckedManually] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  // Release notes dictionary
  const [releases, setReleases] = useState({});
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);

  const registrationRef = useRef(null);

  // Fetch release notes metadata
  const fetchReleases = useCallback(async () => {
    try {
      const res = await fetch(`/releases.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setReleases(data);
        }
      }
    } catch (e) {
      console.warn('Unable to load releases.json:', e);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Check post-update "What's New" modal trigger
  useEffect(() => {
    const lastSeen = localStorage.getItem('daysync_last_seen_release');
    
    if (!lastSeen) {
      // First install: store current version so historical notes aren't popped up
      localStorage.setItem('daysync_last_seen_release', currentVersion);
    } else if (compareSemVer(currentVersion, lastSeen) > 0) {
      // User upgraded to a newer version! Show "What's New" modal once
      setShowWhatsNewModal(true);
    }
  }, [currentVersion]);

  const closeWhatsNewModal = () => {
    localStorage.setItem('daysync_last_seen_release', currentVersion);
    setShowWhatsNewModal(false);
  };

  const getReleaseHighlights = useCallback((versionStr) => {
    if (!versionStr) return DEFAULT_HIGHLIGHTS;
    const targetKey = String(versionStr).replace(/^v/i, '');
    if (releases[targetKey] && Array.isArray(releases[targetKey].highlights)) {
      return releases[targetKey].highlights;
    }
    return DEFAULT_HIGHLIGHTS;
  }, [releases]);

  const dismissUpdate = (versionToDismiss) => {
    setDismissedVersion(versionToDismiss || latestVersion || 'dismissed');
  };

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        registrationRef.current = r;
        if (r.waiting) {
          setIsUpdateAvailable(true);
        }
        r.addEventListener('updatefound', () => {
          const newWorker = r.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    }
  });

  useEffect(() => {
    if (needRefresh) {
      setIsUpdateAvailable(true);
    }
  }, [needRefresh]);

  const checkForUpdates = async () => {
    setChecking(true);
    setFetchError(false);
    let foundWaiting = false;
    let remoteVersion = null;

    // 1. Fetch latest version from /version.json & releases.json
    try {
      await fetchReleases();
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          remoteVersion = data.version;
          setLatestVersion(data.version);
        }
      } else {
        setFetchError(true);
      }
    } catch (err) {
      console.warn('Unable to check version.json:', err);
      setFetchError(true);
    }

    // 2. Query service worker registration update
    try {
      let reg = registrationRef.current;
      if (!reg && 'serviceWorker' in navigator) {
        reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          registrationRef.current = reg;
        }
      }

      if (reg) {
        await reg.update();
        if (reg.waiting) {
          foundWaiting = true;
        }
      }
    } catch (err) {
      console.error('Error checking service worker update:', err);
    } finally {
      setTimeout(() => {
        const hasWaitingWorker = Boolean(
          needRefresh || 
          foundWaiting || 
          (registrationRef.current && registrationRef.current.waiting)
        );
        const isNewerVersion = remoteVersion ? compareSemVer(remoteVersion, currentVersion) > 0 : false;

        setIsUpdateAvailable(isNewerVersion || hasWaitingWorker);
        setHasCheckedManually(true);
        setChecking(false);
      }, 800);
    }
  };

  const updateApp = () => {
    let reloading = false;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      });
    }

    const reg = registrationRef.current;
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    try {
      updateServiceWorker(true);
    } catch (e) {
      console.warn('updateServiceWorker error:', e);
    }

    setTimeout(() => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    }, 1000);
  };

  // Determine if update modal prompt should be displayed
  const effectiveLatest = latestVersion || currentVersion;
  const isPromptDismissed = dismissedVersion && compareSemVer(dismissedVersion, effectiveLatest) >= 0;
  const showUpdatePrompt = isUpdateAvailable && !isPromptDismissed;

  return (
    <PWAUpdateContext.Provider
      value={{
        currentVersion,
        latestVersion: effectiveLatest,
        updateAvailable: isUpdateAvailable,
        showUpdatePrompt,
        dismissedVersion,
        checking,
        hasCheckedManually,
        fetchError,
        releases,
        getReleaseHighlights,
        dismissUpdate,
        showWhatsNewModal,
        closeWhatsNewModal,
        openWhatsNewModal: () => setShowWhatsNewModal(true),
        checkForUpdates,
        checkForUpdate: checkForUpdates,
        updateApp,
        applyUpdate: updateApp
      }}
    >
      {children}
    </PWAUpdateContext.Provider>
  );
}

export function usePWAUpdate() {
  const context = useContext(PWAUpdateContext);
  if (!context) {
    return {
      currentVersion: pkg.version || '1.1.2',
      latestVersion: pkg.version || '1.1.2',
      updateAvailable: false,
      showUpdatePrompt: false,
      dismissedVersion: null,
      checking: false,
      hasCheckedManually: false,
      fetchError: false,
      releases: {},
      getReleaseHighlights: () => DEFAULT_HIGHLIGHTS,
      dismissUpdate: () => {},
      showWhatsNewModal: false,
      closeWhatsNewModal: () => {},
      openWhatsNewModal: () => {},
      checkForUpdates: () => {},
      checkForUpdate: () => {},
      updateApp: () => {},
      applyUpdate: () => {}
    };
  }
  return context;
}
