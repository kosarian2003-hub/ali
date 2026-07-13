/**
 * theme.js — Dark / Light mode
 * Default: follows the OS/browser color-scheme setting.
 * If the person picks a mode manually, that choice is remembered and wins
 * over the system setting from then on.
 */
(function () {
  const STORAGE_KEY = "khorshid_theme"; // "dark" | "light" | absent = follow system
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(mode) {
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = mode === "dark" ? "☀️" : "🌙";
    });
  }

  function currentMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return media.matches ? "dark" : "light";
  }

  function init() {
    applyTheme(currentMode());

    media.addEventListener("change", (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
