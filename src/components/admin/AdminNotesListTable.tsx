"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { NotesEditModal } from "@/components/admin/NotesEditModal";
import type { NotesEditorInitial } from "@/components/admin/NotesEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import {
  adminStatusLabel,
  formatAdminListDate,
} from "@/lib/admin/list-format";

export type AdminNotesTableItem = {
  slug: string;
  date: string;
  status: string;
  place: string | null;
  tags: string[];
  excerpt: string;
  editor: NotesEditorInitial;
};

type Props = {
  items: AdminNotesTableItem[];
  empty: boolean;
};

export function AdminNotesListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<NotesEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-40 px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">本文</th>
            <th className="px-4 py-3 font-medium">場所</th>
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
              <td className="max-w-[360px] truncate px-4 py-2.5 align-middle font-medium text-foreground">
                {item.excerpt || "（本文なし）"}
              </td>
              <td className="max-w-[140px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {item.place?.trim() || "—"}
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
                  <OpenContentButton href={`/diary/${item.slug}/`} />
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
        <NotesEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
