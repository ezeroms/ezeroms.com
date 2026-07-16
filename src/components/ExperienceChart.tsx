"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import type { Experience } from "@/types/content";
import {
  assignExperienceLanes,
  experienceTimeBounds,
  formatExperienceDuration,
  formatExperiencePeriod,
  yearTicks,
} from "@/lib/content/experience-meta";
import { cn } from "@/lib/cn";

type Props = {
  items: Experience[];
};

const PX_PER_YEAR = 96;
const LANE_WIDTH = 148;
const LABEL_WIDTH = 56;

function clampRatio(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Vertical Gantt-style career chart.
 * Time runs top (newest) → bottom (oldest). Click a bar for detail.
 */
export function ExperienceChart({ items }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const { lanes, laneCount, chartHeight, startMs, endMs, years } =
    useMemo(() => {
      const assigned = assignExperienceLanes(items);
      const maxLane = assigned.reduce((m, a) => Math.max(m, a.lane), 0);
      const bounds = experienceTimeBounds(items);
      const rangeMs = Math.max(bounds.endMs - bounds.startMs, 1);
      const yearsSpan = rangeMs / (1000 * 60 * 60 * 24 * 365.25);
      const height = Math.max(420, Math.round(yearsSpan * PX_PER_YEAR));
      return {
        lanes: assigned,
        laneCount: maxLane + 1,
        chartHeight: height,
        startMs: bounds.startMs,
        endMs: bounds.endMs,
        years: yearTicks(bounds.startMs, bounds.endMs),
      };
    }, [items]);

  const selected =
    items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  if (!items.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        まだ経歴が登録されていません。
      </p>
    );
  }

  const rangeMs = Math.max(endMs - startMs, 1);
  /** Newest at top */
  const yOf = (ms: number) =>
    clampRatio((endMs - ms) / rangeMs) * chartHeight;

  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div
          className="overflow-x-auto rounded-2xl border border-border bg-card/40 px-2 py-4 sm:px-4"
          role="list"
          aria-label="職歴タイムライン"
        >
          <div
            className="relative mx-auto"
            style={{
              width: LABEL_WIDTH + laneCount * LANE_WIDTH + 24,
              height: chartHeight + 8,
            }}
          >
            {/* Year grid */}
            {years.map((year) => {
              const ms = new Date(`${year}-01-01T00:00:00`).getTime();
              const top = yOf(ms);
              if (top < 0 || top > chartHeight) return null;
              return (
                <div
                  key={year}
                  className="pointer-events-none absolute left-0 right-0"
                  style={{ top }}
                >
                  <div className="flex items-start">
                    <span
                      className="shrink-0 pr-2 text-right text-[11px] font-medium tabular-nums text-muted-foreground"
                      style={{ width: LABEL_WIDTH }}
                    >
                      {year}
                    </span>
                    <div className="mt-1.5 h-px flex-1 bg-border/80" />
                  </div>
                </div>
              );
            })}

            {/* Mid-year marks */}
            {years.map((year) => {
              const ms = new Date(`${year}-07-01T00:00:00`).getTime();
              if (ms < startMs || ms > endMs) return null;
              const top = yOf(ms);
              return (
                <div
                  key={`${year}-mid`}
                  className="pointer-events-none absolute left-0 right-0"
                  style={{ top }}
                >
                  <div className="flex items-start">
                    <span
                      className="shrink-0 pr-2 text-right text-[10px] tabular-nums text-muted-foreground/60"
                      style={{ width: LABEL_WIDTH }}
                    >
                      7
                    </span>
                    <div className="mt-1 h-px flex-1 border-t border-dashed border-border/50" />
                  </div>
                </div>
              );
            })}

            {/* Bars */}
            {lanes.map(({ item, lane }) => {
              const s = new Date(item.start_date).getTime();
              const e = item.end_date
                ? new Date(item.end_date).getTime()
                : Date.now();
              if (Number.isNaN(s) || Number.isNaN(e)) return null;
              const top = yOf(e);
              const bottom = yOf(s);
              const h = Math.max(bottom - top, 36);
              const isSelected = selected?.id === item.id;
              const duration = formatExperienceDuration(
                item.start_date,
                item.end_date,
              );

              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "absolute flex flex-col overflow-hidden rounded-2xl border text-left transition-all",
                    "bg-[#c8ebea] text-foreground shadow-sm",
                    "hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-[#5a9e9c] ring-2 ring-[#5a9e9c]/40"
                      : "border-transparent",
                  )}
                  style={{
                    top,
                    height: h,
                    left: LABEL_WIDTH + 12 + lane * LANE_WIDTH,
                    width: LANE_WIDTH - 16,
                  }}
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-1 p-2.5">
                    <div className="flex items-start gap-1.5">
                      <Building2
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="line-clamp-3 text-[12px] font-semibold leading-snug">
                        {item.organization}
                      </span>
                    </div>
                    {h > 72 && item.employment_type ? (
                      <span className="w-fit rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.employment_type}
                      </span>
                    ) : null}
                    {h > 96 && duration ? (
                      <span className="text-[10px] text-muted-foreground">
                        {duration}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          棒をクリックすると、その期間の役割や関わったプロジェクトが表示されます。
        </p>
      </div>

      {selected ? (
        <ExperienceDetail item={selected} className="lg:sticky lg:top-6 lg:w-[min(100%,22rem)] lg:shrink-0" />
      ) : null}
    </div>
  );
}

function ExperienceDetail({
  item,
  className,
}: {
  item: Experience;
  className?: string;
}) {
  const period = formatExperiencePeriod(item.start_date, item.end_date);
  const duration = formatExperienceDuration(item.start_date, item.end_date);

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-live="polite"
    >
      <p className="m-0 text-[11px] text-muted-foreground">{period}</p>
      <h2 className="m-0 mt-1 text-lg font-semibold leading-snug tracking-tight">
        {item.organization}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        {item.employment_type ? (
          <span className="rounded-md bg-muted px-2 py-0.5">
            {item.employment_type}
          </span>
        ) : null}
        {duration ? <span>{duration}</span> : null}
      </div>
      {item.title || item.role ? (
        <p className="m-0 mt-3 text-[14px] font-medium text-foreground">
          {[item.title, item.role].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {item.summary ? (
        <p className="m-0 mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
      ) : null}
      {item.body_html ? (
        <div
          className="prose prose-sm mt-4 max-w-none text-[13px] leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: item.body_html }}
        />
      ) : null}
      {item.projects?.length ? (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </h3>
          <ul className="m-0 mt-2 list-none space-y-3 p-0">
            {item.projects.map((p) => (
              <li key={p.title} className="m-0">
                <p className="m-0 text-[13px] font-medium text-foreground">
                  {p.title}
                </p>
                {p.description ? (
                  <p className="m-0 mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
