"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { DuplicateContentButton } from "@/components/admin/DuplicateContentButton";
import { GiantsEditModal } from "@/components/admin/GiantsEditModal";
import type { GiantsEditorInitial } from "@/components/admin/GiantsEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { adminStatusLabel } from "@/lib/admin/list-format";
import { giantsPermalink } from "@/lib/content/giants-meta";

export type AdminGiantsTableItem = {
  slug: string;
  excerpt: string;
  citation: string;
  source_url: string;
  status: string;
  topics: string[];
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
      <table className="w-full min-w-[800px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">引用</th>
            <th className="px-4 py-3 font-medium">書誌</th>
            <th className="w-28 px-4 py-3 font-medium">購入リンク</th>
            <th className="w-24 px-4 py-3 font-medium">ステータス</th>
            <th className="w-24 px-4 py-3 font-medium text-right">
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
              <td className="max-w-[280px] px-4 py-2.5 align-middle">
                <span className="line-clamp-2 text-foreground">
                  {item.excerpt || "—"}
                </span>
                {item.topics.length ? (
                  <p className="m-0 mt-1 truncate text-xs text-muted-foreground">
                    {item.topics.join(" · ")}
                  </p>
                ) : null}
              </td>
              <td className="max-w-[260px] px-4 py-2.5 align-middle text-muted-foreground">
                <span className="line-clamp-2">{item.citation || "—"}</span>
              </td>
              <td className="px-4 py-2.5 align-middle">
                {item.source_url ? (
                  <span className="text-foreground">あり</span>
                ) : (
                  <span className="text-muted-foreground">なし</span>
                )}
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
                <div className="flex justify-end gap-0.5">
                  <DuplicateContentButton
                    loading={duplicatingSlug === item.slug}
                    disabled={Boolean(duplicatingSlug)}
                    onClick={() => void duplicate(item.slug)}
                  />
                  <OpenContentButton href={giantsPermalink(item.slug)} />
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
                まだエントリがありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <GiantsEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
