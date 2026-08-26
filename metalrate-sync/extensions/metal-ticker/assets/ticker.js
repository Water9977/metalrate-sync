/**
 * MetalRate Sync -- storefront ticker.
 *
 * Vanilla JS, no build step, no dependencies (theme app extensions ship raw
 * static assets only). Fetches /apps/ticker/rates -- a same-origin request
 * that Shopify's App Proxy signs and forwards to the app's own
 * app/routes/apps.proxy.rates.tsx loader -- and renders either a scrolling
 * marquee or a static card grid depending on the merchant's block settings.
 *
 * A 404 (shop uninstalled) or 403 (subscription inactive) response, a
 * network failure, or an empty metals list all result in the block staying
 * hidden -- see the CSS default of `display: none` on .mrs-ticker, only
 * lifted once the `is-ready` class is added below.
 */
(function () {
  "use strict";

  var METAL_ORDER = ["XAU", "XAG", "XPT", "XPD"];
  var RATES_URL = "/apps/ticker/rates";

  function initTicker(root) {
    if (!root || root.getAttribute("data-mrs-initialized") === "true") {
      return;
    }
    root.setAttribute("data-mrs-initialized", "true");

    var track = root.querySelector("[data-mrs-track]");
    if (!track) {
      return;
    }

    var style = root.getAttribute("data-style") === "static" ? "static" : "scrolling";
    var showChange = root.getAttribute("data-show-change") === "true";
    var scrollSpeed = parseFloat(root.getAttribute("data-scroll-speed"));
    if (!scrollSpeed || scrollSpeed <= 0) {
      scrollSpeed = 30;
    }
    var enabledMetals = {
      XAU: root.getAttribute("data-show-gold") === "true",
      XAG: root.getAttribute("data-show-silver") === "true",
      XPT: root.getAttribute("data-show-platinum") === "true",
      XPD: root.getAttribute("data-show-palladium") === "true"
    };

    fetch(RATES_URL, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("metal ticker unavailable: " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        renderTicker(root, track, data, {
          style: style,
          showChange: showChange,
          scrollSpeed: scrollSpeed,
          enabledMetals: enabledMetals
        });
      })
      .catch(function () {
        // Shop uninstalled, subscription inactive, or a network hiccup --
        // fail silently and leave the block hidden. No console-visible
        // error toast for real customers.
        hideTicker(root);
      });
  }

  function hideTicker(root) {
    root.classList.remove("is-ready");
    root.style.display = "none";
  }

  function renderTicker(root, track, data, options) {
    var metals = Array.isArray(data && data.metals) ? data.metals : [];

    var items = [];
    for (var i = 0; i < METAL_ORDER.length; i++) {
      var code = METAL_ORDER[i];
      if (!options.enabledMetals[code]) {
        continue;
      }
      var metal = findMetal(metals, code);
      if (metal && metal.available) {
        items.push(metal);
      }
    }

    if (items.length === 0) {
      hideTicker(root);
      return;
    }

    var currency = data.currency;
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.innerHTML = "";
    track.appendChild(buildItems(items, currency, options.showChange));

    root.classList.remove("mrs-ticker--scrolling", "mrs-ticker--static", "mrs-ticker--animated");

    if (options.style === "scrolling") {
      root.classList.add("mrs-ticker--scrolling");
      if (!reduceMotion) {
        // Duplicate the content exactly once so a translateX(-50%) loop is
        // seamless -- the standard CSS marquee technique.
        track.appendChild(buildItems(items, currency, options.showChange));
        track.style.setProperty("--mrs-duration", options.scrollSpeed + "s");
        root.classList.add("mrs-ticker--animated");
      }
    } else {
      root.classList.add("mrs-ticker--static");
    }

    root.classList.add("is-ready");
  }

  function findMetal(metals, code) {
    for (var i = 0; i < metals.length; i++) {
      if (metals[i] && metals[i].code === code) {
        return metals[i];
      }
    }
    return null;
  }

  function buildItems(items, currency, showChange) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      frag.appendChild(buildItem(items[i], currency, showChange));
    }
    return frag;
  }

  function buildItem(metal, currency, showChange) {
    var item = document.createElement("div");
    item.className = "mrs-ticker__item";

    var label = document.createElement("span");
    label.className = "mrs-ticker__label";
    label.textContent = metal.label;
    item.appendChild(label);

    var price = document.createElement("span");
    price.className = "mrs-ticker__price";
    price.textContent = formatPrice(metal.pricePerOzt, metal.currency || currency) + " / ozt";
    item.appendChild(price);

    if (showChange && metal.direction && typeof metal.changePct === "number") {
      var change = document.createElement("span");
      change.className = "mrs-ticker__change mrs-ticker__change--" + metal.direction;
      change.textContent = arrowFor(metal.direction) + " " + Math.abs(metal.changePct).toFixed(2) + "%";
      item.appendChild(change);
    }

    return item;
  }

  function arrowFor(direction) {
    if (direction === "up") {
      return "▲";
    }
    if (direction === "down") {
      return "▼";
    }
    return "•";
  }

  function formatPrice(value, currency) {
    if (typeof value !== "number") {
      return "--";
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 2
      }).format(value);
    } catch (err) {
      return "$" + value.toFixed(2);
    }
  }

  function initAll(scope) {
    var roots = (scope || document).querySelectorAll("[data-mrs-ticker]");
    for (var i = 0; i < roots.length; i++) {
      initTicker(roots[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  // Theme editor re-renders a section's markup in place (new DOM nodes)
  // whenever a merchant tweaks a setting, so re-init just that section
  // instead of relying on the one-time DOMContentLoaded pass above.
  document.addEventListener("shopify:section:load", function (event) {
    if (event.target && event.target.querySelectorAll) {
      initAll(event.target);
    }
  });
})();
