import React, { createContext, useContext, useState, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdateContext = createContext();

export function PWAUpdateProvider({ children }) {
  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);
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

  const updateAvailable = Boolean(needRefresh);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      if (registrationRef.current) {
        await registrationRef.current.update();
      } else if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          registrationRef.current = reg;
          await reg.update();
        }
      }
    } catch (err) {
      console.error('Error checking for PWA updates:', err);
    } finally {
      setTimeout(() => {
        setChecking(false);
        setCheckedOnce(true);
      }, 800);
    }
  };

  const applyUpdate = () => {
    if (needRefresh) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  return (
    <PWAUpdateContext.Provider
      value={{
        updateAvailable,
        checking,
        checkedOnce,
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
      checkedOnce: false,
      checkForUpdates: () => {},
      applyUpdate: () => {}
    };
  }
  return context;
}
