/**
 * Mukiria Technical Training Institute (MTTI) Service Worker
 * Cache Strategy:
 * - App Shell & Static Assets: Network-First with Cache Fallback for offline resilience
 * - Guarantees hot-reloads and institutional theme updates apply immediately when online
 */

const CACHE_NAME = "mtti-pwa-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/mtti-logo.jpg",
];

// 1. Install event: Cache critical app shell and activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[MTTI SW] Pre-cache partial warning:", err);
      });
    })
  );
});

// 2. Activate event: Clean up ALL legacy caches & take immediate control
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

// 3. Fetch event: Always Network-First so code/style updates reflect immediately
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or Vite HMR / dev endpoints
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules/") ||
    url.search.includes("t=") ||
    url.search.includes("v=")
  ) {
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
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
          return caches.match("/");
        })
    );
    return;
  }

  // Network-First with Cache Fallback for all other GET requests
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// 4. Background Sync support
self.addEventListener("sync", (event) => {
  if (event.tag === "mtti-sync-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_BACKGROUND_SYNC" });
        });
      })
    );
  }
});
