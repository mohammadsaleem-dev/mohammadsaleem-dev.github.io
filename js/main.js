
let clickLockUntil = 0;

  // Click: set active immediately + lock briefly
  links.forEach(a => {
    a.addEventListener("click", () => {
      const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);
      setActive(id);
      clickLockUntil = performance.now() + 1100;
    });
links.forEach(a => {
  a.addEventListener("click", (e) => {

    const id = decodeURIComponent(a.getAttribute("href") || "").slice(1);

    // ✅ HARD FIX: Home must scroll to TRUE TOP
    if (id === HOME_ID) {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      setActive(HOME_ID);
      clickLockUntil = performance.now() + 900;
      return;
    }

    // Normal behavior for other links
    setActive(id);
    clickLockUntil = performance.now() + 1100;
});
});

// ✅ Force Home when the Home section is the one under the navbar
const homeEl = document.getElementById(HOME_ID);
