import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
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

export function PWAUpdateProvider({ children }) {
  const currentVersion = pkg.version || '1.1.1';
  const [checking, setChecking] = useState(false);
  const [hasCheckedManually, setHasCheckedManually] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  const registrationRef = useRef(null);

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

    // 1. Fetch latest version from /version.json
    try {
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

  return (
    <PWAUpdateContext.Provider
      value={{
        currentVersion,
        latestVersion: latestVersion || currentVersion,
        updateAvailable: isUpdateAvailable,
        checking,
        hasCheckedManually,
        fetchError,
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
      currentVersion: pkg.version || '1.1.1',
      latestVersion: pkg.version || '1.1.1',
      updateAvailable: false,
      checking: false,
      hasCheckedManually: false,
      fetchError: false,
      checkForUpdates: () => {},
      checkForUpdate: () => {},
      updateApp: () => {},
      applyUpdate: () => {}
    };
  }
  return context;
}
