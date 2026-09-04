"use client";

import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const REVEAL_SELECTOR = [
  ".section-head",
  ".product-card",
  ".store-card",
  ".pillar-card",
  ".journey-card",
  ".readiness-card",
  ".editor-card",
  ".dashboard-card",
  ".admin-kpi",
  ".admin-panel",
  ".admin-service",
  ".stat-card",
  ".chart-card",
  ".pricing-card",
  ".merchant-benefit-grid article",
  ".merchant-about-fact-grid article",
  ".merchant-story-card",
  ".merchant-about-intro",
  ".merchant-business-identity",
  ".merchant-category-grid a",
  ".merchant-contact-cards a",
  ".merchant-reel-grid a",
  ".about-stack article",
  ".timeline-grid article",
  ".category-link",
  ".feature-editorial",
  ".cta-panel",
].join(",");

export function SiteInteractions() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const ticking = useRef(false);
  const pathname = usePathname();

  // The root <html> tag is shared by every route and can't read the [locale]
  // segment server-side (see suppressHydrationWarning on it in
  // src/app/layout.tsx), so it's hardcoded to lang="ar" dir="rtl". The
  // [locale] layout below it correctly sets dir on its own wrapper div, but
  // that only fixes text flow *inside* that div - the root direction (and
  // therefore the browser's own scrollable-overflow/scrollbar model) stays
  // RTL, which is exactly what produces sideways-shifted layout and phantom
  // horizontal scroll on /en pages. Correct it here once the real locale is
  // known from the URL.
  useEffect(() => {
    const locale = pathname?.startsWith("/en") ? "en" : "ar";
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [pathname]);

  useEffect(() => {
    const body = document.body;
    body.classList.add("interactions-ready");

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const value = Math.min(1, Math.max(0, window.scrollY / scrollable));
      setProgress(value);
      setShowTop(window.scrollY > Math.max(520, window.innerHeight * 0.7));
      body.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(updateScroll);
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    let observer: IntersectionObserver | undefined;

    const registerRevealTargets = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        if (element.dataset.revealRegistered === "true") return;
        element.dataset.revealRegistered = "true";
        element.classList.add("reveal-ready");
        if (prefersReducedMotion) {
          element.classList.add("is-visible");
          return;
        }
        observer?.observe(element);
      });
    };

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("is-visible");
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    }

    registerRevealTargets();
    const mutationObserver = new MutationObserver(registerRevealTargets);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const hero = document.querySelector<HTMLElement>(".hero-visual-shell");
    const onPointerMove = (event: PointerEvent) => {
      if (!hero || prefersReducedMotion || event.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const y = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      hero.style.setProperty("--hero-tilt-x", `${(-y * 2.2).toFixed(2)}deg`);
      hero.style.setProperty("--hero-tilt-y", `${(x * 2.8).toFixed(2)}deg`);
      hero.style.setProperty("--hero-glow-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      hero.style.setProperty("--hero-glow-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const resetHero = () => {
      if (!hero) return;
      hero.style.setProperty("--hero-tilt-x", "0deg");
      hero.style.setProperty("--hero-tilt-y", "0deg");
      hero.style.setProperty("--hero-glow-x", "60%");
      hero.style.setProperty("--hero-glow-y", "42%");
    };
    hero?.addEventListener("pointermove", onPointerMove);
    hero?.addEventListener("pointerleave", resetHero);

    return () => {
      body.classList.remove("interactions-ready");
      delete body.dataset.scrolled;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer?.disconnect();
      mutationObserver?.disconnect();
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerleave", resetHero);
    };
  }, []);

  return <>
    <div className="site-scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
    <button
      type="button"
      className={`site-back-to-top ${showTop ? "is-visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      tabIndex={showTop ? 0 : -1}
    ><ArrowUp /></button>
  </>;
}
