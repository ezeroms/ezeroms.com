"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { WorkEditModal } from "@/components/admin/WorkEditModal";
import type { WorkEditorInitial } from "@/components/admin/WorkEditorForm";
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

export type AdminWorkTableItem = {
  slug: string;
  title: string;
  date: string;
  client: string | null;
  status: string;
  editor: WorkEditorInitial;
};

type Props = {
  items: AdminWorkTableItem[];
  empty: boolean;
  /** 公開ページのベースパス（末尾スラッシュ推奨） */
  publicBasePath?: string;
};

export function AdminWorkListTable({
  items,
  empty,
  publicBasePath = "/works/creative/",
}: Props) {
  const [editing, setEditing] = useState<WorkEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const detailBase = publicBasePath.endsWith("/")
    ? publicBasePath
    : `${publicBasePath}/`;

  return (
    <>
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-40 ${adminListThClassName}`}>日時</th>
            <th className={adminListThClassName}>タイトル</th>
            <th className={adminListThClassName}>クライアント</th>
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
                className={`max-w-[160px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.client?.trim() || "—"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href={`${detailBase}${item.slug}/`} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={5}>まだ投稿がありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <WorkEditModal
          initial={editing}
          open
          onClose={close}
          productKey={editing.product_key}
        />
      ) : null}
    </>
  );
}
