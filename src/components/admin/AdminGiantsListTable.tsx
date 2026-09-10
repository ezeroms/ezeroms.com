"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { DuplicateContentButton } from "@/components/admin/DuplicateContentButton";
import { GiantsEditModal } from "@/components/admin/GiantsEditModal";
import type { GiantsEditorInitial } from "@/components/admin/GiantsEditorForm";
import {
  AdminListActionsCell,
  AdminListEmptyRow,
  AdminListStatus,
  adminListHeadRowClassName,
  adminListTableClass,
  adminListTdClassName,
  adminListThClassName,
} from "@/components/admin/AdminListTable";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { giantsPermalink } from "@/lib/content/giants-meta";

export type AdminGiantsTableItem = {
  slug: string;
  excerpt: string;
  citation: string;
  source_url: string;
  status: string;
  tags: string[];
  editor: GiantsEditorInitial;
};

type Props = {
  items: AdminGiantsTableItem[];
  empty: boolean;
};

export function AdminGiantsListTable({ items, empty }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<GiantsEditorInitial | null>(null);
  const [duplicatingSlug, setDuplicatingSlug] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const close = useCallback(() => setEditing(null), []);

  const duplicate = useCallback(
    async (slug: string) => {
      if (duplicatingSlug) return;
      setDuplicateError(null);
      setDuplicatingSlug(slug);
      try {
        const res = await fetch(`/api/admin/giants/${slug}/`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          error?: string;
          editor?: GiantsEditorInitial;
        };
        if (!res.ok || !data.editor) {
          setDuplicateError(data.error || "複製に失敗しました");
          return;
        }
        router.refresh();
        setEditing(data.editor);
      } catch {
        setDuplicateError("複製中に通信エラーが発生しました");
      } finally {
        setDuplicatingSlug(null);
      }
    },
    [duplicatingSlug, router],
  );

  return (
    <>
      {duplicateError ? (
        <p className="px-4 py-2 text-sm text-destructive" role="alert">
          {duplicateError}
        </p>
      ) : null}
      <table className={adminListTableClass("min-w-[800px]")}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={adminListThClassName}>引用</th>
            <th className={adminListThClassName}>書誌</th>
            <th className={`w-28 ${adminListThClassName}`}>購入リンク</th>
            <th className={`w-24 ${adminListThClassName}`}>ステータス</th>
            <th className={`w-24 ${adminListThClassName} text-right`}>
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
              <td className={`max-w-[280px] ${adminListTdClassName}`}>
                <span className="line-clamp-2 text-foreground">
                  {item.excerpt || "—"}
                </span>
                {item.tags.length ? (
                  <p className="m-0 mt-1 truncate text-xs text-muted-foreground">
                    {item.tags.join(" · ")}
                  </p>
                ) : null}
              </td>
              <td
                className={`max-w-[260px] ${adminListTdClassName} text-muted-foreground`}
              >
                <span className="line-clamp-2">{item.citation || "—"}</span>
              </td>
              <td className={adminListTdClassName}>
                {item.source_url ? (
                  <span className="text-foreground">あり</span>
                ) : (
                  <span className="text-muted-foreground">なし</span>
                )}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <DuplicateContentButton
                  loading={duplicatingSlug === item.slug}
                  disabled={Boolean(duplicatingSlug)}
                  onClick={() => void duplicate(item.slug)}
                />
                <OpenContentButton href={giantsPermalink(item.slug)} />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={5}>
              まだエントリがありません
            </AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <GiantsEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
