/**
 * api.js — thin fetch wrapper for the Khorshid backend.
 */
window.KhorshidAPI = {
  async get(path) {
    const res = await fetch(path, { credentials: "include" });
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    return res.json();
  },
};

/** Format a Toman amount with the current language's digit grouping. */
function formatToman(amount) {
  return new Intl.NumberFormat("en-US").format(amount);
}
