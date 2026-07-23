"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import { TopImageEditModal } from "@/components/admin/TopImageEditModal";
import type { TopImageEditorInitial } from "@/components/admin/TopImageEditorForm";
import { adminStatusLabel } from "@/lib/admin/list-format";

export type AdminTopImageTableItem = {
  slug: string;
  filename: string;
  image_url: string | null;
  location: string | null;
  captured_year: number | null;
  sort_order: number;
  status: string;
  editor: TopImageEditorInitial;
};

type Props = {
  items: AdminTopImageTableItem[];
  empty: boolean;
};

function captionLabel(item: AdminTopImageTableItem): string {
  const loc = item.location?.trim();
  const year = item.captured_year;
  if (loc && year) return `${loc}, ${year}`;
  if (loc) return loc;
  if (year) return String(year);
  return "—";
}

export function AdminTopImageListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<TopImageEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-16 px-4 py-3 font-medium">画像</th>
            <th className="px-4 py-3 font-medium">ファイル名</th>
            <th className="px-4 py-3 font-medium">場所・年</th>
            <th className="w-20 px-4 py-3 font-medium">表示順</th>
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
              <td className="px-4 py-2.5 align-middle">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt=""
                    className="m-0 h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    —
                  </div>
                )}
              </td>
              <td className="max-w-[220px] px-4 py-2.5 align-middle">
                <span className="font-medium text-foreground">
                  {item.filename || item.slug}
                </span>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {item.slug}
                </p>
              </td>
              <td className="max-w-[200px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {captionLabel(item)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                {item.sort_order}
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
                  <OpenContentButton href="/" />
                </div>
              </td>
            </AdminClickableRow>
          ))}
          {empty ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                まだ画像がありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <TopImageEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
