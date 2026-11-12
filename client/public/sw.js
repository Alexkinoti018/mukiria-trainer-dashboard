/**
 * Mukiria Technical Training Institute (MTTI) Service Worker
 * Institutional PWA Offline Shell & Asset Cache Engine
 *
 * Cache Strategy:
 * 1. App Shell & Static Assets: Cache-First for content-hashed assets, Network-First for navigation
 *    ensuring Labs 1A–3 can open and operate the dashboard even with intermittent or zero campus Wi-Fi.
 * 2. Strict /api/* Bypass: NEVER cache authenticated /api/* JSON responses in Service Worker HTTP cache;
 *    keeps API data strictly in IndexedDB/React state so purgeMTTISessionCache() on logout remains airtight.
 * 3. Typography: Caches Google Fonts stylesheets and font binaries for offline lab typography.
 * 4. Hot-reloads & version updates take immediate effect via skipWaiting & clients.claim.
 */

const CACHE_NAME = "mtti-pwa-v11";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/mtti-logo.jpg",
  "/tvet-cdacc-logo.png",
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

// 1. Install event: Precache core app shell and activate immediately
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
            console.log("[MTTI SW] Purging obsolete cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event:
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // STRICT SECURITY INVARIANT:
  // Never intercept or cache authenticated /api/* JSON responses in Service Worker HTTP cache.
  // All API data remains strictly in React memory or IndexedDB, ensuring purgeMTTISessionCache()
  // on logout or terminal idle timeout remains 100% airtight.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

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

  // Font caching for offline typography
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(request, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cached);
        });
      })
    );
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

  // Immutable content-hashed static assets (/assets/*): Cache-First for instant offline loading
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-First with Cache Fallback for all other static GET requests
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
