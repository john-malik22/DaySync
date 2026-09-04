import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { registerPlugin } from '@capacitor/core';
import pkg from '../../package.json';

const NativeAppUpdate = registerPlugin('AppUpdate');

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
  const currentVersion = pkg.version || '2.0.0';

  const [checking, setChecking] = useState(false);
  const [hasCheckedManually, setHasCheckedManually] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  // APK Download state
  const [downloadStatus, setDownloadStatus] = useState('idle'); // 'idle' | 'downloading' | 'completed' | 'error'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);

  // Release notes dictionary
  const [releases, setReleases] = useState({});
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);

  const registrationRef = useRef(null);

  // GitHub Release API for Android Updates
  const checkGitHubRelease = useCallback(async () => {
    try {
      const res = await fetch('https://api.github.com/repos/john-malik22/DaySync/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const data = await res.json();
        const rawTag = data.tag_name || '';
        const cleanVersion = rawTag.replace(/^v/i, '').trim();

        if (cleanVersion) {
          setLatestVersion(cleanVersion);

          // Locate attached APK asset
          const apkAsset = Array.isArray(data.assets) ? data.assets.find(a => a.name && a.name.endsWith('.apk')) : null;
          const targetUrl = apkAsset?.browser_download_url || data.html_url || 'https://github.com/john-malik22/DaySync/releases/latest';
          setDownloadUrl(targetUrl);

          if (data.body) {
            const lines = data.body.split('\n')
              .map(l => l.replace(/^[-*•]\s*/, '').trim())
              .filter(l => l && !l.startsWith('#'));
            if (lines.length > 0) {
              setReleaseNotes(lines);
            }
          }

          const isNewer = compareSemVer(cleanVersion, currentVersion) > 0;
          const isNativeAndroid = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform() || window.Capacitor?.getPlatform() === 'android');

          if (isNativeAndroid && isNewer) {
            setIsUpdateAvailable(true);
          }
        }
      }
    } catch (e) {
      console.warn('Unable to check GitHub Releases:', e);
    }
  }, [currentVersion]);

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
    checkGitHubRelease();
  }, [fetchReleases, checkGitHubRelease]);

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
    if (releaseNotes && releaseNotes.length > 0) {
      return releaseNotes;
    }
    if (!versionStr) return DEFAULT_HIGHLIGHTS;
    const targetKey = String(versionStr).replace(/^v/i, '');
    if (releases[targetKey] && Array.isArray(releases[targetKey].highlights)) {
      return releases[targetKey].highlights;
    }
    return DEFAULT_HIGHLIGHTS;
  }, [releases, releaseNotes]);

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

    // 1. Check GitHub Release for Android / PWA
    await checkGitHubRelease();

    // 2. Fetch latest version from /version.json & releases.json
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

    // 3. Query service worker registration update
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

        setIsUpdateAvailable(prev => prev || isNewerVersion || hasWaitingWorker);
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

  const startApkDownload = useCallback(async (targetUrl) => {
    const apkUrl = targetUrl || downloadUrl;
    if (!apkUrl) {
      console.error('[DaySync Update] No download URL available!');
      setDownloadStatus('error');
      setDownloadError('No download URL available for update.');
      return;
    }

    setDownloadStatus('downloading');
    setDownloadProgress(30);
    setDownloadError(null);

    const isNativeAndroid = typeof window !== 'undefined' && (
      Boolean(window.Capacitor?.isNativePlatform()) ||
      window.Capacitor?.getPlatform() === 'android' ||
      window.Capacitor?.platform === 'android'
    );

    console.log('[DaySync Update] startApkDownload invoked:');
    console.log('  - isNativeAndroid:', isNativeAndroid);
    console.log('  - apkUrl:', apkUrl);

    try {
      if (isNativeAndroid) {
        console.log('[DaySync Update] Invoking NativeAppUpdate.downloadAndInstall({ url }) via native Java plugin...');
        setDownloadProgress(60);
        await NativeAppUpdate.downloadAndInstall({ url: apkUrl });
        console.log('[DaySync Update] Native download and package installer launch completed!');
      } else {
        console.log('[DaySync Update] Opening external window for Web/PWA...');
        window.open(apkUrl, '_blank');
      }

      setDownloadProgress(100);
      setDownloadStatus('completed');
    } catch (err) {
      console.error('[DaySync Update] Native download/install error:', err);
      setDownloadStatus('error');
      setDownloadError('Failed to download update APK: ' + (err?.message || err || 'Unknown error'));
    }
  }, [downloadUrl]);

  const applyUpdate = () => {
    const isNativeAndroid = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform() || window.Capacitor?.getPlatform() === 'android');
    if ((isNativeAndroid || downloadUrl) && downloadUrl) {
      startApkDownload(downloadUrl);
    } else {
      updateApp();
    }
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
        downloadUrl,
        downloadStatus,
        downloadProgress,
        downloadError,
        startApkDownload,
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
