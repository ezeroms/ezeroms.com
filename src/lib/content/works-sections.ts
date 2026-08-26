/** Works 配下のセクション ID（Creative / Experience / Chooning）。 */
export type WorksSectionId = "creative" | "experience" | "chooning";

/** 公開サイトでのページ公開状態 */
export type WorksSectionStatus = "published" | "private";

export type WorksSectionMeta = {
  id: WorksSectionId;
  /** UI 表示名 / OGP タイトル */
  label: string;
  /** 一覧ページの OGP description（空ならコード上の既定） */
  description: string;
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
    description:
      "つくったもの・サイトのギャラリー。制作実績を並べて眺める場所です。",
    status: "published",
    og_image: "",
    basePath: "/works/creative/",
    adminPath: "/admin/creative/",
  },
  experience: {
    id: "experience",
    label: "Experience",
    description: "いつ・どこで・何に関わったか。職歴と関与の年表です。",
    status: "published",
    og_image: "",
    basePath: "/works/experience/",
    adminPath: "/admin/experience/",
  },
  chooning: {
    id: "chooning",
    label: "Chooning",
    description:
      "音楽への思いを記録するプロダクト Chooning。特筆して残したい作品です。",
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
