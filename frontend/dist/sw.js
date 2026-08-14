// Protein Tracker — Service Worker
// Handles background push notifications on phone lock screen

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle push from Supabase Edge Function (lock-screen notification)
self.addEventListener('push', (event) => {
  let data = { title: '💪 Protein Tracker', body: "Don't forget your protein scoop today!" };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title || '💪 Protein Tracker', {
      body: data.body || "Don't forget your daily protein scoop!",
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/' },
    })
  );
});

// Handle tap on notification — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
