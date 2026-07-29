/** Works 配下のセクション ID（Creative / Experience / Chooning）。 */
export type WorksSectionId = "creative" | "experience" | "chooning";

/** 公開サイトでのページ公開状態 */
export type WorksSectionStatus = "published" | "private";

export type WorksSectionMeta = {
  id: WorksSectionId;
  /** UI 表示名 */
  label: string;
  /** published = 公開 / private = 非公開（ナビ非表示・404） */
  status: WorksSectionStatus;
  /** 一覧・記事フォールバック用 OGP（空なら未設定） */
  og_image: string;
  /** 公開一覧のパス（末尾スラッシュ付き） */
  basePath: string;
  /** 管理画面のパス（末尾スラッシュ付き） */
  adminPath: string;
};

export const WORKS_SECTIONS: Record<WorksSectionId, WorksSectionMeta> = {
  creative: {
    id: "creative",
    label: "Creative",
    status: "published",
    og_image: "",
    basePath: "/works/creative/",
    adminPath: "/admin/creative/",
  },
  experience: {
    id: "experience",
    label: "Experience",
    status: "published",
    og_image: "",
    basePath: "/works/experience/",
    adminPath: "/admin/experience/",
  },
  chooning: {
    id: "chooning",
    label: "Chooning",
    status: "published",
    og_image: "",
    basePath: "/works/chooning/",
    adminPath: "/admin/chooning/",
  },
};

export function isWorksSectionId(v: string): v is WorksSectionId {
  return Object.keys(WORKS_SECTIONS).includes(v);
}

export function isWorksSectionStatus(v: string): v is WorksSectionStatus {
  return v === "published" || v === "private";
}

export function getWorksSection(id: WorksSectionId): WorksSectionMeta {
  return WORKS_SECTIONS[id];
}

export function isWorksSectionPublic(section: WorksSectionMeta): boolean {
  return section.status === "published";
}
