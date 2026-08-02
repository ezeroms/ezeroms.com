"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { PhotoEditModal } from "@/components/admin/PhotoEditModal";
import type { PhotoEditorInitial } from "@/components/admin/PhotoEditorForm";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { photoGridSrc } from "@/lib/content/photo-caption";

export type AdminPhotoTableItem = {
  slug: string;
  filename: string;
  date: string;
  status: string;
  image_url: string | null;
  image_thumb_url: string | null;
  location: string | null;
  camera: string | null;
  editor: PhotoEditorInitial;
};

function formatListDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string): string {
  if (status === "published") return "公開";
  if (status === "draft") return "非公開";
  if (status === "archived") return "アーカイブ";
  return status;
}

type Props = {
  galleryId: PhotoGalleryId;
  basePath: string;
  items: AdminPhotoTableItem[];
  empty: boolean;
};

export function AdminPhotoListTable({
  galleryId,
  basePath,
  items,
  empty,
}: Props) {
  const [editing, setEditing] = useState<PhotoEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-16 px-4 py-3 font-medium">写真</th>
            <th className="px-4 py-3 font-medium">ファイル名</th>
            <th className="w-40 px-4 py-3 font-medium">撮影日</th>
            <th className="px-4 py-3 font-medium">場所</th>
            <th className="px-4 py-3 font-medium">機材</th>
            <th className="w-24 px-4 py-3 font-medium">ステータス</th>
            <th className="w-16 px-4 py-3 font-medium text-right">
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const thumbSrc = photoGridSrc(item);
            return (
              <AdminClickableRow
                key={item.slug}
                className="hover:bg-muted/30"
                onActivate={() => setEditing(item.editor)}
              >
                <td className="px-4 py-2.5 align-middle">
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt=""
                      className="m-0 h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </td>
                <td className="max-w-[220px] px-4 py-2.5 align-middle">
                  <span className="font-medium text-foreground">
                    {item.filename || item.slug}
                  </span>
                  <p className="m-0 truncate text-xs text-muted-foreground">
                    {item.slug}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                  {formatListDate(item.date)}
                </td>
                <td className="max-w-[160px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                  {item.location?.trim() || "—"}
                </td>
                <td className="max-w-[180px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                  {item.camera?.trim() || "—"}
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <span
                    className={
                      item.status === "published"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <div className="flex justify-end">
                    <OpenContentButton href={`${basePath}${item.slug}/`} />
                  </div>
                </td>
              </AdminClickableRow>
            );
          })}
          {empty ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                まだ写真がありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <PhotoEditModal
          galleryId={galleryId}
          initial={editing}
          open
          onClose={close}
        />
      ) : null}
    </>
  );
}
