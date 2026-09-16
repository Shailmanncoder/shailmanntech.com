"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { navItems, site } from "@/lib/site";
import {
  useActiveSection,
  useReducedMotion,
  useScrollLock,
  useScrolled,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { ActionButton } from "@/components/ui/ActionButton";
import { easeBrand } from "@/components/ui/Reveal";

const sectionIds = navItems
  .map((item) => item.sectionId)
  .filter((id): id is string => Boolean(id));

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const scrolled = useScrolled(24);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the panel whenever the route changes. Adjusting state during render
  // (rather than in an effect) avoids an extra commit with the menu still open.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
    setHovered(null);
  }

  const activeSection = useActiveSection(sectionIds, isHome);
  useScrollLock(open);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const activeHref = useMemo(() => {
    if (!isHome) {
      // Inner routes light up the section they belong to.
      if (pathname.startsWith("/products")) return "/#products";
      if (pathname.startsWith("/services")) return "/#services";
      if (pathname.startsWith("/about")) return "/#about";
      return navItems.find((item) => item.href === pathname)?.href ?? null;
    }
    if (!activeSection || activeSection === "top") return "/";
    return (
      navItems.find((item) => item.sectionId === activeSection)?.href ?? "/"
    );
  }, [activeSection, isHome, pathname]);

  const indicator = hovered ?? activeHref;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a
        href="#main"
        className="sr-only left-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-medium text-black focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="backdrop"
            className="fixed inset-0 -z-10 bg-canvas/75 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          "container-page transition-[padding] duration-500 ease-out",
          scrolled || open ? "pt-3" : "pt-4 sm:pt-6",
        )}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "relative flex h-14 items-center justify-between gap-3 rounded-2xl px-3 sm:h-16 sm:px-4",
            "transition-[background-color,box-shadow,border-color] duration-500 ease-out",
            scrolled || open
              ? "border border-white/10 bg-canvas/70 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl backdrop-saturate-150"
              : "border border-transparent bg-transparent",
          )}
        >
          <Logo />

          <ul
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onMouseEnter={() => setHovered(item.href)}
                    onFocus={() => setHovered(item.href)}
                    className={cn(
                      "relative flex h-9 items-center rounded-full px-3.5 text-[0.875rem] transition-colors duration-300",
                      isActive
                        ? "text-white"
                        : "text-white/60 hover:text-white",
                    )}
                  >
                    {indicator === item.href ? (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-0 -z-10 rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10"
                        transition={
                          reduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 34 }
                        }
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {/* Wrapper controls visibility: a `hidden` utility on the button
                itself would lose to its own base `inline-flex`. */}
            <div className="hidden sm:block">
              <ActionButton
                href="/contact"
                size="md"
                arrow="right"
                className="h-10 px-4 text-sm"
              >
                Let&rsquo;s Build
              </ActionButton>
            </div>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative flex size-10 items-center justify-center rounded-xl text-white ring-1 ring-inset ring-white/10 transition-colors duration-300 hover:bg-white/[0.06] lg:hidden"
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <span aria-hidden="true" className="relative block h-4 w-5">
                <motion.span
                  className="absolute left-0 block h-px w-5 bg-current"
                  initial={false}
                  animate={
                    open ? { top: 7.5, rotate: 45 } : { top: 3, rotate: 0 }
                  }
                  transition={{ duration: reduced ? 0 : 0.32, ease: easeBrand }}
                />
                <motion.span
                  className="absolute left-0 block h-px w-5 bg-current"
                  initial={false}
                  animate={
                    open
                      ? { top: 7.5, rotate: -45, width: 20 }
                      : { top: 12, rotate: 0, width: 14 }
                  }
                  transition={{ duration: reduced ? 0 : 0.32, ease: easeBrand }}
                />
              </span>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open ? (
            <motion.div
              key="panel"
              id="mobile-navigation"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: easeBrand }}
              className="mt-2 origin-top overflow-hidden rounded-2xl border border-white/10 bg-canvas/85 p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
            >
              <ul className="flex flex-col">
                {navItems.map((item, index) => {
                  const isActive = activeHref === item.href;
                  return (
                    <motion.li
                      key={item.href}
                      initial={reduced ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduced ? 0 : 0.05 + index * 0.045,
                        duration: 0.35,
                        ease: easeBrand,
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3.5 text-[0.95rem] transition-colors duration-200",
                          isActive
                            ? "bg-white/[0.07] text-white"
                            : "text-white/65 hover:bg-white/[0.04] hover:text-white",
                        )}
                      >
                        {item.label}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full bg-linear-to-r from-brand-cyan to-brand-violet transition-opacity duration-200",
                            isActive ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-2 border-t border-white/8 p-2 pt-4">
                <ActionButton
                  href="/contact"
                  arrow="right"
                  className="w-full"
                  onClick={close}
                >
                  Let&rsquo;s Build
                </ActionButton>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-3 block text-center font-mono text-xs tracking-wide text-white/45 transition-colors hover:text-white/75"
                >
                  {site.email}
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
