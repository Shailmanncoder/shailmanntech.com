import { stats } from "@/lib/content";
import { StatCard } from "@/components/ui/StatCard";

export function Stats() {
  return (
    <section
      aria-label="Shellman Tech at a glance"
      className="relative pb-4 sm:pb-6"
    >
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(99,102,241,0.16),transparent_70%)]"
          />
          {/* -mt-px/-ml-px lets each cell draw its own hairline while the
              wrapper clips the outermost ones */}
          <ul className="relative -mt-px -ml-px grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <li key={stat.label} className="border-t border-l border-white/8">
                <StatCard stat={stat} index={index} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
