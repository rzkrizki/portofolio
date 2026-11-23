(() => {
  const screen = document.querySelector(".intro-screen");
  const key = "portfolio-loader-shown-at";
  const lifetime = 3 * 60 * 60 * 1000;
  if (!screen || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const now = Date.now();
  try {
    const stored = localStorage.getItem(key);
    const shownAt = Number(stored);
    if (stored !== null && Number.isFinite(shownAt) && shownAt > 0
      && shownAt <= now && now - shownAt < lifetime) return;
    // Write only on activation; ordinary visits never extend the expiry.
    localStorage.setItem(key, String(now));
  } catch {
    // A private or restricted browser can always reach the portfolio directly.
    return;
  }

  screen.hidden = false;
  let exitTimer;
  let removeTimer;
  let safeguard;
  const interactions = ["pointerdown", "keydown", "focusin", "wheel", "touchstart", "pagehide"];

  function dismiss() {
    screen.hidden = true;
    clearTimeout(exitTimer);
    clearTimeout(removeTimer);
    clearTimeout(safeguard);
    interactions.forEach(event => window.removeEventListener(event, dismiss));
    motionPreference.removeEventListener("change", onMotionChange);
  }

  function onMotionChange(event) {
    if (event.matches) dismiss();
  }

  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  motionPreference.addEventListener("change", onMotionChange);
  interactions.forEach(event => window.addEventListener(event, dismiss, { passive: true }));

  exitTimer = setTimeout(() => {
    screen.classList.add("is-leaving");
    removeTimer = setTimeout(dismiss, 230);
  }, 650);
  safeguard = setTimeout(dismiss, 1300);
})();
