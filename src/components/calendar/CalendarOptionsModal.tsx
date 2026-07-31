"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import type { WeekStartsOn } from "@/lib/workspace/calendar/time";
import {
  defaultLabelForTimeZone,
  timezoneSelectOptions,
} from "@/lib/workspace/calendar/timezones";
import type { GoogleCalendarListItem } from "@/types/calendar";

export type CalendarOptionsValues = {
  hiddenCalendarIds: string[];
  weekStartsOn: WeekStartsOn;
  dayStartsHour: number;
  writableCalendarId: string | null;
  primaryTimezone: string;
  primaryLabel: string;
  secondaryTimezoneEnabled: boolean;
  secondaryTimezone: string;
  secondaryLabel: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  calendars: GoogleCalendarListItem[];
  writableCalendars: GoogleCalendarListItem[];
  canWrite: boolean;
  initial: CalendarOptionsValues;
  busy?: boolean;
  onSave: (next: CalendarOptionsValues) => Promise<void>;
  onDisconnect: () => void;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}

/** Calendar settings dialog (same shell as Photos / blog settings modals). */
export function CalendarOptionsModal({
  open,
  onClose,
  calendars,
  writableCalendars,
  canWrite,
  initial,
  busy = false,
  onSave,
  onDisconnect,
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(() => new Set(initial.hiddenCalendarIds));
  const [weekStartsOn, setWeekStartsOn] = useState(initial.weekStartsOn);
  const [dayStartsHour, setDayStartsHour] = useState(initial.dayStartsHour);
  const [writableId, setWritableId] = useState(initial.writableCalendarId);
  const [primaryTimezone, setPrimaryTimezone] = useState(
    initial.primaryTimezone,
  );
  const [primaryLabel, setPrimaryLabel] = useState(initial.primaryLabel);
  const [secondaryEnabled, setSecondaryEnabled] = useState(
    initial.secondaryTimezoneEnabled,
  );
  const [secondaryTimezone, setSecondaryTimezone] = useState(
    initial.secondaryTimezone,
  );
  const [secondaryLabel, setSecondaryLabel] = useState(initial.secondaryLabel);

  const tzOptions = useMemo(
    () =>
      timezoneSelectOptions([
        initial.primaryTimezone,
        initial.secondaryTimezone,
      ]),
    [initial.primaryTimezone, initial.secondaryTimezone],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHidden(new Set(initial.hiddenCalendarIds));
    setWeekStartsOn(initial.weekStartsOn);
    setDayStartsHour(initial.dayStartsHour);
    setWritableId(initial.writableCalendarId);
    setPrimaryTimezone(initial.primaryTimezone);
    setPrimaryLabel(initial.primaryLabel);
    setSecondaryEnabled(initial.secondaryTimezoneEnabled);
    setSecondaryTimezone(initial.secondaryTimezone);
    setSecondaryLabel(initial.secondaryLabel);
    setSaving(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving && !busy) onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving, busy]);

  const dirty =
    weekStartsOn !== initial.weekStartsOn ||
    dayStartsHour !== initial.dayStartsHour ||
    writableId !== initial.writableCalendarId ||
    primaryTimezone !== initial.primaryTimezone ||
    primaryLabel !== initial.primaryLabel ||
    secondaryEnabled !== initial.secondaryTimezoneEnabled ||
    secondaryTimezone !== initial.secondaryTimezone ||
    secondaryLabel !== initial.secondaryLabel ||
    !sameIds([...hidden], initial.hiddenCalendarIds);

  function swapTimezones() {
    setPrimaryTimezone(secondaryTimezone);
    setPrimaryLabel(secondaryLabel);
    setSecondaryTimezone(primaryTimezone);
    setSecondaryLabel(primaryLabel);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        hiddenCalendarIds: [...hidden],
        weekStartsOn,
        dayStartsHour,
        writableCalendarId: writableId,
        primaryTimezone,
        primaryLabel: primaryLabel.trim() || defaultLabelForTimeZone(primaryTimezone),
        secondaryTimezoneEnabled: secondaryEnabled,
        secondaryTimezone,
        secondaryLabel:
          secondaryLabel.trim() || defaultLabelForTimeZone(secondaryTimezone),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || !open) return null;

  const locked = saving || busy;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default appearance-none border-0 bg-transparent p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={() => {
          if (!locked) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-lg border-0 bg-card shadow-none",
          "max-h-[min(90vh,44rem)] font-sans text-foreground",
        )}
      >
        <div className="shrink-0 border-0 border-b border-solid border-border px-6 py-4">
          <h2
            id={titleId}
            className="m-0 text-lg font-semibold tracking-tight"
          >
            カレンダーオプション
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <section className="space-y-2">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My calendars
            </h3>
            <ul className="m-0 max-h-48 list-none space-y-0.5 overflow-y-auto p-0">
              {calendars.map((cal) => {
                const checked = !hidden.has(cal.id);
                return (
                  <li key={cal.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-black/[0.02]">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm border"
                        style={{
                          backgroundColor: checked
                            ? cal.backgroundColor || "#1a73e8"
                            : "transparent",
                          borderColor: cal.backgroundColor || "#1a73e8",
                        }}
                      />
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={locked}
                        onChange={() => {
                          setHidden((prev) => {
                            const next = new Set(prev);
                            if (next.has(cal.id)) next.delete(cal.id);
                            else next.add(cal.id);
                            return next;
                          });
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {cal.summary}
                        {cal.primary ? "（メイン）" : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              タイムゾーン
            </h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={secondaryEnabled}
                disabled={locked}
                onChange={(e) => setSecondaryEnabled(e.target.checked)}
              />
              第2のタイムゾーンを表示
            </label>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">
                    メインのタイムゾーン
                  </span>
                  <Select
                    value={primaryTimezone}
                    disabled={locked}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPrimaryTimezone(next);
                      if (
                        !primaryLabel.trim() ||
                        primaryLabel ===
                          defaultLabelForTimeZone(primaryTimezone)
                      ) {
                        setPrimaryLabel(defaultLabelForTimeZone(next));
                      }
                    }}
                  >
                    {tzOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">
                    ラベル
                  </span>
                  <Input
                    value={primaryLabel}
                    disabled={locked}
                    maxLength={32}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                  />
                </div>
              </div>

              {secondaryEnabled ? (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">
                          第2のタイムゾーン
                        </span>
                        <Select
                          value={secondaryTimezone}
                          disabled={locked}
                          onChange={(e) => {
                            const next = e.target.value;
                            setSecondaryTimezone(next);
                            if (
                              !secondaryLabel.trim() ||
                              secondaryLabel ===
                                defaultLabelForTimeZone(secondaryTimezone)
                            ) {
                              setSecondaryLabel(defaultLabelForTimeZone(next));
                            }
                          }}
                        >
                          {tzOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">
                          ラベル
                        </span>
                        <Input
                          value={secondaryLabel}
                          disabled={locked}
                          maxLength={32}
                          onChange={(e) => setSecondaryLabel(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="タイムゾーンを入れ替え"
                    aria-label="タイムゾーンを入れ替え"
                    disabled={locked}
                    className="mt-6 shrink-0 rounded-md border border-border px-2 py-2 text-muted-foreground hover:bg-black/[0.03] disabled:opacity-50"
                    onClick={swapTimezones}
                  >
                    <span aria-hidden className="block text-sm leading-none">
                      ↕
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              カレンダーの時間軸とイベント表示に使います。第2のタイムゾーンは左列に並びます。
            </p>
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              週の開始
            </h3>
            <Select
              value={weekStartsOn}
              disabled={locked}
              onChange={(e) =>
                setWeekStartsOn(e.target.value as WeekStartsOn)
              }
            >
              <option value="monday">月曜はじまり</option>
              <option value="sunday">日曜はじまり</option>
            </Select>
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1日のはじまり
            </h3>
            <Select
              value={String(dayStartsHour)}
              disabled={locked}
              onChange={(e) => setDayStartsHour(Number(e.target.value))}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </Select>
            <p className="m-0 text-xs text-muted-foreground">
              タイムラインの最上段の時刻です（例: 06:00 なら 6 時から表示）。
            </p>
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              書き込み先
            </h3>
            {canWrite ? (
              <>
                <Select
                  value={writableId ?? ""}
                  disabled={locked || writableCalendars.length === 0}
                  onChange={(e) => setWritableId(e.target.value || null)}
                >
                  <option value="">未選択</option>
                  {writableCalendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? " · メイン" : ""}
                    </option>
                  ))}
                </Select>
                <p className="m-0 text-xs text-muted-foreground">
                  Google への作業枠作成時に使います（ドラッグ配置は DB
                  のみ）。
                </p>
              </>
            ) : (
              <p className="m-0 text-xs text-muted-foreground">
                再接続後に設定できます。
              </p>
            )}
          </section>

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600"
              onClick={onDisconnect}
              disabled={locked}
            >
              Google連携を解除
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-0 border-t border-solid border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={!dirty || locked}
            onClick={() => void handleSave()}
          >
            {saving ? "保存中…" : "設定を保存"}
          </Button>
        </div>
      </div>
    </div>,
    document.querySelector(".admin-root") ?? document.body,
  );
}
