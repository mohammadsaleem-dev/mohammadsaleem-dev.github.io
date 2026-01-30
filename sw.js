/* sw.js */
const CACHE_VERSION = "v1.0.0";
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;

// ✅ Add the files you want available offline
const PRECACHE_URLS = [
  "/",                 // GitHub Pages often serves index.html here
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/manifest.webmanifest",

  // Assets you referenced directly
  "/assets/favicon.png",
  "/assets/profile.png",
  "/assets/preview.png",
  "/assets/resume.pdf",

  // Logos used in your page (add/remove as needed)
  "/assets/uoj.png",
  "/assets/aljazeera.png",
  "/assets/al-jazeera.png",
  "/assets/edco.png",
  "/assets/cisco.png",
  "/assets/aws.png",
  "/assets/sololearn.png",
  "/assets/coursera.png"
];

// Install: precache core
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Helper: Cache-first (great for static files)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(RUNTIME);

  // Cache only valid responses (opaque responses may happen for cross-origin; we skip caching those safely)
  if (response && response.status === 200 && response.type === "basic") {
    cache.put(request, response.clone());
  }

  return response;
}

// Helper: Network-first (great for HTML navigation)
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || caches.match("/index.html");
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ✅ 1) Handle navigations (clicking links / refresh / direct URL)
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // ✅ 2) Same-origin static assets -> cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ✅ 3) Cross-origin (fonts/CDN): just try cache, else network (don’t break anything)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
