/** Library 配下のセクション ID。 */
export type LibrarySectionId =
  | "clips"
  | "giants"
  | "chronicle"
  | "media-coverage";

/** 公開サイトでのページ公開状態 */
export type LibrarySectionStatus = "published" | "private";

export type LibrarySectionMeta = {
  id: LibrarySectionId;
  /** UI 表示名 */
  label: string;
  /** published = 公開 / private = 非公開（ナビ非表示・404） */
  status: LibrarySectionStatus;
  /** 公開一覧のパス（末尾スラッシュ付き） */
  basePath: string;
  /** 管理画面のパス（末尾スラッシュ付き） */
  adminPath: string;
};

export const LIBRARY_SECTIONS: Record<LibrarySectionId, LibrarySectionMeta> = {
  clips: {
    id: "clips",
    label: "Clips",
    status: "published",
    basePath: "/clips/",
    adminPath: "/admin/clips/",
  },
  giants: {
    id: "giants",
    label: "The shoulders of Giants",
    status: "published",
    basePath: "/shoulders-of-giants/",
    adminPath: "/admin/giants/",
  },
  chronicle: {
    id: "chronicle",
    label: "Chronicle",
    status: "published",
    basePath: "/chronicle/",
    adminPath: "/admin/chronicle/",
  },
  "media-coverage": {
    id: "media-coverage",
    label: "Media coverage",
    status: "published",
    basePath: "/about/media-coverage/",
    adminPath: "/admin/media-coverage/",
  },
};

export function isLibrarySectionId(v: string): v is LibrarySectionId {
  return Object.keys(LIBRARY_SECTIONS).includes(v);
}

export function isLibrarySectionStatus(v: string): v is LibrarySectionStatus {
  return v === "published" || v === "private";
}

export function getLibrarySection(id: LibrarySectionId): LibrarySectionMeta {
  return LIBRARY_SECTIONS[id];
}

export function isLibrarySectionPublic(section: LibrarySectionMeta): boolean {
  return section.status === "published";
}
