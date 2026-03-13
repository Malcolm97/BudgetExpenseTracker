// Budget Expense Tracker - Service Worker v5.0
// Enhanced offline support with robust caching and data protection

const CACHE_NAME = 'budget-tracker-v5.0';
const STATIC_CACHE = 'budget-static-v5.0';
const DYNAMIC_CACHE = 'budget-dynamic-v5.0';
const DATA_CACHE = 'budget-data-v5.0';
const OFFLINE_CACHE = 'budget-offline-v5.0';

// Static assets to cache immediately (critical for offline)
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

// External resources to cache for offline use
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/vue@2',
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.0/jspdf.plugin.autotable.min.js'
];

// Install event - cache static assets aggressively
self.addEventListener('install', event => {
    console.log('Service Worker: Installing v5.0...');
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Cache external assets for offline use
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('Service Worker: Pre-caching external assets');
                return Promise.allSettled(
                    EXTERNAL_ASSETS.map(url => 
                        fetch(url, { mode: 'cors', credentials: 'omit' })
                            .then(response => {
                                if (response.ok) {
                                    console.log('Service Worker: Cached external:', url);
                                    return cache.put(url, response);
                                }
                                throw new Error('Failed to fetch: ' + url);
                            })
                            .catch(err => {
                                console.warn('Service Worker: Could not cache external asset:', url, err);
                            })
                    )
                );
            })
        ])
        .then(() => {
            console.log('Service Worker: Installation complete');
            return self.skipWaiting();
        })
        .catch(err => {
            console.error('Service Worker: Installation failed', err);
        })
    );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating v5.0...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete any cache that doesn't match our current version
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && 
                        cacheName !== DATA_CACHE &&
                        cacheName !== CACHE_NAME &&
                        cacheName !== OFFLINE_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete - claiming all clients');
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

    // Skip API calls that need fresh data (exchange rates)
    if (url.hostname.includes('exchangerate') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }

    // For HTML pages - Network first, fallback to cache
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then(cache => {
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

    // For CSS, JS, and external libraries - Stale while revalidate
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
                    .catch(() => {
                        console.log('Service Worker: Network failed for', request.url, 'serving from cache');
                        return cachedResponse;
                    });

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
                }).catch(() => {
                    // Return a placeholder or empty response for images
                    return new Response('', { status: 404 });
                });
            })
        );
        return;
    }

    // Default: Cache first, then network with offline fallback
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version, but also update cache in background
                    fetch(request).then(response => {
                        if (response && response.status === 200) {
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => {}); // Ignore network errors
                    
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then(response => {
                        // Don't cache if response is not successful
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', { 
                            status: 503, 
                            statusText: 'Service Unavailable' 
                        });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-expenses') {
        event.waitUntil(syncExpenses());
    }
    
    if (event.tag === 'backup-data') {
        event.waitUntil(performBackup());
    }
});

async function syncExpenses() {
    // Get pending changes from IndexedDB
    console.log('Service Worker: Syncing expenses data...');
    
    // Notify all clients to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_REQUIRED',
            message: 'Data sync triggered'
        });
    });
    
    return Promise.resolve();
}

async function performBackup() {
    console.log('Service Worker: Performing automatic backup...');
    
    // Notify clients to backup data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'AUTO_BACKUP',
            message: 'Automatic backup triggered'
        });
    });
    
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
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(DYNAMIC_CACHE).then(cache => {
            urls.forEach(url => {
                fetch(url).then(response => {
                    if (response.ok) {
                        cache.put(url, response);
                    }
                }).catch(() => {});
            });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                if (cacheName.includes('dynamic') || cacheName.includes('data')) {
                    caches.delete(cacheName);
                }
            });
        });
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-budget-alerts') {
        event.waitUntil(checkBudgetAlerts());
    }
    
    if (event.tag === 'auto-backup') {
        event.waitUntil(performBackup());
    }
});

async function checkBudgetAlerts() {
    console.log('Service Worker: Checking budget alerts...');
    
    // Notify clients to check budget
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'CHECK_BUDGET',
            message: 'Budget check triggered'
        });
    });
    
    return Promise.resolve();
}

// Handle errors gracefully
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled rejection:', event.reason);
});