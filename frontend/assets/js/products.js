/**
 * products.js — pulls products from GET /api/products (which reads the live
 * Excel file on the server) and builds one Product Card per product,
 * re-fetching every 10 seconds so edits to the spreadsheet show up live.
 */
(function () {
  const POLL_MS = 10000;
  let lastUpdatedAt = null;

  function cardTemplate(p, lang) {
    const name = lang === "fa" ? p.name_fa : p.name_en || p.name_fa;
    const category = lang === "fa" ? p.category_fa : p.category_en || p.category_fa;
    const inStock = p.stock > 0;
    const t = window.KhorshidI18n.t;

    return `
      <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-800/60" data-product-id="${p.id}">
        <div class="relative flex h-44 items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-700 dark:to-slate-800">
          <svg viewBox="0 0 64 64" class="h-16 w-16 text-blue-800/70 dark:text-blue-300/70" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="14" y="6" width="36" height="52" rx="4"/>
            <line x1="20" y1="16" x2="44" y2="16"/>
            <circle cx="32" cy="36" r="10"/>
            <circle cx="32" cy="36" r="3"/>
          </svg>
          <span class="absolute top-3 ${document.documentElement.dir === 'rtl' ? 'right-3' : 'left-3'} rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-blue-900 shadow dark:bg-slate-900/80 dark:text-blue-200">${category || ""}</span>
        </div>
        <div class="flex flex-1 flex-col gap-3 p-4">
          <h3 class="font-display text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">${name}</h3>
          <div class="mt-auto flex items-end justify-between">
            <div>
              <p class="font-mono text-lg font-bold text-blue-900 dark:text-blue-300">${formatToman(p.price)}<span class="ms-1 text-xs font-normal text-slate-500 dark:text-slate-400">${t("products_page.toman")}</span></p>
              <p class="mt-0.5 text-xs ${inStock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}">
                ${inStock ? `${t("products_page.in_stock")} · ${p.stock} ${t("products_page.stock_count")}` : t("products_page.out_of_stock")}
              </p>
            </div>
          </div>
          <button
            data-add-to-cart
            ${inStock ? "" : "disabled"}
            class="mt-1 w-full rounded-xl bg-blue-900 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-slate-700">
            ${t("products_page.add_to_cart")}
          </button>
        </div>
      </article>`;
  }

  function render(products) {
    const grid = document.getElementById("product-grid");
    const emptyState = document.getElementById("product-empty");
    if (!grid) return;

    const lang = window.KhorshidI18n.currentLang();

    if (!products.length) {
      grid.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    grid.innerHTML = products.map((p) => cardTemplate(p, lang)).join("");

    grid.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest("[data-product-id]");
        const id = Number(card.getAttribute("data-product-id"));
        const product = products.find((p) => p.id === id);
        const result = KhorshidCart.addItem(product, 1);

        const original = btn.textContent;
        if (result.added === 0) {
          btn.textContent = window.KhorshidI18n.t("cart_page.max_stock_reached");
          btn.classList.add("bg-amber-500", "dark:bg-amber-600");
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove("bg-amber-500", "dark:bg-amber-600");
          }, 1400);
          return;
        }
        btn.textContent = window.KhorshidI18n.t("products_page.added") + " ✓";
        btn.classList.add("bg-emerald-600", "dark:bg-emerald-600");
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("bg-emerald-600", "dark:bg-emerald-600");
        }, 1000);
      });
    });
  }

  async function fetchAndRender(silent) {
    const status = document.getElementById("live-status");
    const errorBox = document.getElementById("product-error");
    const errorDetail = document.getElementById("product-error-detail");
    try {
      const data = await KhorshidAPI.get("/api/products");
      if (data.ok === false) throw new Error(data.error || "unknown error");
      lastUpdatedAt = data.updated_at;
      render(data.products || []);
      if (errorBox) errorBox.classList.add("hidden");
      const synced = document.getElementById("last-synced");
      if (synced) {
        const fileTime = data.updated_at ? new Date(data.updated_at * 1000).toLocaleTimeString("fa-IR") : "—";
        const now = new Date().toLocaleTimeString("fa-IR");
        synced.textContent = `فایل: ${fileTime} — دریافت: ${now}`;
      }
      if (status) {
        status.classList.remove("bg-rose-500");
        status.classList.add("bg-emerald-500");
      }
    } catch (e) {
      if (errorBox) {
        errorBox.classList.remove("hidden");
        if (errorDetail) errorDetail.textContent = e.message || String(e);
      }
      if (status) {
        status.classList.remove("bg-emerald-500");
        status.classList.add("bg-rose-500");
      }
      if (!silent) console.error("Failed to load products:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("product-grid")) return;
    fetchAndRender(false);
    setInterval(() => fetchAndRender(true), POLL_MS);
  });

  // re-render with the new language's product names when the language changes
  document.addEventListener("khorshid:translated", () => {
    if (document.getElementById("product-grid")) fetchAndRender(true);
  });
})();
