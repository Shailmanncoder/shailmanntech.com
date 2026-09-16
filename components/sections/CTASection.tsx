import { mailto, site } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { ActionButton } from "@/components/ui/ActionButton";
import { UnderlineLink } from "@/components/ui/UnderlineLink";

export function CTASection() {
  return (
    <section
      id="contact-cta"
      aria-labelledby="cta-heading"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-28 lg:py-36"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="rule-fade absolute inset-x-0 top-0 h-px" />
        <div className="grid-backdrop absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_75%)]" />
        <div className="absolute top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.30),transparent_62%)] blur-3xl animate-drift sm:h-[42rem] sm:w-[42rem]" />
        <div className="absolute top-1/2 left-1/2 h-[18rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_60%)] blur-3xl animate-drift-slow sm:h-[24rem] sm:w-[48rem]" />
      </div>

      <div className="container-page relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal y={14}>
            <p className="font-mono text-[0.6875rem] tracking-[0.22em] text-white/50 uppercase">
              Let&rsquo;s Build
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h2
              id="cta-heading"
              className="mt-6 text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]"
            >
              Have an idea?
              <span className="mt-1 block text-gradient">
                Let&rsquo;s build what comes next.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Tell us what you&rsquo;re building and let&rsquo;s explore how
              Shailmann Tech can help bring it to life.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-10 flex w-full flex-col items-center gap-5 sm:mt-12">
              <ActionButton href={mailto} size="lg" arrow="right">
                Start a Conversation
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
