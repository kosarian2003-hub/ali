/**
 * map.js — a Snapp-style "tap or drag the pin to set delivery location" map,
 * built on Leaflet + OpenStreetMap tiles (no API key required).
 *
 * On every pin placement/move it reverse-geocodes the point (OpenStreetMap
 * Nominatim, accept-language=fa) into a human-readable Persian address and
 * shows it in the confirmation panel docked to the bottom of the map, so the
 * customer can read and confirm the exact address before placing the order —
 * the same pattern Snapp's delivery-location picker uses.
 */
(function () {
  const DEFAULT_CENTER = [35.7219, 51.3347]; // Tehran, Valiasr Sq. as a sensible default
  let map, marker;
  let currentLocation = null; // { lat, lng, address }
  let geocodeRequestId = 0;

  function els() {
    return {
      panel: document.getElementById("address-confirm-panel"),
      text: document.getElementById("address-confirm-text"),
      status: document.getElementById("address-confirm-status"),
    };
  }

  function setPanelState(state, text) {
    // state: "loading" | "ready" | "error"
    const { panel, text: textEl, status } = els();
    if (!panel || !textEl) return;
    panel.classList.remove("hidden");
    const t = window.KhorshidI18n ? window.KhorshidI18n.t : (k) => k;

    if (state === "loading") {
      textEl.textContent = t("cart_page.address_loading") || "در حال یافتن نشانی…";
      if (status) status.textContent = "⏳";
    } else if (state === "ready") {
      textEl.textContent = text;
      if (status) status.textContent = "✅";
    } else if (state === "error") {
      textEl.textContent = t("cart_page.address_unavailable") || "نشانی یافت نشد؛ مختصات ثبت شد.";
      if (status) status.textContent = "⚠️";
    }
  }

  async function reverseGeocode(lat, lng) {
    const requestId = ++geocodeRequestId;
    setPanelState("loading");
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fa&zoom=18`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      // a newer pin may have been dropped while this request was in flight
      if (requestId !== geocodeRequestId) return;

      const address = (data && data.display_name) || null;
      if (address) {
        currentLocation = { lat, lng, address };
        setPanelState("ready", address);
      } else {
        currentLocation = { lat, lng, address: null };
        setPanelState("error");
      }
    } catch (e) {
      if (requestId !== geocodeRequestId) return;
      currentLocation = { lat, lng, address: null };
      setPanelState("error");
    }
  }

  function placeMarker(lat, lng) {
    if (!marker) {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
    } else {
      marker.setLatLng([lat, lng]);
    }
    reverseGeocode(lat, lng);
  }

  function initMap() {
    const el = document.getElementById("delivery-map");
    if (!el || typeof L === "undefined") return;

    map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));

    // try to center on the user's real location, but never block the UI on it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
        () => {},
        { timeout: 3000 }
      );
    }

    window.KhorshidMap = {
      // Returns { lat, lng, address } for the confirmed pin, or null if the
      // customer hasn't placed one yet.
      getLocation: () => currentLocation,
    };
  }

  document.addEventListener("DOMContentLoaded", initMap);
})();
