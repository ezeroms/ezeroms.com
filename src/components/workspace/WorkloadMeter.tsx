"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { surfaceCard } from "@/lib/site/card-styles";
import { formatEventTimeRange, localDateKeyFromIso } from "@/lib/workspace/calendar/time";
import type {
  HorizonLoad,
  LoadHorizon,
  ScheduledWorkBlock,
  WorkloadSnapshot,
} from "@/lib/workspace/load/compute";

const HORIZONS: { id: LoadHorizon; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "next3", label: "今後3日" },
  { id: "week", label: "今週" },
];

function formatHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0h";
  const h = minutes / 60;
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

/** Display like 「7時間」 / 「1.5時間」 for category breakdown. */
function formatHoursJa(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0時間";
  const h = minutes / 60;
  if (Math.abs(h - Math.round(h)) < 0.05) return `${Math.round(h)}時間`;
  if (h < 10) return `${h.toFixed(1)}時間`;
  return `${Math.round(h)}時間`;
}

function monthDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function formatWorkBlockWhen(
  block: ScheduledWorkBlock,
  singleDay: boolean,
): string {
  const time = formatEventTimeRange(block.startsAt, block.endsAt, false);
  if (singleDay) return time;
  return `${monthDayLabel(localDateKeyFromIso(block.startsAt))} ${time}`;
}

function levelLabel(level: HorizonLoad["level"]): string {
  if (level === "over") return "過密";
  if (level === "busy") return "忙しい";
  return "余裕あり";
}

function levelClass(level: HorizonLoad["level"]): string {
  if (level === "over") return "bg-red-600";
  if (level === "busy") return "bg-amber-500";
  return "bg-emerald-600";
}

function levelTextClass(level: HorizonLoad["level"]): string {
  if (level === "over") return "text-red-700";
  if (level === "busy") return "text-amber-700";
  return "text-emerald-700";
}

type Props = {
  snapshot: WorkloadSnapshot;
  calendarConnected: boolean;
  oauthConfigured: boolean;
};

export function WorkloadMeter({
  snapshot,
  calendarConnected,
  oauthConfigured,
}: Props) {
  const [horizon, setHorizon] = useState<LoadHorizon>("today");
  const data = snapshot.horizons[horizon];

  const maxBarMinutes = useMemo(() => {
    const dayCap = snapshot.capacityMinutesPerDay;
    const peak = Math.max(
      dayCap,
      ...data.days.map(
        (d) => d.meetingMinutes + d.workBlockMinutes + d.unplacedDueMinutes,
      ),
    );
    return peak || dayCap;
  }, [data.days, snapshot.capacityMinutesPerDay]);

  const pressurePct = Math.min(100, Math.round(data.pressureRatio * 100));

  return (
    <section className={surfaceCard({ className: "p-4" })}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            負荷メーター
          </h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            予定・作業枠・期限付き見積もりから、期間の密度を表示
            （可処分 {formatHours(snapshot.capacityMinutesPerDay)}/日）
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HORIZONS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHorizon(h.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                horizon === h.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-border-hover hover:text-foreground",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {!oauthConfigured ? (
        <p className="mt-3 m-0 text-sm text-muted-foreground">
          Google OAuth 未設定のため、会議時間は 0 として計算しています。
        </p>
      ) : !calendarConnected ? (
        <p className="mt-3 m-0 text-sm text-muted-foreground">
          カレンダー未接続のため、会議時間は 0 です。{" "}
          <a
            href="/api/admin/workspace/calendar/oauth/start/"
            className="underline"
          >
            接続する
          </a>
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border bg-background px-3 py-2.5 sm:col-span-2 lg:col-span-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            予定
          </p>
          {data.meetingByLabel.length === 0 ? (
            <p className="m-0 mt-0.5 text-xl font-semibold tabular-nums tracking-tight">
              0時間
            </p>
          ) : (
            <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0">
              {data.meetingByLabel.map((cat) => (
                <li
                  key={cat.label}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {cat.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatHoursJa(cat.minutes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="m-0 mt-1.5 text-xs text-muted-foreground">
            計 {formatHoursJa(data.meetingMinutes)}
          </p>
        </div>
        <Stat
          label="作業枠"
          value={formatHours(data.workBlockMinutes)}
          hint="タスクのカレンダー配置"
        />
        <Stat
          label="未配置の見積もり"
          value={formatHours(data.unplacedMinutes)}
          hint={
            data.unplacedUnknownCount > 0
              ? `見積もりなし ${data.unplacedUnknownCount} 件`
              : "期限が期間内で枠なし"
          }
        />
        <Stat
          label="負荷"
          value={`${pressurePct}%`}
          hint={
            <span className={levelTextClass(data.level)}>
              {levelLabel(data.level)} · 可処分{" "}
              {formatHours(data.capacityMinutes)}
            </span>
          }
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            圧力（予定+作業枠+未配置） / 可処分
          </span>
          <span className="tabular-nums">
            {formatHours(data.scheduledMinutes + data.unplacedMinutes)} /{" "}
            {formatHours(data.capacityMinutes)}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className={cn("h-full rounded-full transition-all", levelClass(data.level))}
            style={{ width: `${pressurePct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <Legend swatch="bg-sky-600" label="会議" />
          <Legend swatch="bg-violet-600" label="作業枠" />
          <Legend swatch="bg-orange-400" label="未配置（期限）" />
          <span className="tabular-nums">
            破線 = 可処分 {formatHours(snapshot.capacityMinutesPerDay)}
          </span>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {data.days.map((day) => {
            const meetingPct =
              (day.meetingMinutes / maxBarMinutes) * 100;
            const blockPct =
              (day.workBlockMinutes / maxBarMinutes) * 100;
            const duePct =
              (day.unplacedDueMinutes / maxBarMinutes) * 100;
            const capPct =
              (snapshot.capacityMinutesPerDay / maxBarMinutes) * 100;
            const isToday =
              day.dateKey === snapshot.horizons.today.days[0]?.dateKey;

            return (
              <li key={day.dateKey} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isToday ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {day.label}
                </span>
                <div className="relative h-3 overflow-hidden rounded-sm bg-black/[0.05]">
                  <div
                    className="absolute inset-y-0 left-0 border-r border-dashed border-foreground/30"
                    style={{ width: `${capPct}%` }}
                  />
                  <div className="absolute inset-y-0 left-0 flex w-full">
                    <div
                      className="h-full bg-sky-600"
                      style={{ width: `${meetingPct}%` }}
                    />
                    <div
                      className="h-full bg-violet-600"
                      style={{ width: `${blockPct}%` }}
                    />
                    <div
                      className="h-full bg-orange-400"
                      style={{ width: `${duePct}%` }}
                    />
                  </div>
                </div>
                <span className="min-w-[4.5rem] text-right text-xs tabular-nums text-muted-foreground">
                  {formatHours(
                    day.meetingMinutes +
                      day.workBlockMinutes +
                      day.unplacedDueMinutes,
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {data.workBlocks.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              作業予定枠
            </h3>
            <Link
              href="/admin/workspace/calendar/"
              className="text-xs text-muted-foreground no-underline hover:underline"
            >
              カレンダー
            </Link>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {data.workBlocks.map((block) => (
              <li key={block.id}>
                <Link
                  href={`/admin/workspace/tasks/${block.taskId}/`}
                  className="flex items-baseline justify-between gap-3 rounded-md px-1 py-1.5 text-sm no-underline hover:bg-black/[0.02]"
                >
                  <span className="min-w-0 truncate">
                    <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                      {formatWorkBlockWhen(block, data.dayCount === 1)}
                    </span>
                    {block.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {formatHours(block.minutes)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 m-0 border-t border-border pt-4 text-sm text-muted-foreground">
          この期間に作業予定枠はありません。
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="m-0 mt-0.5 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="m-0 mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-2 w-2 rounded-sm", swatch)} />
      {label}
    </span>
  );
}
