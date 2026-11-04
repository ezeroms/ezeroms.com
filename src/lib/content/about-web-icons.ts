const ICONS: Record<string, string> = {
  bereal: "/images/about/icon_bereal_on.svg",
  bluesky: "/images/about/icon_bluesky_on.svg",
  chooning: "/images/about/icon_chooning_on.svg",
  discord: "/images/about/icon_discord_on.svg",
  duolingo: "/images/about/icon_duolingo_on.svg",
  facebook: "/images/about/icon_facebook_on.svg",
  instagram: "/images/about/icon_instagram_on.svg",
  line: "/images/about/icon_line_on.svg",
  messenger: "/images/about/icon_messenger_on.svg",
  signal: "/images/about/icon_signal_on.svg",
  spotify: "/images/about/icon_spotify_on.svg",
  threads: "/images/about/icon_threads_on.svg",
  tiktok: "/images/about/icon_tiktok_on.svg",
  whatsapp: "/images/about/icon_whatsapp_on.svg",
  x: "/images/about/icon_x_on.svg",
};

const HOST_KEYS: Record<string, string> = {
  "bere.al": "bereal",
  bereal: "bereal",
  "bsky.app": "bluesky",
  chooning: "chooning",
  discord: "discord",
  duolingo: "duolingo",
  facebook: "facebook",
  instagram: "instagram",
  "line.me": "line",
  "m.me": "messenger",
  messenger: "messenger",
  signal: "signal",
  spotify: "spotify",
  threads: "threads",
  tiktok: "tiktok",
  "wa.me": "whatsapp",
  whatsapp: "whatsapp",
  "x.com": "x",
  twitter: "x",
};

function labelKey(label: string): string {
  const normalized = label.trim().toLowerCase();
  if (normalized === "x (twitter)" || normalized === "twitter" || normalized === "x") {
    return "x";
  }
  return normalized.replace(/[^a-z0-9]+/g, "");
}

function hostKey(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (HOST_KEYS[host]) return HOST_KEYS[host];
    const parts = host.split(".");
    for (let i = 0; i < parts.length - 1; i += 1) {
      const suffix = parts.slice(i).join(".");
      if (HOST_KEYS[suffix]) return HOST_KEYS[suffix];
      const brand = parts[i] ?? "";
      if (HOST_KEYS[brand]) return HOST_KEYS[brand];
    }
  } catch {
    return null;
  }
  return null;
}

/** Colored brand icon for an Around the Web link (CSS grayscale at rest). */
export function aboutWebLinkIcon(label: string, url: string): string {
  return (
    ICONS[labelKey(label)] ??
    ICONS[hostKey(url) ?? ""] ??
    "/images/common/icon_link.svg"
  );
}
