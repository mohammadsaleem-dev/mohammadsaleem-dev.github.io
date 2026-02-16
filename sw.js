/* sw.js (CLEAN + STABLE) */
const CACHE_VERSION = "v1.0.7"; // bump on every deploy
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;

// ✅ Precache *critical shell* so theme + UI stays consistent
// Use absolute paths for GitHub Pages
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

    // ✅ Bypass HTTP cache on install so updates actually download
    const requests = PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }));

    const results = await Promise.allSettled(requests.map((req) => cache.add(req)));

    // Optional: log failures (won't break install)
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn("Precache failed:", PRECACHE_URLS[i], r.reason);
      }
    });

    // ✅ Activate ASAP (we also support SKIP_WAITING message)
    await self.skipWaiting();
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

    // Take control immediately
    await self.clients.claim();
  })());
});

// -------------------------
// Strategies
// -------------------------
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const res = await fetch(request);
  const cache = await caches.open(RUNTIME);

  // Cache same-origin “basic” responses only
  if (res && res.ok && res.type === "basic") cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === "basic") cache.put(request, res.clone());
    return res;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match("/index.html")) ||
      (await caches.match("/"))
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type === "basic") cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ✅ HTML navigations
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // ✅ Same-origin assets
  if (url.origin === self.location.origin) {
    // Keep CSS/JS stable + refresh in background (prevents mismatch)
    if (req.destination === "style" || req.destination === "script") {
      event.respondWith(staleWhileRevalidate(req));
      return;
    }

    // Images/fonts/etc.
    event.respondWith(cacheFirst(req));
    return;
  }

  // ✅ Cross-origin (fonts/cdn): SWR is best
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("cdnjs.cloudflare.com")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Default: just try cache then network
  event.respondWith(caches.match(req).then((c) => c || fetch(req)));
});

// ✅ Message: allow page to force activate waiting SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
