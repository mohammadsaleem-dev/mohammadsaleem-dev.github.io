// Theme toggle (no white flash) + stable icon crossfade
const toggle = document.getElementById("themeToggle");
const fade = document.getElementById("themeFade");

const syncToggleIcon = () => {
  toggle.classList.toggle("is-light", document.body.classList.contains("light"));
};

(function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light");
  syncToggleIcon();

  toggle.addEventListener("click", () => {
    // Prevent hover transforms / weird mid-toggle pops
    document.body.classList.add("theme-switching");

    // snapshot current background into overlay
    const cs = getComputedStyle(document.body);
    fade.style.backgroundColor = cs.backgroundColor;
    fade.style.backgroundImage = cs.backgroundImage;
    fade.style.backgroundSize = cs.backgroundSize;
    fade.style.backgroundPosition = cs.backgroundPosition;
    fade.style.backgroundRepeat = cs.backgroundRepeat;

    // show overlay
    fade.classList.add("show");

    // switch theme next frame
    requestAnimationFrame(() => {
      document.body.classList.toggle("light");
      localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");

      // update meta theme-color
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", document.body.classList.contains("light") ? "#ffffff" : "#0d1117");
      }

      // icon crossfade (no emoji swapping)
      syncToggleIcon();

      // fade overlay out
      requestAnimationFrame(() => fade.classList.remove("show"));

      // release "theme-switching" after transition finishes
      window.setTimeout(() => {
        document.body.classList.remove("theme-switching");
      }, 540);
    });
  });
})();

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

    const fmt = () => new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
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
// Scroll-spy (single source of truth) + click lock (FIXED)
// =========================
(function () {
  const nav = document.querySelector(".nav");
  const navLinksWrap = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");

  const links = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  if (!links.length) return;

  const HOME_ID = "home";
  const LOCK_MS = 900;

  let clickLockUntil = 0;
  let observer = null;

  // Map anchors -> sections
  const items = links
    .map((a) => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);
      const el = document.getElementById(id);
      return el ? { a, el, id } : null;
    })
    .filter(Boolean);

  function setActive(id) {
    items.forEach(({ a, id: sid }) => {
      a.classList.toggle("active", sid === id);
      a.setAttribute("aria-current", sid === id ? "page" : "false");
    });
  }

  function closeMobileMenuIfOpen() {
    if (!navLinksWrap) return;
    if (navLinksWrap.classList.contains("is-open")) {
      navLinksWrap.classList.remove("is-open");
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    }
  }

  // 1) Click handling (ONLY ONCE)
  items.forEach(({ a, id }) => {
    a.addEventListener("click", (e) => {
      // Always lock to prevent observer fighting the click
      clickLockUntil = performance.now() + LOCK_MS;

      // Home = true top
      if (id === HOME_ID) {
        e.preventDefault();
        closeMobileMenuIfOpen();
        setActive(HOME_ID);

        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Normal anchors
      closeMobileMenuIfOpen();
      setActive(id);
      // Let browser handle the anchor jump (or smooth scroll via CSS)
    });
  });

  // 2) IntersectionObserver scroll-spy (stable)
  function setupObserver() {
    if (observer) observer.disconnect();

    // Height of sticky nav (so we detect "under nav" correctly)
    const navH = nav?.getBoundingClientRect().height || 56;

    // When a section is near the top (below navbar), mark it active.
    // The negative top margin shifts the "active line" downward.
    observer = new IntersectionObserver(
      (entries) => {
        // Don’t update active while a click scroll is in progress
        if (performance.now() < clickLockUntil) return;

        // Pick the entry closest to top that is intersecting
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          const id = visible[0].target.id;
          setActive(id);
          return;
        }

        // Fallback: if you're at the very top, force Home
        if (window.scrollY <= 2) setActive(HOME_ID);
      },
      {
        root: null,
        rootMargin: `-${Math.ceil(navH + 10)}px 0px -60% 0px`,
        threshold: [0.01, 0.1, 0.2],
      }
    );

    items.forEach(({ el }) => observer.observe(el));
  }

  // 3) Initial state on load (fix Ctrl+F5 / refresh)
  function initActive() {
    // If URL has hash, use it
    const hash = decodeURIComponent(location.hash || "").replace("#", "");
    if (hash && document.getElementById(hash)) {
      setActive(hash);
      return;
    }

    // If at top, Home
    if (window.scrollY <= 2) {
      setActive(HOME_ID);
      return;
    }

    // Otherwise: pick the section closest under navbar
    const navH = nav?.getBoundingClientRect().height || 56;
    const y = window.scrollY + navH + 12;

    let best = { id: HOME_ID, dist: Infinity };
    items.forEach(({ id, el }) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const dist = Math.abs(top - y);
      if (dist < best.dist) best = { id, dist };
    });
    setActive(best.id);
  }

  // Run
  setupObserver();
  initActive();

  // Rebuild observer when layout changes (fonts load / resize)
  window.addEventListener("resize", () => {
    setupObserver();
    initActive();
  });

  // If user scrolls to very top, force Home immediately
  window.addEventListener("scroll", () => {
    if (performance.now() < clickLockUntil) return;
    if (window.scrollY <= 2) setActive(HOME_ID);
  }, { passive: true });

})();

// =========================
// PWA Service Worker Register
// =========================
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => {
        // registered ✅
      })
      .catch((err) => {
        console.warn("SW register failed:", err);
      });
  });
})();
