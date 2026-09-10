"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { PhotoEditModal } from "@/components/admin/PhotoEditModal";
import type { PhotoEditorInitial } from "@/components/admin/PhotoEditorForm";
import {
  AdminListActionsCell,
  AdminListEmptyRow,
  AdminListStatus,
  AdminListThumb,
  adminListHeadRowClassName,
  adminListTableClassName,
  adminListTdClassName,
  adminListThClassName,
} from "@/components/admin/AdminListTable";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { photoGridSrc } from "@/lib/content/photo-caption";
import { formatAdminListDate } from "@/lib/admin/list-format";

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
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-16 ${adminListThClassName}`}>写真</th>
            <th className={adminListThClassName}>ファイル名</th>
            <th className={`w-40 ${adminListThClassName}`}>撮影日</th>
            <th className={adminListThClassName}>場所</th>
            <th className={adminListThClassName}>機材</th>
            <th className={`w-24 ${adminListThClassName}`}>ステータス</th>
            <th className={`w-16 ${adminListThClassName} text-right`}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <AdminClickableRow
              key={item.slug}
              className="hover:bg-muted/30"
              onActivate={() => setEditing(item.editor)}
            >
              <td className={adminListTdClassName}>
                <AdminListThumb src={photoGridSrc(item)} />
              </td>
              <td
                className={`max-w-[220px] ${adminListTdClassName} font-medium text-foreground`}
              >
                {item.filename || item.slug}
              </td>
              <td
                className={`whitespace-nowrap ${adminListTdClassName} text-muted-foreground`}
              >
                {formatAdminListDate(item.date)}
              </td>
              <td
                className={`max-w-[160px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.location?.trim() || "—"}
              </td>
              <td
                className={`max-w-[180px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.camera?.trim() || "—"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href={`${basePath}${item.slug}/`} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={7}>まだ写真がありません</AdminListEmptyRow>
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
