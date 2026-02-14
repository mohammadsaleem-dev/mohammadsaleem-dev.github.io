// Theme toggle (first visit follows system, then persist user choice)
// - No HTML inline script needed
// - Keeps your fade overlay + icon crossfade behavior
const doc = document.documentElement;
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
// Scroll-spy (optimized) + click lock
// Keeps your behavior but removes forced reflow on scroll
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

  let activeId = "";
  const setActive = (id) => {
    if (id === activeId) return; // ✅ avoid useless DOM work
    activeId = id;

    items.forEach(({ a, id: sid }) => {
      const on = sid === id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  let navOffset = 78;        // cached nav height + 22
  let tops = [];             // cached section tops [{id, top}]
  let projectsTop = 0;       // cached projects top
  let ticking = false;
  let clickLockUntil = 0;

  const projectsEl = document.getElementById(PROJECTS_ID);

  const compute = () => {
    // ✅ layout reads happen here (rare), not on every scroll frame
    const navH = navInner ? navInner.getBoundingClientRect().height : 56;
    navOffset = navH + 22;

    tops = items.map(({ id, el }) => ({
      id,
      top: Math.floor(el.getBoundingClientRect().top + window.scrollY)
    }));

    projectsTop = projectsEl
      ? Math.floor(projectsEl.getBoundingClientRect().top + window.scrollY)
      : 0;
  };

  const findCurrent = (y) => {
    // binary search: last section whose top <= y
    let lo = 0, hi = tops.length - 1, ans = HOME_ID;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (tops[mid].top <= y) {
        ans = tops[mid].id;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  };

  const update = () => {
    ticking = false;

    // ✅ Don't override highlight during smooth scroll after click
    if (performance.now() < clickLockUntil) return;

    const doc = document.documentElement;

    // ✅ Bottom-of-page fix: always highlight last section
    const atBottom = (window.innerHeight + window.scrollY) >= (doc.scrollHeight - 6);
    if (atBottom) {
      const last = tops[tops.length - 1];
      if (last) setActive(last.id);
      return;
    }

    // ✅ TRUE TOP fix
    if (window.scrollY < 10) {
      setActive(HOME_ID);
      return;
    }

    const y = window.scrollY + navOffset;

    // ✅ your "Projects won't highlight early" rule (cached)
    if (projectsEl && y < projectsTop) {
      setActive(HOME_ID);
      return;
    }

    setActive(findCurrent(y));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  // ✅ Click: set active immediately and lock briefly
  links.forEach(a => {
    a.addEventListener("click", (e) => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);

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

  // Recompute on layout changes (images/fonts/resize)
  const recomputeSoon = () => {
    compute();
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    // Debounce resize (zoom triggers many resize events)
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      recomputeSoon(); // compute + update once after resizing stops
    }, 140);
  }, { passive: true });

  window.addEventListener("load", () => {
    recomputeSoon();
    setTimeout(recomputeSoon, 200);
    setTimeout(recomputeSoon, 600);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(recomputeSoon).catch(() => {});
  }

  // first run
  compute();
  requestAnimationFrame(update);
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
      const reg = await navigator.serviceWorker.register("/sw.js?v=1.0.4");
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
