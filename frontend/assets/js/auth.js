/**
 * auth.js — wires up the login and signup forms to the backend.
 *
 * Both forms honour a `?redirect=<page>` query param: if the person landed
 * here from the checkout page's "please log in first" redirect, a
 * successful login/signup sends them straight back to it instead of always
 * going to products.html.
 */
(function () {
  function showError(form, key) {
    const box = form.querySelector("[data-form-error]");
    if (!box) return;
    box.textContent = window.KhorshidI18n.t(key) || key;
    box.classList.remove("hidden");
  }

  function hideError(form) {
    const box = form.querySelector("[data-form-error]");
    if (box) box.classList.add("hidden");
  }

  function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("redirect");
    // only allow same-site relative page names, never an external URL
    if (target && /^[a-zA-Z0-9_-]+\.html$/.test(target)) return target;
    return "products.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const redirectTarget = getRedirectTarget();

    // carry the redirect param over when switching between login <-> signup
    document.querySelectorAll("[data-auth-switch-link]").forEach((a) => {
      const url = new URL(a.href, window.location.href);
      url.searchParams.set("redirect", redirectTarget);
      a.href = url.pathname + url.search;
    });

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError(loginForm);
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        const res = await KhorshidAPI.post("/api/auth/login", { email, password });
        if (res.ok) {
          window.location.href = redirectTarget;
        } else {
          showError(loginForm, "auth.error_invalid");
        }
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError(signupForm);
        const first_name = signupForm.first_name.value.trim();
        const last_name = signupForm.last_name.value.trim();
        const email = signupForm.email.value.trim();
        const password = signupForm.password.value;
        const res = await KhorshidAPI.post("/api/auth/signup", { first_name, last_name, email, password });
        if (res.ok) {
          window.location.href = redirectTarget;
        } else if (res.error === "email_exists") {
          showError(signupForm, "auth.error_exists");
        } else {
          showError(signupForm, "auth.error_invalid");
        }
      });
    }
  });
})();
