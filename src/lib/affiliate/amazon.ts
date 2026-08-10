/**
 * Amazon Associates: 汎用の商品 URL を保存し、表示時だけ tag を付与する。
 * プログラム離脱時は site_settings.amazon_affiliate_tag を空にすればよい。
 *
 * 短縮 URL（amzn.asia / amzn.to）は保存時に /dp/ASIN へ正規化する。
 * 非 Amazon ドメインはそのまま保存し、アフィリエイトも付与しない。
 */

const AMAZON_HOST = /^(?:.+\.)?amazon\.[a-z.]+$/i;
const AMZN_SHORT_HOST = /^(?:.+\.)?amzn\.(?:to|asia)$/i;

/** Amazon 商品ページの ASIN（10 桁英数字）。 */
const ASIN_IN_PATH =
  /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/(?:ASIN|asin))\/([A-Z0-9]{10})(?:[/?]|$)/i;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** 短縮 URL 解決の短いプロセス内キャッシュ（同一 amzn.asia を複数記事で共有するため）。 */
const resolveCache = new Map<string, Promise<string>>();

export function isAmazonHostname(hostname: string): boolean {
  return AMAZON_HOST.test(hostname) || AMZN_SHORT_HOST.test(hostname);
}

export function isAmazonShortHostname(hostname: string): boolean {
  return AMZN_SHORT_HOST.test(hostname);
}

export function isAmazonProductUrl(url: string): boolean {
  try {
    return isAmazonHostname(new URL(url.trim()).hostname);
  } catch {
    return false;
  }
}

export function isAmazonShortUrl(url: string): boolean {
  try {
    return isAmazonShortHostname(new URL(url.trim()).hostname);
  } catch {
    return false;
  }
}

/** Associates の tracking ID として妥当か（英数字・ハイフン・アンダースコア）。 */
export function isValidAmazonAffiliateTag(tag: string): boolean {
  const t = tag.trim();
  if (!t) return true; // 空は「無効化」として許可
  return /^[A-Za-z0-9_-]{2,64}$/.test(t);
}

export function extractAmazonAsin(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const fromPath = parsed.pathname.match(ASIN_IN_PATH);
    if (fromPath?.[1]) return fromPath[1].toUpperCase();
    const fromQuery = parsed.searchParams.get("asin");
    if (fromQuery && /^[A-Z0-9]{10}$/i.test(fromQuery)) {
      return fromQuery.toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * フルの Amazon 商品 URL を `https://{host}/dp/{ASIN}` に整える。
 * ASIN が取れなければ null。
 */
export function canonicalizeAmazonProductUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!AMAZON_HOST.test(parsed.hostname)) return null;
    const asin = extractAmazonAsin(url);
    if (!asin) return null;
    const host = parsed.hostname.toLowerCase();
    const wwwHost = host.startsWith("www.") ? host : `www.${host}`;
    return `https://${wwwHost}/dp/${asin}`;
  } catch {
    return null;
  }
}

/**
 * 短縮 URL をたどって最終 URL を得る（本文は読み捨て）。
 * Amazon 側が応答しない場合に備えタイムアウトする。
 */
export async function resolveAmazonShortUrl(url: string): Promise<string> {
  const key = url.trim();
  const cached = resolveCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const started = Date.now();
    try {
      const res = await fetch(key, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
      const finalUrl = res.url || key;
      await res.body?.cancel().catch(() => undefined);
      console.info("[amazon] short URL resolved", {
        from: key,
        to: finalUrl,
        status: res.status,
        ms: Date.now() - started,
      });
      if (!res.ok && !extractAmazonAsin(finalUrl)) {
        throw new Error(`Amazon short URL resolve failed (${res.status})`);
      }
      return finalUrl;
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      console.error("[amazon] short URL resolve failed", {
        url: key,
        timedOut,
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        ms: Date.now() - started,
      });
      if (timedOut) {
        throw new Error("Amazon short URL resolve timed out");
      }
      throw error;
    }
  })();

  resolveCache.set(key, pending);
  try {
    return await pending;
  } catch (e) {
    resolveCache.delete(key);
    throw e;
  }
}

/**
 * 購入リンクを保存用に正規化。
 * - 非 Amazon → そのまま
 * - amzn.asia / amzn.to → 解決して /dp/ASIN
 * - amazon.* → /dp/ASIN（クエリ除去）+ tag 除去
 */
export async function normalizePurchaseUrl(
  url: string | null | undefined,
): Promise<{
  value: string | null;
  error?: string;
  debug?: Record<string, unknown>;
}> {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return { value: null };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      value: null,
      error: "購入リンクの URL が不正です",
      debug: { stage: "parse", raw },
    };
  }

  if (!isAmazonHostname(parsed.hostname)) {
    return { value: raw };
  }

  let candidate = raw;
  if (isAmazonShortHostname(parsed.hostname)) {
    try {
      candidate = await resolveAmazonShortUrl(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const timedOut = /timed out/i.test(message);
      return {
        value: null,
        error: timedOut
          ? "Amazon 短縮URLの解決がタイムアウトしました。amazon.co.jp の商品URL（/dp/…）を貼ってください"
          : "Amazon 短縮URLを商品ページに解決できませんでした。amazon.co.jp の商品URL（/dp/…）を貼ってください",
        debug: {
          stage: "resolve-short",
          raw,
          timedOut,
          message,
        },
      };
    }
  }

  const canonical = canonicalizeAmazonProductUrl(candidate);
  if (canonical) {
    return {
      value: canonical,
      debug: { stage: "canonical", raw, candidate, canonical },
    };
  }

  // Amazon だが ASIN 不明（検索結果ページ等）→ tag だけ落として保存
  return {
    value: stripAmazonAffiliateTag(candidate) ?? candidate,
    debug: { stage: "strip-tag-fallback", raw, candidate },
  };
}

/**
 * Amazon URL なら `tag` クエリを付与／上書き。非 Amazon・タグ空は入力をそのまま返す。
 */
export function withAmazonAffiliateTag(
  url: string | null | undefined,
  tag: string | null | undefined,
): string | null {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return raw || null;

  const affiliateTag = typeof tag === "string" ? tag.trim() : "";
  if (!affiliateTag) return raw;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }

  if (!isAmazonHostname(parsed.hostname)) {
    return raw;
  }

  parsed.searchParams.set("tag", affiliateTag);
  return parsed.toString();
}

/**
 * 保存時用: Amazon URL から `tag` を取り除く（正規化前の簡易クリーン）。
 */
export function stripAmazonAffiliateTag(
  url: string | null | undefined,
): string | null {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return raw || null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }

  if (!isAmazonHostname(parsed.hostname)) {
    return raw;
  }

  if (!parsed.searchParams.has("tag")) return raw;
  parsed.searchParams.delete("tag");
  return parsed.toString();
}
