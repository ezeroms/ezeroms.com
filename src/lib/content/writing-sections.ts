/** Writing 配下のセクション ID（Notes / Column）。 */
export type WritingSectionId = "notes" | "column";

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
  notes: {
    id: "notes",
    label: "Notes",
    description: "日常の短いメモとスナップ。気づきや記録を残す場所です。",
    status: "published",
    og_image: "",
    basePath: "/diary/",
    adminPath: "/admin/notes/",
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
  return Object.keys(WRITING_SECTIONS).includes(v);
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
