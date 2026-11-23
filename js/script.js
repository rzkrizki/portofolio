const languageControl = document.querySelector(".language-control");
const languageButtons = languageControl.querySelectorAll("[data-language]");
const copyButton = document.querySelector(".copy-button");
const copyStatus = document.querySelector(".copy-status");
const emailAddress = document.querySelector(".email-link").textContent;
const descriptions = document.querySelectorAll('meta[name="description"], meta[property="og:description"]');
const englishDescription = "Rizki Ramadhan is a backend engineer in Jakarta working with Go and PHP/Laravel on transit data, fare systems, and APIs.";
const indonesianDescription = descriptions[0].content;
const storageKey = "portfolio-language";
const themeButton = document.querySelector(".theme-toggle");
const themePreference = window.matchMedia("(prefers-color-scheme: dark)");
let manualTheme = false;
try {
  manualTheme = ["light", "dark"].includes(localStorage.getItem("portfolio-theme"));
} catch {}

function updateThemeControl() {
  const dark = document.documentElement.dataset.theme === "dark";
  const label = language === "en"
    ? (dark ? "Switch to light mode" : "Switch to dark mode")
    : (dark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  themeButton.setAttribute("aria-label", label);
  themeButton.title = label;
  document.querySelector('meta[name="theme-color"]').content = dark ? "#17131E" : "#FAF4E9";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateThemeControl();
}
const messages = {
  id: {
    copied: "Alamat email disalin.",
    failed: "Email belum tersalin. Silakan salin alamat secara manual."
  },
  en: {
    copied: "Email address copied.",
    failed: "Copy failed. You can select and copy the email address."
  }
};

const translatedText = [...document.querySelectorAll("[data-en]")].map(element => ({
  element,
  id: element.textContent,
  en: element.dataset.en
}));

const translatedLabels = [...document.querySelectorAll("[data-en-label]")].map(element => ({
  element,
  id: element.getAttribute("aria-label"),
  en: element.dataset.enLabel
}));

let language = "id";
let copyResult;

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language;

  translatedText.forEach(translation => {
    translation.element.textContent = translation[language];
  });

  translatedLabels.forEach(translation => {
    translation.element.setAttribute("aria-label", translation[language]);
  });

  languageButtons.forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  });

  descriptions.forEach(description => {
    description.content = language === "en" ? englishDescription : indonesianDescription;
  });

  if (copyResult) {
    copyStatus.textContent = messages[language][copyResult];
  }
  updateThemeControl();
}

try {
  if (localStorage.getItem(storageKey) === "en") {
    setLanguage("en");
  }
} catch {
  // Keep the Indonesian default when browser storage is unavailable.
}

languageButtons.forEach(button => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // The language change still applies to the current page.
    }
  });
});

languageControl.hidden = false;
updateThemeControl();
themeButton.hidden = false;
themeButton.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  manualTheme = true;
  applyTheme(nextTheme);
  try { localStorage.setItem("portfolio-theme", nextTheme); } catch {}
});
themePreference.addEventListener("change", event => {
  if (!manualTheme) applyTheme(event.matches ? "dark" : "light");
});

if (navigator.clipboard?.writeText) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      copyResult = "copied";
    } catch {
      copyResult = "failed";
    }

    copyStatus.textContent = messages[language][copyResult];
  });
  copyButton.hidden = false;
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if ("IntersectionObserver" in window && typeof Element.prototype.animate === "function") {
  const artSequences = new Map([
    [document.querySelector(".portrait-art"), [
      [".portrait-backing", [
        { transform: "translate(8px, 7px)" },
        { transform: "translate(0, 0)" }
      ], 600]
    ]],
    [document.querySelector(".transit-art"), [
      [".transit-trace", [
        { strokeDasharray: ".13 .87", strokeDashoffset: .13, opacity: 0 },
        { strokeDasharray: ".13 .87", strokeDashoffset: -.05, opacity: .85 },
        { strokeDasharray: ".13 .87", strokeDashoffset: -.9, opacity: 0 }
      ], 810]
    ]],
    [document.querySelector(".news-art"), [
      [".news-packets rect", [
        { transform: "translateX(-10px)" },
        { transform: "translateX(0)" }
      ], 550]
    ]],
    [document.querySelector(".orion-art"), [
      [".orion-orbit", [
        { transform: "rotate(-8deg)" },
        { transform: "rotate(0)" }
      ], 610]
    ]]
  ]);

  const running = new Set();
  const artObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      artObserver.unobserve(target);
      if (motionPreference.matches) return;

      for (const [selector, keyframes, duration] of artSequences.get(target)) {
        target.querySelectorAll(selector).forEach((element, index) => {
          const animation = element.animate(keyframes, {
            duration,
            delay: index * 35,
            easing: "cubic-bezier(.2,.7,.2,1)"
          });
          running.add(animation);
          animation.onfinish = () => running.delete(animation);
        });
      }
    });
  }, { threshold: .18 });

  artSequences.forEach((_, art) => artObserver.observe(art));

  motionPreference.addEventListener("change", event => {
    if (!event.matches) return;
    running.forEach(animation => animation.cancel());
    running.clear();
  });
}

const sectionLinks = [...document.querySelectorAll(".navigation a")];
const navigationSections = sectionLinks.map(link => document.querySelector(link.hash));
let scrollFramePending = false;

function updateScrollState() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
  let activeIndex = -1;
  navigationSections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= window.innerHeight * .4) activeIndex = index;
  });
  if (progress >= .99 && window.scrollY > 0) activeIndex = sectionLinks.length - 1;
  sectionLinks.forEach((link, index) => {
    if (index === activeIndex) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollFramePending = false;
}

function scheduleScrollState() {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(updateScrollState);
}

window.addEventListener("scroll", scheduleScrollState, { passive: true });
window.addEventListener("resize", scheduleScrollState);
window.addEventListener("load", scheduleScrollState);
updateScrollState();
