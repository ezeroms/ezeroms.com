/** Photos 配下のギャラリー ID（Smile / Jampai / Tabekake）。 */
export type PhotoGalleryId = "smile" | "jumpai" | "tabekake";

/** 公開サイトでのページ公開状態 */
export type PhotoGalleryStatus = "published" | "private";

export type PhotoGalleryMeta = {
  id: PhotoGalleryId;
  /** Supabase テーブル名（gallery id と同じ） */
  table: PhotoGalleryId;
  /** UI 表示名 */
  label: string;
  description: string;
  /** published = 公開 / private = 非公開（ナビ非表示・404） */
  status: PhotoGalleryStatus;
  /** 一覧・記事フォールバック用 OGP（空なら未設定） */
  og_image: string;
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
    status: "published",
    og_image: "",
    basePath: "/smile/",
    adminPath: "/admin/smile/",
  },
  jumpai: {
    id: "jumpai",
    table: "jumpai",
    // UI 表記は Jampai。URL・DB id は歴史的経緯で jumpai のまま。
    label: "Jampai",
    description:
      "作品として見せたい写真のギャラリー。Jampai に収めた一枚です。",
    status: "published",
    og_image: "",
    basePath: "/jumpai/",
    adminPath: "/admin/jumpai/",
  },
  tabekake: {
    id: "tabekake",
    table: "tabekake",
    label: "Tabekake",
    description:
      "作品として見せたい写真のギャラリー。Tabekake に収めた一枚です。",
    status: "published",
    og_image: "",
    basePath: "/tabekake/",
    adminPath: "/admin/tabekake/",
  },
};

export function isPhotoGalleryId(v: string): v is PhotoGalleryId {
  return Object.keys(PHOTO_GALLERIES).includes(v);
}

export function isPhotoGalleryStatus(v: string): v is PhotoGalleryStatus {
  return v === "published" || v === "private";
}

export function getPhotoGallery(id: PhotoGalleryId): PhotoGalleryMeta {
  return PHOTO_GALLERIES[id];
}

export function isPhotoGalleryPublic(gallery: PhotoGalleryMeta): boolean {
  return gallery.status === "published";
}
