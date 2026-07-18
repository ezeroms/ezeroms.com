"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ColumnEditModal } from "@/components/admin/ColumnEditModal";
import type { ColumnEditorInitial } from "@/components/admin/ColumnEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import {
  adminStatusLabel,
  formatAdminListDate,
} from "@/lib/admin/list-format";

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
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-40 px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">タイトル</th>
            <th className="px-4 py-3 font-medium">カテゴリ</th>
            <th className="w-24 px-4 py-3 font-medium">ステータス</th>
            <th className="w-16 px-4 py-3 font-medium text-right">
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
              <td className="whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                {formatAdminListDate(item.date)}
              </td>
              <td className="max-w-[360px] px-4 py-2.5 align-middle">
                <span className="font-medium text-foreground">
                  {item.title || "（無題）"}
                </span>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {item.slug}
                </p>
              </td>
              <td className="max-w-[180px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {item.categories.length ? item.categories.join(", ") : "—"}
              </td>
              <td className="px-4 py-2.5 align-middle">
                <span
                  className={
                    item.status === "published"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {adminStatusLabel(item.status)}
                </span>
              </td>
              <td className="px-4 py-2.5 align-middle">
                <div className="flex justify-end">
                  <OpenContentButton href={`/column/${item.slug}/`} />
                </div>
              </td>
            </AdminClickableRow>
          ))}
          {empty ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                まだ投稿がありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <ColumnEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
