"use client";

import { useState } from "react";
import type { MonthlyCount } from "@/lib/admin/inbox";

/**
 * Stacked monthly bars: website form requests (cyan) under other email
 * (violet). Colours were checked with the dataviz palette validator against
 * the dark surface. Hovering or focusing a month shows its numbers.
 */

const SERIES = [
  { key: "form", label: "Form requests", color: "#0ea5c6" },
  { key: "email", label: "Other email", color: "#8b5cf6" },
] as const;

const WIDTH = 720;
const HEIGHT = 240;
const PAD = { top: 16, right: 8, bottom: 28, left: 36 };
const GAP = 2;

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude * 4 >= value)!;
  return step * magnitude * 4;
}

function monthLabel(month: string, long = false) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleString(undefined, {
    month: long ? "long" : "short",
    year: long ? "numeric" : undefined,
  });
}

export function MonthlyChart({ data }: { data: MonthlyCount[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = niceMax(Math.max(0, ...data.map((d) => d.form + d.email)));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.min(36, slot * 0.6);
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const current = active === null ? null : data[active];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm"
                style={{ background: series.color }}
              />
              {series.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs text-white/50 underline decoration-white/20 underline-offset-4 hover:text-white"
        >
          {showTable ? "Show chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-white/50">
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 text-right font-medium">Form requests</th>
              <th className="py-2 text-right font-medium">Other email</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.month}
                className="border-b border-white/5 text-white/80"
              >
                <td className="py-1.5">{monthLabel(d.month, true)}</td>
                <td className="py-1.5 text-right tabular-nums">{d.form}</td>
                <td className="py-1.5 text-right tabular-nums">{d.email}</td>
                <td className="py-1.5 text-right tabular-nums text-white">
                  {d.form + d.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Emails received per month over the last 12 months"
            onMouseLeave={() => setActive(null)}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="rgba(255,255,255,0.07)"
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-white/60 text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}

            {data.map((d, index) => {
              const cx = PAD.left + slot * index + slot / 2;
              const x = cx - barW / 2;
              const formTop = y(d.form);
              const total = d.form + d.email;
              const emailTop = y(total);
              const dim = active !== null && active !== index;
              return (
                <g
                  key={d.month}
                  tabIndex={0}
                  role="button"
                  aria-label={`${monthLabel(d.month, true)}: ${d.form} form requests, ${d.email} other emails`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="cursor-default outline-none"
                  opacity={dim ? 0.45 : 1}
                >
                  {/* Hit target: the whole column, wider than the bar. */}
                  <rect
                    x={PAD.left + slot * index}
                    y={PAD.top}
                    width={slot}
                    height={plotH}
                    fill={
                      active === index
                        ? "rgba(255,255,255,0.04)"
                        : "transparent"
                    }
                  />
                  {d.form > 0 ? (
                    <path
                      d={barPath(
                        x,
                        formTop,
                        barW,
                        y(0) - formTop,
                        d.email === 0,
                      )}
                      fill={SERIES[0].color}
                    />
                  ) : null}
                  {d.email > 0 ? (
                    <path
                      d={barPath(
                        x,
                        emailTop,
                        barW,
                        formTop - emailTop - (d.form > 0 ? GAP : 0),
                        true,
                      )}
                      fill={SERIES[1].color}
                    />
                  ) : null}
                  <text
                    x={cx}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-white/60 text-[11px]"
                  >
                    {monthLabel(d.month)}
                  </text>
                  {total > 0 && active === null && index === data.length - 1 ? (
                    <text
                      x={cx}
                      y={emailTop - 6}
                      textAnchor="middle"
                      className="fill-white/70 text-[11px] tabular-nums"
                    >
                      {total}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(0)}
              y2={y(0)}
              stroke="rgba(255,255,255,0.2)"
            />
          </svg>

          {current && active !== null ? (
            <div
              className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-surface/95 p-3 text-xs shadow-xl backdrop-blur"
              style={{
                left: `${Math.min(
                  Math.max(
                    ((PAD.left + slot * active + slot / 2) / WIDTH) * 100,
                    14,
                  ),
                  86,
                )}%`,
              }}
            >
              <p className="font-medium text-white">
                {monthLabel(current.month, true)}
              </p>
              {SERIES.map((series) => (
                <p
                  key={series.key}
                  className="mt-1.5 flex items-center justify-between gap-3 text-white/60"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-sm"
                      style={{ background: series.color }}
                    />
                    {series.label}
                  </span>
                  <span className="tabular-nums text-white">
                    {current[series.key]}
                  </span>
                </p>
              ))}
              <p className="mt-1.5 flex justify-between border-t border-white/10 pt-1.5 text-white/60">
                Total
                <span className="tabular-nums text-white">
                  {current.form + current.email}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** A bar segment with 4px rounded top corners when it is the top of a stack. */
function barPath(
  x: number,
  top: number,
  w: number,
  h: number,
  roundTop: boolean,
) {
  if (h <= 0) return "";
  const r = roundTop ? Math.min(4, h, w / 2) : 0;
  const bottom = top + h;
  return [
    `M${x},${bottom}`,
    `V${top + r}`,
    r ? `Q${x},${top} ${x + r},${top}` : "",
    `H${x + w - r}`,
    r ? `Q${x + w},${top} ${x + w},${top + r}` : "",
    `V${bottom}`,
    "Z",
  ].join(" ");
}
