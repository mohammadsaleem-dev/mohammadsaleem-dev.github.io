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
// Scroll-spy (NO forced reflow) + click lock
// =========================
(function () {
  const links = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  if (!links.length) return;

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

  let clickLockUntil = 0;

  // ✅ Click: set active immediately and lock updates briefly
  links.forEach(a => {
    a.addEventListener("click", () => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);
      setActive(id);
      clickLockUntil = performance.now() + 1100; // smooth-scroll time
    });
  });

const updateBottomState = () => {
  if (performance.now() < clickLockUntil) return;

  // ✅ TOP FIX: when you are near the top, force Home active
  if (window.scrollY <= 80) {
    setActive("home");
    return;
  }

  // ✅ Bottom-of-page fix (Contact stays active)
  const doc = document.documentElement;
  const atBottom = (window.innerHeight + window.scrollY) >= (doc.scrollHeight - 6);
  if (atBottom) {
    const last = items[items.length - 1];
    if (last) setActive(last.id);
  }
};

  window.addEventListener("scroll", updateBottomState, { passive: true });
  window.addEventListener("resize", updateBottomState, { passive: true });

  // ✅ Best solution: IntersectionObserver (no layout thrash)
  if (!("IntersectionObserver" in window)) {
    // Fallback: just keep bottom fix + click behavior
    requestAnimationFrame(updateBottomState);
    return;
  }

  // rootMargin controls when a section becomes "active"
  const io = new IntersectionObserver((entries) => {
    if (performance.now() < clickLockUntil) return;

    // Pick the top-most visible section
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length) {
      setActive(visible[0].target.id);
    } else {
      // if nothing is visible (rare), keep bottom behavior
      updateBottomState();
    }
  }, {
    root: null,
    rootMargin: "-35% 0px -60% 0px",
    threshold: 0.01
  });

  items.forEach(({ el }) => io.observe(el));

  // initial state
  setActive("top");
  requestAnimationFrame(updateBottomState);
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
