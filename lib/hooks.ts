"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** True once the window has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Id of the section the reader is currently in.
 *
 * Deliberately offset-based rather than IntersectionObserver: sections here
 * vary wildly in height, and comparing intersection ratios makes short
 * sections win over the tall one actually filling the screen.
 */
export function useActiveSection(ids: string[], enabled = true) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || ids.length === 0) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      // The line just below the navbar decides which section we are "in".
      const line = window.scrollY + window.innerHeight * 0.32;
      let current: string | null = null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top + window.scrollY <= line) {
          current = id;
        }
      }

      // Pin the last item once the page is scrolled to the bottom.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = ids[ids.length - 1] ?? current;

      setActive(current);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, ids]);

  return enabled ? active : null;
}

/**
 * Subscribes to a media query through `useSyncExternalStore`.
 *
 * This is what keeps hydration honest: React renders the server snapshot while
 * hydrating and only then reconciles the real value, so a visitor whose query
 * matches never trips a hydration mismatch — which a plain
 * `useState(matchMedia(...).matches)` would cause.
 */
function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * True when the visitor has asked for reduced motion.
 *
 * Used instead of Framer Motion's `useReducedMotion` so that the reduced and
 * animated branches agree with the server-rendered markup during hydration.
 */
export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True when the device has a precise pointer (i.e. a real mouse). */
export function useFinePointer() {
  return useMediaQuery("(pointer: fine) and (hover: hover)");
}

/** Locks body scroll without introducing a layout shift. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [locked]);
}
