"use client";

import { useEffect } from "react";
import { hybridDateKeyInTimeZone } from "@/lib/workspace/calendar/timezones";

const COLUMN_LINE_CLASS = "sx-now-line";
const FULL_WEEK_LINE_CLASS = "sx-now-line-full";

function minutesFromDayStart(
  hour: number,
  minute: number,
  dayStartsHour: number,
): number {
  const start = ((dayStartsHour % 24) + 24) % 24;
  return (hour * 60 + minute - start * 60 + 24 * 60) % (24 * 60);
}

/**
 * Current-time indicator for hybrid days. Replaces @schedule-x/current-time,
 * which always targets the civil calendar date column — with dayStartsHour > 0
 * the early-morning hours belong to the previous day's column instead.
 */
export function useHybridCurrentTimeColumn(
  root: HTMLElement | null,
  dayStartsHour: number,
  timeZone: string,
) {
  useEffect(() => {
    if (!root) return;

    let syncing = false;

    const sync = () => {
      if (syncing) return;
      syncing = true;
      try {
        const now = new Date();
        const key = hybridDateKeyInTimeZone(
          now.getTime(),
          dayStartsHour,
          timeZone,
        );
        const column = root.querySelector<HTMLElement>(
          `[data-time-grid-date="${key}"]`,
        );

        for (const stale of root.querySelectorAll<HTMLElement>(
          `.${COLUMN_LINE_CLASS}`,
        )) {
          if (stale.parentElement !== column) stale.remove();
        }
        if (!column) {
          root
            .querySelectorAll(`.${FULL_WEEK_LINE_CLASS}`)
            .forEach((n) => n.remove());
          return;
        }

        let clock: { hour: number; minute: number };
        try {
          const zdt = Temporal.Now.zonedDateTimeISO(timeZone);
          clock = { hour: zdt.hour, minute: zdt.minute };
        } catch {
          clock = { hour: now.getHours(), minute: now.getMinutes() };
        }
        const top = `${(minutesFromDayStart(clock.hour, clock.minute, dayStartsHour) / (24 * 60)) * 100}%`;

        let line = column.querySelector<HTMLElement>(`.${COLUMN_LINE_CLASS}`);
        if (!line) {
          line = document.createElement("div");
          line.className = COLUMN_LINE_CLASS;
          column.appendChild(line);
        }
        line.style.top = top;

        const weekGrid = root.querySelector<HTMLElement>(".sx__week-grid");
        if (weekGrid) {
          let full = weekGrid.querySelector<HTMLElement>(
            `:scope > .${FULL_WEEK_LINE_CLASS}`,
          );
          if (!full) {
            full = document.createElement("div");
            full.className = FULL_WEEK_LINE_CLASS;
            weekGrid.appendChild(full);
          }
          full.style.top = top;
        }
      } finally {
        syncing = false;
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    // Align updates to the next minute boundary, then every minute.
    let interval: number | undefined;
    const timeout = window.setTimeout(
      () => {
        sync();
        interval = window.setInterval(sync, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
      root
        .querySelectorAll(`.${COLUMN_LINE_CLASS}, .${FULL_WEEK_LINE_CLASS}`)
        .forEach((n) => n.remove());
    };
  }, [root, dayStartsHour, timeZone]);
}
