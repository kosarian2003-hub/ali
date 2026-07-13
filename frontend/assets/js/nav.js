/**
 * nav.js — mobile menu toggle + swap login/signup for account/logout when signed in.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const menuBtn = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-mobile-menu]");
    if (menuBtn && menu) {
      menuBtn.addEventListener("click", () => menu.classList.toggle("hidden"));
    }

    try {
      const res = await KhorshidAPI.get("/api/auth/me");
      const loggedOutEls = document.querySelectorAll("[data-auth-guest]");
      const loggedInEls = document.querySelectorAll("[data-auth-user]");
      if (res.user) {
        loggedOutEls.forEach((el) => el.classList.add("hidden"));
        loggedInEls.forEach((el) => el.classList.remove("hidden"));
        document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = res.user.name));

        // No real photo available without wiring up Google Sign-In (which
        // needs an OAuth client ID from Google Cloud Console), so we show a
        // generated initials avatar instead — same idea, no external calls.
        const initials = ((res.user.first_name || res.user.name || "?")[0] || "?") +
          ((res.user.last_name || "")[0] || "");
        document.querySelectorAll("[data-user-avatar]").forEach((el) => (el.textContent = initials.toUpperCase()));
      }
    } catch (e) {
      /* backend not reachable yet — nav still works without auth state */
    }

    document.querySelectorAll("[data-logout]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await KhorshidAPI.post("/api/auth/logout");
        window.location.reload();
      });
    });
  });
})();
