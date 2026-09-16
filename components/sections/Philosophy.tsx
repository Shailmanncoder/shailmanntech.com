import { principles } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Philosophy() {
  return (
    <Section
      id="philosophy"
      divider
      aria-labelledby="philosophy-heading"
      backdrop={
        <div className="absolute -top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12),transparent_65%)] blur-3xl" />
      }
    >
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 xl:gap-28">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal y={14}>
            <p className="flex items-center gap-3 font-mono text-[0.6875rem] font-medium tracking-[0.22em] text-white/55 uppercase">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-linear-to-r from-brand-cyan to-brand-violet"
              />
              Why Shailmann Tech
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h2
              id="philosophy-heading"
              className="mt-5 text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
            >
              Technology should feel effortless.
              <span className="block text-white/35">
                Building it isn&rsquo;t.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
              We handle the complexity behind modern digital products so users
              experience something fast, reliable, intuitive, and beautifully
              simple.
            </p>
          </Reveal>
        </div>

        <ol className="flex flex-col">
          {principles.map((principle) => (
            <Reveal
              as="li"
              key={principle.index}
              delay={0.05}
              y={26}
              className="group/principle relative border-t border-white/8 py-8 first:border-t-0 first:pt-0 last:pb-0 sm:py-10"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 h-px w-0 bg-linear-to-r from-brand-cyan to-brand-violet transition-[width] duration-700 ease-out group-hover/principle:w-full motion-reduce:transition-none"
              />
              <div className="flex items-start gap-5 sm:gap-8">
                <span className="mt-1 shrink-0 font-mono text-sm tracking-[0.1em] text-white/25 transition-colors duration-500 group-hover/principle:text-brand-cyan/80">
                  {principle.index}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                    {principle.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                    {principle.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
