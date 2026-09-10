"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ColumnEditModal } from "@/components/admin/ColumnEditModal";
import type { ColumnEditorInitial } from "@/components/admin/ColumnEditorForm";
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

export type AdminColumnTableItem = {
  slug: string;
  title: string;
  date: string;
  status: string;
  categories: string[];
  editor: ColumnEditorInitial;
};

type Props = {
  items: AdminColumnTableItem[];
  empty: boolean;
};

export function AdminColumnListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<ColumnEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-40 ${adminListThClassName}`}>日時</th>
            <th className={adminListThClassName}>タイトル</th>
            <th className={adminListThClassName}>カテゴリ</th>
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
                className={`max-w-[360px] ${adminListTdClassName} font-medium text-foreground`}
              >
                {item.title || "（無題）"}
              </td>
              <td
                className={`max-w-[180px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.categories.length ? item.categories.join(", ") : "—"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href={`/column/${item.slug}/`} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={5}>まだ投稿がありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <ColumnEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
