/** Photos 配下のギャラリー ID（Smile / Jampai）。 */
export type PhotoGalleryId = "smile" | "jumpai";

export type PhotoGalleryMeta = {
  id: PhotoGalleryId;
  /** Supabase テーブル名（gallery id と同じ） */
  table: PhotoGalleryId;
  /** UI 表示名 */
  label: string;
  description: string;
  /** 公開一覧のパス（末尾スラッシュ付き） */
  basePath: string;
  /** 管理画面のパス（末尾スラッシュ付き） */
  adminPath: string;
};

export const PHOTO_GALLERIES: Record<PhotoGalleryId, PhotoGalleryMeta> = {
  smile: {
    id: "smile",
    table: "smile",
    label: "Smile",
    description:
      "作品として見せたい写真のギャラリー。Smile に収めた一枚です。",
    basePath: "/smile/",
    adminPath: "/admin/smile/",
  },
  jumpai: {
    id: "jumpai",
    table: "jumpai",
    label: "Jampai",
    description:
      "作品として見せたい写真のギャラリー。Jampai に収めた一枚です。",
    basePath: "/jumpai/",
    adminPath: "/admin/jumpai/",
  },
};

export function isPhotoGalleryId(v: string): v is PhotoGalleryId {
  return v === "smile" || v === "jumpai";
}

export function getPhotoGallery(id: PhotoGalleryId): PhotoGalleryMeta {
  return PHOTO_GALLERIES[id];
}
