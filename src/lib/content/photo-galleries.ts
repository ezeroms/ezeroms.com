export type PhotoGalleryId = "smile" | "jumpai";

export type PhotoGalleryMeta = {
  id: PhotoGalleryId;
  /** Supabase table name */
  table: PhotoGalleryId;
  label: string;
  description: string;
  basePath: string;
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
    label: "Jumpai",
    description:
      "作品として見せたい写真のギャラリー。Jumpai に収めた一枚です。",
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
