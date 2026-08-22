import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdateContext = createContext();

export function PWAUpdateProvider({ children }) {
  const [checking, setChecking] = useState(false);
  const [hasCheckedManually, setHasCheckedManually] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
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
    let foundWaiting = false;

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
      console.error('Error checking for PWA updates:', err);
    } finally {
      setTimeout(() => {
        const hasWaitingWorker = Boolean(
          needRefresh || 
          foundWaiting || 
          (registrationRef.current && registrationRef.current.waiting)
        );
        setIsUpdateAvailable(hasWaitingWorker);
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
        updateAvailable: isUpdateAvailable,
        checking,
        hasCheckedManually,
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
      updateAvailable: false,
      checking: false,
      hasCheckedManually: false,
      checkForUpdates: () => {},
      checkForUpdate: () => {},
      updateApp: () => {},
      applyUpdate: () => {}
    };
  }
  return context;
}
