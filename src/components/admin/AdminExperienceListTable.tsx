"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ExperienceEditModal } from "@/components/admin/ExperienceEditModal";
import type { ExperienceEditorInitial } from "@/components/admin/ExperienceEditorForm";
import { OpenContentButton } from "@/components/admin/OpenContentButton";
import {
  adminStatusLabel,
} from "@/lib/admin/list-format";

export type AdminExperienceTableItem = {
  slug: string;
  organization: string;
  title: string;
  start_date: string;
  end_date: string | null;
  status: string;
  editor: ExperienceEditorInitial;
};

type Props = {
  items: AdminExperienceTableItem[];
  empty: boolean;
};

function periodLabel(start: string, end: string | null) {
  const startLabel = start.slice(0, 10) || "—";
  if (!end) return `${startLabel} – 現在`;
  return `${startLabel} – ${end.slice(0, 10)}`;
}

export function AdminExperienceListTable({ items, empty }: Props) {
  const [editing, setEditing] = useState<ExperienceEditorInitial | null>(null);
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-48 px-4 py-3 font-medium">期間</th>
            <th className="px-4 py-3 font-medium">組織</th>
            <th className="px-4 py-3 font-medium">肩書き</th>
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
                {periodLabel(item.start_date, item.end_date)}
              </td>
              <td className="max-w-[280px] px-4 py-2.5 align-middle">
                <span className="font-medium text-foreground">
                  {item.organization || "（無題）"}
                </span>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {item.slug}
                </p>
              </td>
              <td className="max-w-[200px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                {item.title?.trim() || "—"}
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
                  <OpenContentButton href="/works/experience/" />
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
        <ExperienceEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
