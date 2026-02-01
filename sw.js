/* sw.js */
const CACHE_VERSION = "v1.0.2";
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",                 // ok for navigation fallback
  "index.html",
  "css/style.css",
  "js/main.js",
  "manifest.webmanifest",

  "assets/favicon.png",
  "assets/profile.png",
  "assets/preview.png",
  "assets/resume.pdf",

  "assets/uoj.png",
  "assets/aljazeera.png",
  "assets/edco.png",
  "assets/cisco.png",
  "assets/aws.png",
  "assets/sololearn.png",
  "assets/coursera.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);

    // Cache each item individually so one 404 doesn’t kill the whole install
    const results = await Promise.allSettled(
      PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" })))
    );

    // Optional: log failed ones
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn("Precache failed:", PRECACHE_URLS[i], r.reason);
      }
    });

    await self.skipWaiting();
  })());
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

    // ✅ Cache Google Fonts & CDN assets (FontAwesome, Google Fonts)
  if (
    req.url.includes("fonts.googleapis.com") ||
    req.url.includes("fonts.gstatic.com") ||
    req.url.includes("cdnjs.cloudflare.com")
  ) {
    event.respondWith(
      caches.open(RUNTIME).then(cache =>
        fetch(req)
          .then(res => {
            cache.put(req, res.clone());
            return res;
          })
          .catch(() => caches.match(req))
      )
    );
    return;
  }

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
