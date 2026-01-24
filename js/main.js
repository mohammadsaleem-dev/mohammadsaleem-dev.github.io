// Theme toggle (no white flash) + smooth icon
const toggle = document.getElementById("themeToggle");
const fade = document.getElementById("themeFade");

const setIcon = () => {
  toggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
};

(function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light");
  setIcon();

  toggle.addEventListener("click", () => {
    // 1) Freeze CURRENT background into overlay (pre-toggle)
    const cs = getComputedStyle(document.body);
    fade.style.backgroundColor = cs.backgroundColor;
    fade.style.backgroundImage = cs.backgroundImage;
    fade.style.backgroundSize = cs.backgroundSize;
    fade.style.backgroundPosition = cs.backgroundPosition;
    fade.style.backgroundRepeat = cs.backgroundRepeat;

    // show overlay instantly (covers while switching)
    fade.style.transition = "none";
    fade.style.opacity = "1";
    void fade.offsetHeight; // force reflow
    fade.style.transition = "opacity 320ms ease";

    // 2) Animate icon
    toggle.classList.remove("icon-swap");
    void toggle.offsetWidth;
    toggle.classList.add("icon-swap");

    // 3) Toggle theme
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    setIcon();

    // 4) Fade overlay OUT (reveals new theme smoothly)
    requestAnimationFrame(() => {
      fade.style.opacity = "0";
    });

    // cleanup icon class
    setTimeout(() => toggle.classList.remove("icon-swap"), 320);
  }, { passive: true });
})();


// Optimize background orb on slow devices
(function optimizeBackground(){
  const orb = document.getElementById("bgOrb");
  if (!orb) return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowEnd =
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  if (reduceMotion || lowEnd) orb.style.animation = "none";
})();

// Scroll-to-top fix (only when no hash)
(function () {
  const hasHash = window.location.hash && window.location.hash.length > 1;
  if (!hasHash) {
    window.scrollTo(0, 0);
    window.addEventListener("load", () => window.scrollTo(0, 0), { once: true, passive: true });
  }
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

// =========================
// INTRO typing screen + replay on MS click
// =========================
(function(){
  const overlay = document.getElementById("introOverlay");
  const introTextEl = document.getElementById("introText");
  const skipBtn = document.getElementById("skipIntroBtn");
  const brand = document.getElementById("brandHome");

  const FULL_TEXT = "Eng Mohammad Saleem";
  let typingTimer = null;
  let stageTimer = null;
  let isRunning = false;

  const clearTimers = () => {
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    if (stageTimer) { clearTimeout(stageTimer); stageTimer = null; }
  };

  const showOverlay = () => {
    overlay.classList.remove("intro-hide");
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  };

  const hideOverlay = () => {
    overlay.classList.add("intro-hide");
    overlay.setAttribute("aria-hidden", "true");
    stageTimer = setTimeout(() => {
      overlay.style.display = "none";
    }, 280);
  };

  const runIntro = () => {
    clearTimers();
    isRunning = true;
    showOverlay();
    introTextEl.textContent = "";

    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { window.scrollTo(0,0); }

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      introTextEl.textContent = FULL_TEXT;
      stageTimer = setTimeout(() => { hideOverlay(); isRunning = false; }, 650);
      return;
    }

    let i = 0;

    typingTimer = setInterval(() => {
      introTextEl.textContent = FULL_TEXT.slice(0, i + 1);
      i++;

      if (i >= FULL_TEXT.length) {
        clearInterval(typingTimer);
        typingTimer = null;

        stageTimer = setTimeout(() => {
          hideOverlay();
          isRunning = false;
        }, 700);
      }
    }, 55);
  };

  skipBtn.addEventListener("click", () => {
    clearTimers();
    introTextEl.textContent = FULL_TEXT;
    hideOverlay();
    isRunning = false;
  });

  brand.addEventListener("click", (e) => {
    e.preventDefault();
    if (isRunning) return;
    runIntro();
  });

  window.addEventListener("load", () => runIntro(), { once: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") {
      clearTimers();
      hideOverlay();
      isRunning = false;
    }
  });
})();


// =========================
// Verification counters (animate when visible)
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

    const duration = 900;
    const start = performance.now();

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
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
