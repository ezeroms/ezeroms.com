/** Writing 配下のセクション ID（Diary / Column）。 */
export type WritingSectionId = "diary" | "column";

/** 公開サイトでのページ公開状態 */
export type WritingSectionStatus = "published" | "private";

export type WritingSectionMeta = {
  id: WritingSectionId;
  label: string;
  description: string;
  status: WritingSectionStatus;
  /** 一覧・記事フォールバック用 OGP（空なら未設定） */
  og_image: string;
  basePath: string;
  adminPath: string;
};

export const WRITING_SECTIONS: Record<WritingSectionId, WritingSectionMeta> = {
  diary: {
    id: "diary",
    label: "Diary",
    description: "日々のできごとや考えたことの記録。",
    status: "published",
    og_image: "",
    basePath: "/diary/",
    adminPath: "/admin/diary/",
  },
  column: {
    id: "column",
    label: "Column",
    description:
      "長めの記事。技術・考察・エッセイなど、きちんと書き切る場所です。",
    status: "published",
    og_image: "",
    basePath: "/column/",
    adminPath: "/admin/column/",
  },
};

export function isWritingSectionId(v: string): v is WritingSectionId {
  return v === "diary" || v === "column";
}

/** 旧 ID `notes` も Diary として扱う。 */
export function resolveWritingSectionId(v: string): WritingSectionId | null {
  if (v === "notes") return "diary";
  if (isWritingSectionId(v)) return v;
  return null;
}

export function isWritingSectionStatus(v: string): v is WritingSectionStatus {
  return v === "published" || v === "private";
}

export function getWritingSection(id: WritingSectionId): WritingSectionMeta {
  return WRITING_SECTIONS[id];
}

export function isWritingSectionPublic(section: WritingSectionMeta): boolean {
  return section.status === "published";
}
