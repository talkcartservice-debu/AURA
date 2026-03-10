/**
 * Independent Web Push Service Worker
 */

// Service Worker Install and Fetch Handlers for PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('aurasync-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/logo192.png',
      badge: data.notification.badge || '/badge.png',
      data: data.notification.data || {},
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Close' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const data = event.notification.data;
  let url = '/';

  if (data.type === 'MESSAGE') {
    url = `/chat/${data.match_id}`;
  } else if (data.type === 'MATCH') {
    url = `/matches`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
