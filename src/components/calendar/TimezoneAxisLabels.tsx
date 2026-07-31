"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  root: HTMLElement | null;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryEnabled: boolean;
};

/**
 * City labels above the time axis (Google Calendar style).
 * Only shown when two timezones are enabled.
 */
export function TimezoneAxisLabels({
  root,
  primaryLabel,
  secondaryLabel,
  secondaryEnabled,
}: Props) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!root) return;

    if (!secondaryEnabled) {
      root.querySelectorAll(".sx-tz-labels").forEach((n) => n.remove());
      setHost(null);
      return;
    }

    const sync = () => {
      const axis =
        root.querySelector<HTMLElement>(".sx__week-grid__date-axis") ??
        root.querySelector<HTMLElement>(".sx__week-header-content");
      if (!axis) {
        setHost(null);
        return;
      }
      let el = axis.querySelector<HTMLElement>(":scope > .sx-tz-labels");
      if (!el) {
        el = document.createElement("div");
        el.className = "sx-tz-labels sx-tz-labels--dual";
        axis.insertBefore(el, axis.firstChild);
      } else {
        el.className = "sx-tz-labels sx-tz-labels--dual";
      }
      setHost(el);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      root.querySelectorAll(".sx-tz-labels").forEach((n) => n.remove());
    };
  }, [root, secondaryEnabled]);

  if (!secondaryEnabled || !host) return null;

  return createPortal(
    <>
      <span className="sx-tz-labels__secondary">{secondaryLabel}</span>
      <span className="sx-tz-labels__primary">{primaryLabel}</span>
    </>,
    host,
  );
}
