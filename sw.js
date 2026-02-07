/* sw.js (UPDATED) */
const CACHE_VERSION = "v1.0.3"; // ✅ bump this on every deploy
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;

// ✅ IMPORTANT: use absolute paths (GitHub Pages-safe)
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/manifest.webmanifest",
  "/assets/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);

    // Cache each item individually so one 404 doesn’t kill the whole install
    const results = await Promise.allSettled(
      PRECACHE_URLS.map((url) =>
        cache.add(new Request(url, { cache: "reload" }))
      )
    );

    // Optional: log failed ones (visible in SW console)
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn("Precache failed:", PRECACHE_URLS[i], r.reason);
      }
    });

    //await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key);
      })
    );
    await self.clients.claim();
  })());
});

// =========================
// Strategies
// =========================

// Cache-first (good for images, pdf, etc.)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(RUNTIME);

  if (response && response.status === 200 && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}

// Network-first (good for HTML navigation)
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
    return cached || (await caches.match("/index.html")) || (await caches.match("/"));
  }
}

// ✅ Stale-while-revalidate (best for JS/CSS so you never get “new HTML + old JS”)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ✅ Cache Google Fonts & CDN assets
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("cdnjs.cloudflare.com")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // ✅ 1) Navigations
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // ✅ 2) Same-origin assets
  if (url.origin === self.location.origin) {
    // ✅ always keep JS/CSS fresh
    if (req.destination === "script" || req.destination === "style") {
      event.respondWith(staleWhileRevalidate(req));
      return;
    }

    // ✅ images / pdf / others can be cache-first
    event.respondWith(cacheFirst(req));
    return;
  }

  // ✅ 3) Cross-origin fallback
  event.respondWith(caches.match(req).then((c) => c || fetch(req)));
});

/* sw.js (ADD THIS MESSAGE LISTENER)
   Put this anywhere in sw.js (top or bottom) */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
