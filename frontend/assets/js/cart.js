/**
 * cart.js — a tiny localStorage-backed cart, shared across every page.
 *
 * Every line also remembers the product's stock at the moment it was added
 * (`stock`), so addItem/setQty can refuse to let the cart hold more units
 * than the warehouse actually has. The backend re-checks stock again at
 * checkout time regardless — this is just so the customer sees the limit
 * immediately instead of after submitting the order.
 */
(function () {
  const KEY = "khorshid_cart";

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  }

  // returns { added: number, cappedAt: number|null } so the UI can tell the
  // customer when they hit the stock ceiling
  function addItem(product, qty) {
    qty = qty || 1;
    const stock = typeof product.stock === "number" ? product.stock : Infinity;
    const items = readCart();
    const existing = items.find((i) => i.id === product.id);
    const currentQty = existing ? existing.qty : 0;
    const newQty = Math.min(stock, currentQty + qty);
    const cappedAt = newQty < currentQty + qty ? stock : null;

    if (existing) {
      existing.qty = newQty;
      existing.stock = stock;
    } else {
      items.push({
        id: product.id,
        name_fa: product.name_fa,
        name_en: product.name_en,
        price: product.price,
        stock: stock,
        qty: newQty,
      });
    }
    writeCart(items);
    return { added: newQty - currentQty, cappedAt };
  }

  function removeItem(id) {
    writeCart(readCart().filter((i) => i.id !== id));
  }

  // returns the qty actually applied (may be capped at the item's stock)
  function setQty(id, qty) {
    const items = readCart();
    const item = items.find((i) => i.id === id);
    if (item) {
      const stock = typeof item.stock === "number" ? item.stock : Infinity;
      item.qty = Math.max(1, Math.min(stock, qty));
      writeCart(items);
      return item.qty;
    }
    return null;
  }

  function clearCart() {
    writeCart([]);
  }

  function totalCount() {
    return readCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function totalPrice() {
    return readCart().reduce((sum, i) => sum + i.qty * i.price, 0);
  }

  function updateBadge() {
    const count = totalCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    });
  }

  window.KhorshidCart = {
    readCart,
    addItem,
    removeItem,
    setQty,
    clearCart,
    totalCount,
    totalPrice,
    updateBadge,
  };

  document.addEventListener("DOMContentLoaded", updateBadge);
})();
