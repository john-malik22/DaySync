import React, { createContext, useContext, useState, useRef } from 'react';
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
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    }
  });

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

  const applyUpdate = () => {
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
        updateAvailable: hasCheckedManually && isUpdateAvailable,
        checking,
        hasCheckedManually,
        checkForUpdates,
        applyUpdate
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
      applyUpdate: () => {}
    };
  }
  return context;
}
