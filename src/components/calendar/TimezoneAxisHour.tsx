"use client";

import {
  formatAxisClock,
  secondaryAxisClock,
} from "@/lib/workspace/calendar/timezones";

type Props = {
  hour: number;
  minute?: number;
  dayStartsHour?: number;
  primaryTimezone: string;
  secondaryTimezone: string;
  secondaryEnabled: boolean;
};

/** Replaces schedule-x hour labels; optional second column for secondary TZ. */
export function TimezoneAxisHour({
  hour,
  minute = 0,
  dayStartsHour = 0,
  primaryTimezone,
  secondaryTimezone,
  secondaryEnabled,
}: Props) {
  const primary = formatAxisClock(hour, minute, dayStartsHour);
  const secondary = secondaryEnabled
    ? secondaryAxisClock(hour, minute, primaryTimezone, secondaryTimezone)
    : null;

  return (
    <div
      className={
        secondaryEnabled ? "sx-tz-hour sx-tz-hour--dual" : "sx-tz-hour"
      }
    >
      {secondary ? (
        <span className="sx-tz-hour__secondary">{secondary}</span>
      ) : null}
      <span className="sx-tz-hour__primary">{primary}</span>
    </div>
  );
}
