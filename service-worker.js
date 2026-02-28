// Budget Expense Tracker - Service Worker v3.0
// Improved caching strategy with offline support

const CACHE_NAME = 'budget-tracker-v3.0';
const STATIC_CACHE = 'budget-static-v3.0';
const DYNAMIC_CACHE = 'budget-dynamic-v3.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png'
];

// External resources to cache when used
const EXTERNAL_ASSETS = [
    'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/vue@2',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing v3.0...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                // Cache local assets first
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Try to cache external assets (may fail if offline)
                return caches.open(DYNAMIC_CACHE).then(cache => {
                    return Promise.allSettled(
                        EXTERNAL_ASSETS.map(url => 
                            cache.add(url).catch(err => {
                                console.log('Could not cache external asset:', url);
                            })
                        )
                    );
                });
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('Service Worker: Installation failed', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating v3.0...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') return;

    // Skip analytics and tracking requests
    if (url.hostname.includes('analytics') || url.hostname.includes('tracking')) return;

    // For HTML pages - Network first, fallback to cache
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then(response => {
                        return response || caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // For CSS, JS, and fonts - Stale while revalidate
    if (request.url.match(/\.(css|js|woff2?|ttf|eot)$/i) || 
        EXTERNAL_ASSETS.some(asset => request.url.startsWith(asset.split('?')[0]))) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                const fetchPromise = fetch(request)
                    .then(networkResponse => {
                        if (networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // For images - Cache first, fallback to network
    if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then(response => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Default: Cache first, then network
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then(response => {
                    // Don't cache if response is not successful
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered');
    if (event.tag === 'sync-expenses') {
        event.waitUntil(syncExpenses());
    }
});

async function syncExpenses() {
    // This would sync any pending offline data to a server
    // For now, it's a placeholder for future backend integration
    console.log('Service Worker: Syncing expenses data...');
    return Promise.resolve();
}

// Push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    let data = {
        title: 'Budget Expense Tracker',
        body: 'You have a new notification',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-96x96.png'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || './icons/icon-192x192.png',
        badge: data.badge || './icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: data.url || './'
        },
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || './';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if app is already open
                for (const client of windowClients) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if not already open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Message handler for communication with main app
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-budget-alerts') {
        event.waitUntil(checkBudgetAlerts());
    }
});

async function checkBudgetAlerts() {
    // Placeholder for periodic budget checking
    // Would integrate with push notifications for budget alerts
    console.log('Service Worker: Checking budget alerts...');
    return Promise.resolve();
}