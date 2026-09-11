"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { TopImageEditModal } from "@/components/admin/TopImageEditModal";
import type { TopImageEditorInitial } from "@/components/admin/TopImageEditorForm";
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

export type AdminTopImageTableItem = {
  slug: string;
  filename: string;
  image_url: string | null;
  location: string | null;
  captured_year: number | null;
  sort_order: number;
  status: string;
  editor: TopImageEditorInitial;
};

type Props = {
  items: AdminTopImageTableItem[];
  empty: boolean;
};

function captionLabel(item: AdminTopImageTableItem): string {
  const loc = item.location?.trim();
  const year = item.captured_year;
  if (loc && year) return `${loc}, ${year}`;
  if (loc) return loc;
  if (year) return String(year);
  return "—";
}

export function AdminTopImageListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<TopImageEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-16 ${adminListThClassName}`}>画像</th>
            <th className={adminListThClassName}>ファイル名</th>
            <th className={adminListThClassName}>場所・年</th>
            <th className={`w-20 ${adminListThClassName}`}>表示順</th>
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
                <AdminListThumb src={item.image_url} />
              </td>
              <td
                className={`max-w-[220px] ${adminListTdClassName} font-medium text-foreground`}
              >
                {item.filename || item.slug}
              </td>
              <td
                className={`max-w-[200px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {captionLabel(item)}
              </td>
              <td
                className={`whitespace-nowrap ${adminListTdClassName} text-muted-foreground`}
              >
                {item.sort_order}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href="/" />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={6}>まだ画像がありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <TopImageEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
