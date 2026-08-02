"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ClipsEditModal } from "@/components/admin/ClipsEditModal";
import type { ClipsEditorInitial } from "@/components/admin/ClipsEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import {
  adminStatusLabel,
  formatAdminListDate,
} from "@/lib/admin/list-format";
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
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-40 px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">タイトル</th>
            <th className="px-4 py-3 font-medium">メモ</th>
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
              className="bg-card hover:bg-muted/30"
              onActivate={() => setEditing(item.editor)}
            >
              <td className="whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                {formatAdminListDate(item.date)}
              </td>
              <td className="max-w-[280px] px-4 py-2.5 align-middle">
                <span className="font-medium text-foreground">{item.title}</span>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {clipSourceLabel(item.source_url, item.source_name)}
                </p>
              </td>
              <td className="max-w-[180px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {item.memo.trim() || "—"}
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
                  <OpenContentButton href={item.source_url} />
                </div>
              </td>
            </AdminClickableRow>
          ))}
          {empty ? (
            <tr className="bg-card">
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                まだクリップがありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <ClipsEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
