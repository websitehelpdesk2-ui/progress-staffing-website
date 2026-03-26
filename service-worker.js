const CACHE_NAME = 'progress-staffing-static-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Progress Staffing Agency';
  const options = {
    body: payload.body || 'New staffing update available.',
    icon: '/img.png',
    badge: '/img.png',
    tag: payload.tag || 'progress-staffing-update',
    data: {
      url: payload.url || '/portal-employee',
      shiftId: payload.data && payload.data.shiftId ? payload.data.shiftId : null,
      offerId: payload.data && payload.data.offerId ? payload.data.offerId : null,
    },
    actions: Array.isArray(payload.actions) ? payload.actions : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = new URL(data.url || '/portal-employee', self.location.origin);

  if (event.action === 'accept_shift' && data.shiftId) {
    targetUrl.searchParams.set('shiftAction', 'accept');
    targetUrl.searchParams.set('shiftId', data.shiftId);
  }

  if (event.action === 'decline_shift' && data.shiftId) {
    targetUrl.searchParams.set('shiftAction', 'decline');
    targetUrl.searchParams.set('shiftId', data.shiftId);
  }

  if (event.action === 'accept_offer' && data.offerId) {
    targetUrl.searchParams.set('offerAction', 'accept');
    targetUrl.searchParams.set('offerId', data.offerId);
  }

  if (event.action === 'decline_offer' && data.offerId) {
    targetUrl.searchParams.set('offerAction', 'decline');
    targetUrl.searchParams.set('offerId', data.offerId);
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existingClient) {
        existingClient.navigate(targetUrl.toString());
        return existingClient.focus();
      }

      return self.clients.openWindow(targetUrl.toString());
    })
  );
});