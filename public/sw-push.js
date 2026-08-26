/**
 * DaySync Service Worker Push Event & Click Handler
 * Handles real phone / OS system notifications via Web Push API
 */

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker Push] Service Worker installing. Calling skipWaiting().');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker Push] Service Worker activating. Claiming clients.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker Push] Push event received in background.');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = 'DaySync';
  const body = data.message || data.body || 'You have a new DaySync notification.';
  const actionUrl = data.actionUrl || data.url || '/app/dashboard';

  const options = {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.eventKey || (data.id ? `daysync-notif-${data.id}` : `daysync-notif-${Date.now()}`),
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: actionUrl,
      id: data.id
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      console.log('[ServiceWorker Push] Background notification displayed cleanly.');
    }).catch((err) => {
      console.error('[ServiceWorker Push] Error displaying background notification:', err);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || client.url.includes('/app/')) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
