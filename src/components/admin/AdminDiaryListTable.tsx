"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { DiaryEditModal } from "@/components/admin/DiaryEditModal";
import type { DiaryEditorInitial } from "@/components/admin/DiaryEditorForm";
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

export type AdminDiaryTableItem = {
  slug: string;
  date: string;
  status: string;
  tags: string[];
  excerpt: string;
  editor: DiaryEditorInitial;
};

type Props = {
  items: AdminDiaryTableItem[];
  empty: boolean;
};

export function AdminDiaryListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<DiaryEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-40 ${adminListThClassName}`}>日時</th>
            <th className={adminListThClassName}>本文</th>
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
              <td
                className={`max-w-[360px] truncate ${adminListTdClassName} font-medium text-foreground`}
              >
                {item.excerpt || "（本文なし）"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href={`/diary/${item.slug}/`} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={4}>まだ投稿がありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <DiaryEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
