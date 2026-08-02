"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { WorkEditModal } from "@/components/admin/WorkEditModal";
import type { WorkEditorInitial } from "@/components/admin/WorkEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import {
  adminStatusLabel,
  formatAdminListDate,
} from "@/lib/admin/list-format";

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
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-40 px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">タイトル</th>
            <th className="px-4 py-3 font-medium">クライアント</th>
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
              <td className="max-w-[160px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {item.client?.trim() || "—"}
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
                  <OpenContentButton href={`${detailBase}${item.slug}/`} />
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
