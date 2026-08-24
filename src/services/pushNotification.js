import { api } from './api.js';

/**
 * Converts a base64 VAPID public key to Uint8Array format required by PushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array(0);
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const atobFn = typeof window !== 'undefined' ? window.atob : globalThis.atob;
  const rawData = atobFn(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Web Push notifications are supported on the current device/browser.
 */
export function isPushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

/**
 * Retrieves current browser notification permission status ('granted', 'denied', or 'default').
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Executes full Web Push Subscription workflow triggered by user action:
 * 1. Checks browser support
 * 2. Requests explicit Notification permission
 * 3. Fetches VAPID public key from backend API
 * 4. Creates PushSubscription with ServiceWorker
 * 5. Sends subscription to backend for the authenticated user
 */
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported on this device/browser.' };
  }

  try {
    // 1. Request Permission explicitly upon user action
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied'
          ? 'Notifications are blocked in your browser/device settings.'
          : 'Notification permission was not granted.'
      };
    }

    // 2. Get VAPID public key from backend
    const { vapidPublicKey } = await api.getVapidPublicKey();
    if (!vapidPublicKey) {
      return { success: false, error: 'Server VAPID public key unavailable.' };
    }

    // 3. Get active Service Worker Registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return { success: false, error: 'Service worker is not ready.' };
    }

    // 4. Create PushSubscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 5. Register subscription on backend for authenticated user
    const subJson = subscription.toJSON();
    await api.subscribePush(subJson);

    return { success: true, permission: 'granted', subscription };
  } catch (err) {
    console.error('[PushNotification] Error subscribing to push:', err);
    return { success: false, error: err.message || 'Unable to subscribe to push notifications.' };
  }
}

/**
 * Unsubscribes current device from Web Push notifications:
 * 1. Unsubscribes from Service Worker PushManager
 * 2. Removes endpoint on backend
 */
export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return { success: true };

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.unsubscribePush(endpoint);
      }
    }
    return { success: true };
  } catch (err) {
    console.warn('[PushNotification] Error unsubscribing:', err);
    return { success: false, error: err.message };
  }
}
