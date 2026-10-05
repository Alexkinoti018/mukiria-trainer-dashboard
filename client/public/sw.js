/**
 * Mukiria Technical Training Institute (MTTI) Service Worker
 * Cache Strategy:
 * - App Shell: Network-First with Cache Fallback for navigation requests
 * - Static Assets (JS, CSS, images, fonts): Stale-While-Revalidate
 * - Offline Fallback page support for seamless campus network dropouts
 */

const CACHE_NAME = "mtti-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/mtti-logo.jpg",
];

// 1. Install event: Cache critical app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[MTTI SW] Pre-caching offline app shell");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[MTTI SW] Pre-cache partial warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up legacy caches & take immediate control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[MTTI SW] Deleting obsolete cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Network-first for routes, Cache-first/SWR for static assets
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST to backend or Supabase)
  if (request.method !== "GET") {
    return;
  }

  // Handle SPA Navigation requests: Network-First with fallback to /index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          console.log("[MTTI SW] Navigation offline fallback for:", url.pathname);
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
          return caches.match("/");
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, images, fonts)
  const isStatic =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2|woff|ttf|ico)$/) ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// 4. Background Sync support
self.addEventListener("sync", (event) => {
  if (event.tag === "mtti-sync-queue") {
    console.log("[MTTI SW] Background sync event triggered");
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_BACKGROUND_SYNC" });
        });
      })
    );
  }
});
