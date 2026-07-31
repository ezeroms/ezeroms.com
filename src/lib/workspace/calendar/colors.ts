/** Derives schedule-x calendar color sets from Google calendar hex colors. */

const FALLBACK = "#1a73e8";

function normalizeHex(color: string | null | undefined): string {
  const raw = color?.trim();
  if (!raw || !raw.startsWith("#")) return FALLBACK;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return raw.length === 7 ? raw : FALLBACK;
}

function toRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b].some(Number.isNaN) ? [26, 115, 232] : [r, g, b];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(
  color: [number, number, number],
  target: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    color[0] + (target[0] - color[0]) * amount,
    color[1] + (target[1] - color[1]) * amount,
    color[2] + (target[2] - color[2]) * amount,
  ];
}

export type ColorDefinition = {
  main: string;
  container: string;
  onContainer: string;
};

export function calendarColors(googleColor: string | null | undefined): {
  light: ColorDefinition;
  dark: ColorDefinition;
} {
  const hex = normalizeHex(googleColor);
  const rgb = toRgb(hex);
  return {
    light: {
      main: hex,
      container: toHex(mix(rgb, [255, 255, 255], 0.82)),
      onContainer: toHex(mix(rgb, [0, 0, 0], 0.55)),
    },
    dark: {
      main: toHex(mix(rgb, [255, 255, 255], 0.35)),
      container: toHex(mix(rgb, [0, 0, 0], 0.55)),
      onContainer: toHex(mix(rgb, [255, 255, 255], 0.75)),
    },
  };
}

/** schedule-x ids must be CSS querySelector-safe (no @, :, etc.). */
function safeIdent(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** schedule-x calendar keys must be simple identifiers. */
export function calendarKey(googleCalendarId: string): string {
  return `cal_${safeIdent(googleCalendarId)}`;
}

/** schedule-x event ids must be simple identifiers. */
export function eventKey(
  googleCalendarId: string,
  googleEventId: string,
): string {
  return `ev_${safeIdent(googleCalendarId)}_${safeIdent(googleEventId)}`;
}
