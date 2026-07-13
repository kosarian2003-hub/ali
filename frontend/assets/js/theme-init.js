// theme-init.js — must load synchronously, before Tailwind, before first paint.
(function () {
  try {
    var saved = localStorage.getItem("khorshid_theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = saved ? saved === "dark" : systemDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
