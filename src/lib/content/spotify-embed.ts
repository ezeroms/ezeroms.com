export const SPOTIFY_EMBED_TYPES = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
  "artist",
] as const;

export type SpotifyEmbedType = (typeof SPOTIFY_EMBED_TYPES)[number];

export type SpotifyEmbed = {
  type: SpotifyEmbedType;
  id: string;
};

const SPOTIFY_ID_RE = /^[0-9A-Za-z]{22}$/;
const TYPE_SET = new Set<string>(SPOTIFY_EMBED_TYPES);

const TYPE_ALIASES: Record<string, SpotifyEmbedType> = {
  track: "track",
  album: "album",
  playlist: "playlist",
  episode: "episode",
  show: "show",
  artist: "artist",
  podcast: "show",
};

function decodeHref(raw: string): string {
  return raw.trim().replace(/&amp;/g, "&");
}

function normalizeSpotify(
  typeRaw: string | undefined,
  idRaw: string | undefined,
): SpotifyEmbed | null {
  if (!typeRaw || !idRaw) return null;
  const type = TYPE_ALIASES[typeRaw.toLowerCase()];
  const id = idRaw.split("?")[0]?.split("#")[0];
  if (!type || !id || !SPOTIFY_ID_RE.test(id)) return null;
  if (!TYPE_SET.has(type)) return null;
  return { type, id };
}

/**
 * open.spotify.com / play.spotify.com / spotify: URI から embed 用 type+id を取り出す。
 * ユーザーページや検索 URL は null。
 */
export function parseSpotifyEmbed(url: string): SpotifyEmbed | null {
  const raw = decodeHref(url);
  if (!raw) return null;

  const uri = raw.match(
    /^spotify:(track|album|playlist|episode|show|artist|podcast)[:/]([0-9A-Za-z]+)$/i,
  );
  if (uri) return normalizeSpotify(uri[1], uri[2]);

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "open.spotify.com" && host !== "play.spotify.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    let i = 0;
    if (parts[i]?.toLowerCase().startsWith("intl-")) i += 1;
    if (parts[i]?.toLowerCase() === "embed") i += 1;
    if (parts[i]?.toLowerCase().startsWith("intl-")) i += 1;

    if (
      parts[i]?.toLowerCase() === "user" &&
      parts[i + 2]?.toLowerCase() === "playlist"
    ) {
      return normalizeSpotify("playlist", parts[i + 3]);
    }

    return normalizeSpotify(parts[i], parts[i + 1]);
  } catch {
    return null;
  }
}

export function isSpotifyEmbedUrl(url: string): boolean {
  return parseSpotifyEmbed(url) != null;
}

export function spotifyEmbedHeight(type: SpotifyEmbedType): 152 | 352 {
  return type === "track" || type === "episode" ? 152 : 352;
}

export function spotifyEmbedVariant(
  type: SpotifyEmbedType,
): "compact" | "expanded" {
  return spotifyEmbedHeight(type) === 152 ? "compact" : "expanded";
}

export function spotifyEmbedSrc(embed: SpotifyEmbed): string {
  return `https://open.spotify.com/embed/${embed.type}/${embed.id}`;
}
