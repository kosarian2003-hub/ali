/**
 * i18n.js — FA (default) / EN switcher
 * Usage in HTML:
 *   <span data-i18n="hero.title"></span>
 *   <input data-i18n-placeholder="auth.email">
 *   <span data-i18n-toman>48500000</span>  -> formatted with locale-aware digits + currency word
 */
(function () {
  const STORAGE_KEY = "khorshid_lang"; // "fa" | "en"
  const DEFAULT_LANG = "fa";
  let dict = {};

  function get(path) {
    return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), dict);
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = get(el.getAttribute("data-i18n"));
      if (val !== null) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = get(el.getAttribute("data-i18n-placeholder"));
      if (val !== null) el.setAttribute("placeholder", val);
    });
    document.dispatchEvent(new CustomEvent("khorshid:translated"));
  }

  function setDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }

  async function loadLang(lang) {
    const res = await fetch(`assets/locales/${lang}.json`, { cache: "no-store" });
    dict = await res.json();
    setDirection(lang);
    applyTranslations();
    document.querySelectorAll("[data-lang-label]").forEach((el) => {
      el.textContent = get("common.language");
    });
  }

  window.KhorshidI18n = {
    currentLang: () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,
    t: get,
    setLanguage: async function (lang) {
      localStorage.setItem(STORAGE_KEY, lang);
      await loadLang(lang);
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadLang(window.KhorshidI18n.currentLang());

    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = window.KhorshidI18n.currentLang() === "fa" ? "en" : "fa";
        window.KhorshidI18n.setLanguage(next);
      });
    });
  });
})();
