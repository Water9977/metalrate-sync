"use client";

import { useEffect } from "react";

/**
 * Every in-page nav CTA on this site is a plain `<a href="#section">`, which
 * should just work via the browser's own "scroll to URL fragment" behavior
 * (that's exactly why `html` has `scroll-behavior: smooth` and
 * `scroll-padding-top: 90px` in globals.css -- to offset for the sticky
 * nav). It doesn't, reliably: isolated by hand, one variable at a time --
 * native fragment-navigation-on-click silently produced zero scroll for
 * some targets and a short, wrong-landing scroll for others; explicitly
 * calling `element.scrollIntoView({behavior: "smooth"})` from JS failed
 * the exact same way; `element.scrollIntoView({behavior: "instant"})`
 * landed exactly on `scroll-padding-top` (90px under the nav), for every
 * target, every single time, with zero exceptions across dozens of runs.
 * The common factor in every failure was the smooth *animation* itself,
 * not the fragment-navigation mechanism specifically -- so this uses
 * instant scrolling unconditionally rather than gambling on smooth-scroll
 * animation frames actually completing.
 *
 * This intercepts clicks on same-page hash links and drives the scroll
 * explicitly, plus handles landing directly on a URL that already carries
 * a hash (e.g. docs' `/#pricing` cross-page links, or a bookmarked/shared
 * link). One instance in the root layout covers every page.
 */
export function SmoothAnchorNav() {
  useEffect(() => {
    const scrollToHash = (hash: string) => {
      if (!hash || hash === "#") return;
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      // "instant" is deliberate, not a fallback -- see the note above.
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    };

    // Landed here with a hash already in the URL (cross-page link, direct
    // visit, or a shared link) -- scrollIntoView works regardless of
    // whether images/fonts above the target are still settling, so no
    // extra delay or readiness check is needed here.
    if (window.location.hash) scrollToHash(window.location.hash);

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      event.preventDefault();
      scrollToHash(href);
      history.pushState(null, "", href);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
