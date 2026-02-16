// Theme toggle (first visit follows system, then persist user choice)
// - No HTML inline script needed
// - Keeps your fade overlay + icon crossfade behavior

const toggle = document.getElementById("themeToggle");
const fade = document.getElementById("themeFade");

const THEME_KEY = "theme";
const LIGHT_CLASS = "light";
const SWITCHING_CLASS = "theme-switching";
const TRANSITION_MS = 540;

if (toggle && fade) {
  const root = document.documentElement; // ✅ html element

  const isLight = () => root.classList.contains(LIGHT_CLASS);

  const setTheme = (mode /* "light" | "dark" */) => {
    root.classList.toggle(LIGHT_CLASS, mode === "light");

    // persist user choice
    localStorage.setItem(THEME_KEY, mode);

    // meta theme-color
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", mode === "light" ? "#ffffff" : "#0d1117");
  };

  const syncToggleIcon = () => {
    toggle.classList.toggle("is-light", isLight());
  };

const snapshotBodyBgToFade = () => {
  const csRoot = getComputedStyle(root);
  const csBody = getComputedStyle(document.body);
  fade.style.backgroundColor = csBody.backgroundColor || csRoot.backgroundColor;
  fade.style.backgroundImage = csBody.backgroundImage || csRoot.backgroundImage;
  fade.style.backgroundSize = csBody.backgroundSize || csRoot.backgroundSize;
  fade.style.backgroundPosition = csBody.backgroundPosition || csRoot.backgroundPosition;
  fade.style.backgroundRepeat = csBody.backgroundRepeat || csRoot.backgroundRepeat;
};

  const applyInitialTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);

    // ✅ first visit: no saved → follow system
    if (!saved) {
      const systemPrefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;

      root.classList.toggle(LIGHT_CLASS, systemPrefersLight);
    } else {
      // ✅ later visits: saved choice wins
      root.classList.toggle(LIGHT_CLASS, saved === "light");
    }

    syncToggleIcon();
  };

  applyInitialTheme();

  toggle.addEventListener("click", () => {
    document.body.classList.add(SWITCHING_CLASS);
    root.classList.add(SWITCHING_CLASS);

    snapshotBodyBgToFade();
    fade.classList.add("show");

    requestAnimationFrame(() => {
      const next = isLight() ? "dark" : "light";
      setTheme(next);

      syncToggleIcon();

      requestAnimationFrame(() => fade.classList.remove("show"));

      window.setTimeout(() => {
        document.body.classList.remove(SWITCHING_CLASS);
        root.classList.remove(SWITCHING_CLASS);
      }, TRANSITION_MS);
    });
  });
}

    // Mobile/Tablet menu toggle (<=1024px)
    (function () {
      const btn = document.getElementById("menuBtn");
      const links = document.getElementById("navLinks");
      if (!btn || !links) return;

      const closeMenu = () => {
        links.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      };

      btn.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      links.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

      document.addEventListener("click", (e) => {
        if (!links.classList.contains("is-open")) return;
        const clickedInside = links.contains(e.target) || btn.contains(e.target);
        if (!clickedInside) closeMenu();
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) closeMenu();
      }, { passive: true });
    })();

    // Scroll reveal (disconnect once done)
    (function () {
      const els = document.querySelectorAll(".reveal");
      if (!("IntersectionObserver" in window)) {
        els.forEach(el => el.classList.add("show"));
        return;
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });

      els.forEach(el => io.observe(el));
    })();

    // Back to top button
    (function(){
      const btn = document.getElementById("toTop");
      if (!btn) return;

      const toggleBtn = () => {
        if (window.scrollY > 600) btn.classList.add("show");
        else btn.classList.remove("show");
      };
      window.addEventListener("scroll", toggleBtn, { passive: true });
      toggleBtn();

      btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    })();

    // Live Clock aligned to second boundaries (less drift)
    (function(){
      const el = document.getElementById("liveTime");
      if (!el) return;

    const jordanClock = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Amman",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    
    const fmt = () => jordanClock.format(new Date());

// =========================
// Weather (Amman) + C/F toggle (saved) + animated temp swap
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const weatherEl = document.getElementById("weatherText");
  const buttons = Array.from(document.querySelectorAll(".unit-btn"));
  if (!weatherEl || buttons.length === 0) return;

  const STORAGE_KEY = "tempUnit";
  const CITY = "Amman";
  const LAT = 31.9539;
  const LON = 35.9106;
  const TZ = "Asia/Amman";

  let lastC = null;
    // ✅ Skip weather fetch for bots/crawlers (fixes Google test warnings)
  const isBot =
    typeof navigator !== "undefined" &&
    /bot|crawl|spider|slurp|googlebot|bingbot|duckduckbot|baiduspider|yandex/i.test(navigator.userAgent);

  const cToF = (c) => (c * 9) / 5 + 32;

  const getUnit = () => localStorage.getItem(STORAGE_KEY) || "C";
  const setUnit = (unit) => localStorage.setItem(STORAGE_KEY, unit);

  const setActive = (unit) => {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.unit === unit));
  };

const renderTemp = (unit) => {
  if (lastC == null) {
    weatherEl.textContent = `${CITY} --°${unit}`;
    return;
  }
  const val = unit === "F" ? Math.round(cToF(lastC)) : Math.round(lastC);
  weatherEl.textContent = `${CITY} ${val}°${unit}`;
};

  async function loadWeather() {
    try {
      // ✅ Googlebot / crawler: don’t call Open-Meteo
      if (isBot) {
        const unit = getUnit();
        setActive(unit);
        renderTemp(unit, false);
        return;
      }
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m&timezone=${encodeURIComponent(TZ)}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      lastC = data?.current?.temperature_2m ?? null;

      const unit = getUnit();
      setActive(unit);
      renderTemp(unit, false);
    } catch {
      const unit = getUnit();
      setActive(unit);
      renderTemp(unit, false);
    }
  }

  // init
  const unit = getUnit();
  setActive(unit);
  renderTemp(unit, false);

  // click handlers
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const unit = btn.dataset.unit;
      setUnit(unit);
      setActive(unit);
      renderTemp(unit); 
    });
  });

  loadWeather();
  setInterval(loadWeather, 15 * 60 * 1000);
});

const tick = () => { el.textContent = fmt(); };
      
      tick();
      const now = Date.now();
      const delay = 1000 - (now % 1000);

      setTimeout(() => {
        tick();
        setInterval(tick, 1000);
      }, delay);
    })();

/* =========================
   INTRO (LOGO DRAW + SIGNATURE DRAW) + replay on MS click
========================= */
(function () {
  const overlay = document.getElementById("introOverlay");
  const skipBtn = document.getElementById("skipIntroBtn");
  const brand = document.getElementById("brandHome");

  if (!overlay || !skipBtn) return;

  const msPaths = overlay.querySelectorAll(".ms-stroke");
  const sigPaths = overlay.querySelectorAll(".sig-path");

  let isRunning = false;
  let hideTimer = 0;

  const clearAll = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = 0;
  };

  const showOverlay = () => {
    overlay.style.display = "flex";
    overlay.classList.remove("intro-hide");
    overlay.setAttribute("aria-hidden", "false");
  };

  const hideOverlay = () => {
    overlay.classList.add("intro-hide");
    overlay.setAttribute("aria-hidden", "true");
    hideTimer = setTimeout(() => {
      overlay.style.display = "none";
    }, 520);
  };

  const setStrokeLen = (el, cssVarName) => {
    if (!el || !el.getTotalLength) return;
    const len = Math.ceil(el.getTotalLength());
    el.style.setProperty(cssVarName, len);
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
  };

const resetAnimations = () => {
  overlay.classList.remove("play");

  // Safari fix: force full style reset before recalculating
  msPaths.forEach(p => {
    if (!p.getTotalLength) return;

    const len = Math.ceil(p.getTotalLength());

    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;

    // IMPORTANT: remove CSS variable dependency (Safari bug)
    p.style.removeProperty("--mslen");
  });

  sigPaths.forEach(p => {
    if (!p.getTotalLength) return;

    const sl = Math.ceil(p.getTotalLength());

    p.style.strokeDasharray = sl;
    p.style.strokeDashoffset = sl;

    p.style.removeProperty("--siglen");
  });

  // HARD REFLOW (Safari requires double flush)
  overlay.getBoundingClientRect();
  void overlay.offsetHeight;
};

const runIntro = ({ goTop }) => {
  if (isRunning) return;
  isRunning = true;
  clearAll();

  if (goTop) {
    try { window.scrollTo({ top: 0, behavior: "auto" }); }
    catch { window.scrollTo(0, 0); }
  }

  showOverlay();

  // ✅ iOS Safari: restart animation reliably
  overlay.classList.remove("play");
  resetAnimations();

  // double flush (Safari is picky)
  void overlay.offsetWidth;
  overlay.getBoundingClientRect();

  requestAnimationFrame(() => {
    overlay.classList.add("play");

    hideTimer = setTimeout(() => {
      hideOverlay();
      isRunning = false;
    }, 2400);
  });
};

  skipBtn.addEventListener("click", () => {
    clearAll();
    hideOverlay();
    isRunning = false;
  });

  if (brand) {
    brand.addEventListener("click", () => runIntro({ goTop: false }));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") {
      clearAll();
      hideOverlay();
      isRunning = false;
    }
  });

  const startOnce = () => {
    if (overlay.dataset.ran === "1") return;
    overlay.dataset.ran = "1";
    runIntro({ goTop: true });
  };

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      clearAll();
      isRunning = false;
      overlay.classList.add("intro-hide");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.display = "none";
      overlay.dataset.ran = "";
    }
    requestAnimationFrame(startOnce);
  });
})();

    // =========================
// Verification counters (animate when visible)
// Uses IntersectionObserver + requestAnimationFrame
// =========================
(function () {
  const counters = document.querySelectorAll(".js-count");
  if (!counters.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el) => {
    if (el.dataset.done === "1") return;
    el.dataset.done = "1";

    const target = Number(el.getAttribute("data-target") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 900; // ms
    const start = performance.now();

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * target);
      el.textContent = `${val}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  counters.forEach((el) => io.observe(el));
})();

// =========================
// Scroll-spy (single source of truth) + click lock
// (Old logic + FIX: Projects won't highlight while still in Home)
// =========================
(function () {
  const navInner = document.querySelector(".nav-inner");
  const links = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  if (!links.length) return;

  const HOME_ID = "top";
  const PROJECTS_ID = "projects";

  const items = links
    .map(a => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);
      const el = document.getElementById(id);
      return el ? { a, el, id } : null;
    })
    .filter(Boolean);

  const setActive = (id) => {
    items.forEach(({ a, id: sid }) => {
      const on = sid === id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  const getOffset = () =>
    (navInner ? navInner.getBoundingClientRect().height : 56) + 22;

  let ticking = false;
  let clickLockUntil = 0;

  const homeEl = document.getElementById(HOME_ID);
  const projectsEl = document.getElementById(PROJECTS_ID);

  const update = () => {
    ticking = false;

    // ✅ Don't override highlight during smooth scroll after click
    if (performance.now() < clickLockUntil) return;

    const y = window.scrollY + getOffset();

    // ✅ Bottom-of-page fix: always highlight last section
    const doc = document.documentElement;
    const atBottom = (window.innerHeight + window.scrollY) >= (doc.scrollHeight - 6);
    if (atBottom) {
      const last = items[items.length - 1];
      if (last) setActive(last.id);
      return;
    }

    // ✅ TRUE TOP fix
    if (window.scrollY < 10) {
      setActive(HOME_ID); // keep Home active at top
      return;
    }

    // ✅ HARD FIX for your bug:
    // If Projects top is still BELOW the "active line", then we are still in Home zone.
    // Keep Home active so Projects never highlights early.
    if (projectsEl) {
      const projectsTop = projectsEl.offsetTop;
      if (y < projectsTop) {
        setActive(HOME_ID);
        return;
      }
    }

    // ✅ Old logic: last section whose offsetTop <= y
    let current = HOME_ID;
    for (const { id, el } of items) {
      if (el.offsetTop <= y) current = id;
    }

    setActive(current);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  // ✅ Click: set active immediately and lock briefly
  links.forEach(a => {
    a.addEventListener("click", (e) => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);

      // Optional: make Home always scroll to true top
      if (id === HOME_ID) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        setActive(HOME_ID);
        clickLockUntil = performance.now() + 900;
        return;
      }

      setActive(id);
      clickLockUntil = performance.now() + 1100;
    });
  });

  // Run once now + after layout settles (fonts/images)
  requestAnimationFrame(update);
  window.addEventListener("load", () => {
    requestAnimationFrame(update);
    setTimeout(update, 120);
    setTimeout(update, 400);
  });
})();

// =========================
// PWA Service Worker Register
// =========================
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    const hadController = !!navigator.serviceWorker.controller; // ✅ capture before register
    let reloaded = false;

    try {
      // ✅ Cache-bust SW so browser checks updates immediately
      const reg = await navigator.serviceWorker.register("/sw.js?v=1.0.7");
      await reg.update();
      // ✅ If a new SW is waiting, activate it immediately (only if this is an update)
      if (reg.waiting && navigator.serviceWorker.controller) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // ✅ Reload ONLY for updates (not first install / incognito fresh load)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController) return; // first install: don't reload
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

    } catch (err) {
      console.warn("SW register failed:", err);
    }
  });
})();
