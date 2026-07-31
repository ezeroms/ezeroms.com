"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  root: HTMLElement | null;
  /** Visible range (ISO instants) used for the month/year heading. */
  rangeStart: string | null;
  rangeEnd: string | null;
  /** Selected date as YYYY-MM-DD. */
  date: string;
  onDateChange: (date: string) => void;
  timeZone: string;
};

function monthYearHeading(
  startIso: string | null,
  endIso: string | null,
  timeZone: string,
): string {
  if (!startIso || !endIso) return "";
  const start = new Date(startIso);
  const end = new Date(endIso);
  const month = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "long", timeZone }).format(d);
  const year = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(d);

  const [sm, sy, em, ey] = [month(start), year(start), month(end), year(end)];
  if (sm === em && sy === ey) return `${sm} ${sy}`;
  if (sy === ey) return `${sm} – ${em} ${sy}`;
  return `${sm} ${sy} – ${em} ${ey}`;
}

/** `2026-08-01` → `2026/08/01` */
function displayDate(value: string): string {
  return value ? value.replaceAll("-", "/") : "";
}

/**
 * Hosts inside the schedule-x header. The built-in heading and date picker are
 * hidden by CSS: the heading goes blank on custom views (2 days / 4 days), and
 * the date input format is locale-locked to MM/DD/YYYY for en-US.
 */
function useHeaderHosts(root: HTMLElement | null) {
  const [hosts, setHosts] = useState<{
    heading: HTMLElement | null;
    date: HTMLElement | null;
  }>({ heading: null, date: null });

  useEffect(() => {
    if (!root) return;

    const sync = () => {
      const contents = root.querySelectorAll<HTMLElement>(
        ".sx__calendar-header .sx__calendar-header-content",
      );
      const left = contents[0] ?? null;
      const right = contents[contents.length - 1] ?? null;
      if (!left || !right || left === right) {
        setHosts((prev) =>
          prev.heading || prev.date ? { heading: null, date: null } : prev,
        );
        return;
      }

      let heading = left.querySelector<HTMLElement>(":scope > .sx-cal-heading");
      if (!heading) {
        heading = document.createElement("div");
        heading.className = "sx-cal-heading";
        left.appendChild(heading);
      }

      let date = right.querySelector<HTMLElement>(":scope > .sx-cal-date");
      if (!date) {
        date = document.createElement("div");
        date.className = "sx-cal-date";
        right.appendChild(date);
      }

      setHosts((prev) =>
        prev.heading === heading && prev.date === date
          ? prev
          : { heading, date },
      );
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      root
        .querySelectorAll(".sx-cal-heading, .sx-cal-date")
        .forEach((n) => n.remove());
    };
  }, [root]);

  return hosts;
}

export function CalendarHeaderExtras({
  root,
  rangeStart,
  rangeEnd,
  date,
  onDateChange,
  timeZone,
}: Props) {
  const { heading, date: dateHost } = useHeaderHosts(root);
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  }

  return (
    <>
      {heading
        ? createPortal(
            <span className="sx-cal-heading__text">
              {monthYearHeading(rangeStart, rangeEnd, timeZone)}
            </span>,
            heading,
          )
        : null}

      {dateHost
        ? createPortal(
            <>
              <button
                type="button"
                className="sx-cal-date__button"
                onClick={openPicker}
                aria-label="日付を選択"
              >
                <span className="sx-cal-date__text">{displayDate(date)}</span>
                <ChevronDown className="sx-cal-date__icon" aria-hidden />
              </button>
              <input
                ref={inputRef}
                type="date"
                className="sx-cal-date__native"
                value={date}
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value);
                }}
              />
            </>,
            dateHost,
          )
        : null}
    </>
  );
}
