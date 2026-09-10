"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ClipsEditModal } from "@/components/admin/ClipsEditModal";
import type { ClipsEditorInitial } from "@/components/admin/ClipsEditorForm";
import {
  AdminListActionsCell,
  AdminListEmptyRow,
  AdminListStatus,
  adminListHeadRowClassName,
  adminListTableClassName,
  adminListTdClassName,
  adminListThClassName,
} from "@/components/admin/AdminListTable";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { formatAdminListDate } from "@/lib/admin/list-format";
import { clipSourceLabel } from "@/lib/content/clip-meta";

export type AdminClipsTableItem = {
  slug: string;
  title: string;
  source_url: string;
  source_name: string;
  date: string;
  status: string;
  memo: string;
  editor: ClipsEditorInitial;
};

type Props = {
  items: AdminClipsTableItem[];
  empty: boolean;
};

export function AdminClipsListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<ClipsEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-40 ${adminListThClassName}`}>日時</th>
            <th className={adminListThClassName}>タイトル</th>
            <th className={adminListThClassName}>メモ</th>
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
              <td
                className={`whitespace-nowrap ${adminListTdClassName} text-muted-foreground`}
              >
                {formatAdminListDate(item.date)}
              </td>
              <td className={`max-w-[280px] ${adminListTdClassName}`}>
                <span className="font-medium text-foreground">{item.title}</span>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {clipSourceLabel(item.source_url, item.source_name)}
                </p>
              </td>
              <td
                className={`max-w-[180px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.memo.trim() || "—"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href={item.source_url} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={5}>まだクリップがありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <ClipsEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
