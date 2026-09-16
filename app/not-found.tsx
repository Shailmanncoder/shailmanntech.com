import type { Metadata } from "next";
import { ActionButton } from "@/components/ui/ActionButton";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import { Reveal } from "@/components/ui/Reveal";
import { mailto, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This route hasn't been deployed yet.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-svh items-center overflow-hidden py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="grid-backdrop absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent_75%)]" />
        <div className="absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.22),transparent_62%)] blur-3xl animate-drift sm:h-[40rem] sm:w-[40rem]" />
      </div>

      <div className="container-page relative">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Reveal y={16}>
            <p className="font-mono text-[0.6875rem] tracking-[0.24em] text-white/45 uppercase">
              Error 404
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <p
              aria-hidden="true"
              className="mt-6 text-[5.5rem] leading-none font-semibold tracking-[-0.05em] sm:text-[8rem] lg:text-[9.5rem]"
            >
              <span className="text-gradient">404</span>
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-6 text-2xl leading-tight font-semibold tracking-[-0.025em] text-white sm:text-3xl md:text-4xl">
              Looks like this route hasn&rsquo;t been deployed yet.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">
              The page you were after doesn&rsquo;t exist — or it moved while we
              were shipping. Let&rsquo;s get you back to something that does.
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-4">
              <ActionButton href="/" size="lg" arrow="right">
                Return Home
              </ActionButton>
              <UnderlineLink href={mailto} className="font-mono text-xs">
                {site.email}
              </UnderlineLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
