export const HERE_INTRO_LABEL = "このサイトについて";
export const HERE_RIGHTS_LABEL = "コンテンツの権利";
export const HERE_UPDATES_LABEL = "更新通知を受け取る";

export type AboutHereCard = {
  key: "intro" | "rights" | "updates";
  html: string;
};

function innerText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function splitAtH2(html: string): string[] {
  const trimmed = html.trim();
  if (!trimmed) return [];
  return trimmed.split(/(?=<h2\b)/i).map((part) => part.trim()).filter(Boolean);
}

function isUpdatesHeading(html: string): boolean {
  const heading = html.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "";
  return /更新通知/.test(innerText(heading));
}

function isRightsHeading(html: string): boolean {
  const heading = html.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "";
  return /コンテンツの権利/.test(innerText(heading));
}

function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "").trim();
}

/**
 * 旧・単一本文 HTML を 3 カードに分ける（カラム未保存時のフォールバック）。
 */
export function splitAboutHereHtml(html: string): {
  intro: string;
  rights: string;
  updates: string;
} {
  const parts = splitAtH2(stripLeadingH1(html));
  const intro: string[] = [];
  const rights: string[] = [];
  const updates: string[] = [];

  for (const part of parts) {
    if (!/^<h2\b/i.test(part)) {
      intro.push(part);
      continue;
    }
    if (isUpdatesHeading(part)) updates.push(part);
    else if (isRightsHeading(part) || rights.length) rights.push(part);
    else intro.push(part);
  }

  return {
    intro: intro.join("\n").trim(),
    rights: rights.join("\n").trim(),
    updates: updates.join("\n").trim(),
  };
}

/**
 * 旧・単一 Markdown を 3 欄に分ける（管理画面の初期値用）。
 */
export function parseAboutHereMarkdown(md: string): {
  intro_md: string;
  rights_md: string;
  updates_md: string;
} {
  let text = md.replace(/^\s*#{1,3}\s*このサイトについて\s*\n+/, "");
  const updatesRe = /^(#{1,3}\s+.*更新通知.*)\s*$/m;
  const rightsRe = /^(#{1,3}\s+コンテンツの権利)\s*$/m;

  let updates_md = "";
  const updatesMatch = text.match(updatesRe);
  if (updatesMatch?.index != null) {
    updates_md = text.slice(updatesMatch.index).trim();
    text = text.slice(0, updatesMatch.index).trimEnd();
  }

  let rights_md = "";
  const rightsMatch = text.match(rightsRe);
  if (rightsMatch?.index != null) {
    rights_md = text.slice(rightsMatch.index).trim();
    text = text.slice(0, rightsMatch.index).trimEnd();
  }

  return {
    intro_md: text.trim(),
    rights_md,
    updates_md,
  };
}

export function hereCardsFromFields(input: {
  intro_html?: string | null;
  rights_html?: string | null;
  updates_html?: string | null;
  body_html?: string | null;
}): AboutHereCard[] {
  const intro = (input.intro_html ?? "").trim();
  const rights = (input.rights_html ?? "").trim();
  const updates = (input.updates_html ?? "").trim();
  const structured = Boolean(intro || rights || updates);
  const split = structured
    ? { intro, rights, updates }
    : splitAboutHereHtml(input.body_html ?? "");

  return [
    { key: "intro" as const, html: split.intro },
    { key: "rights" as const, html: split.rights },
    { key: "updates" as const, html: split.updates },
  ].filter((card) => card.html.trim());
}
