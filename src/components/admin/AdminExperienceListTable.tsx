"use client";

import { useCallback, useState } from "react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ExperienceEditModal } from "@/components/admin/ExperienceEditModal";
import type { ExperienceEditorInitial } from "@/components/admin/ExperienceEditorForm";
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
      <table className={adminListTableClassName}>
        <thead>
          <tr className={adminListHeadRowClassName}>
            <th className={`w-48 ${adminListThClassName}`}>期間</th>
            <th className={adminListThClassName}>組織</th>
            <th className={adminListThClassName}>肩書き</th>
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
                {periodLabel(item.start_date, item.end_date)}
              </td>
              <td
                className={`max-w-[280px] ${adminListTdClassName} font-medium text-foreground`}
              >
                {item.organization || "（無題）"}
              </td>
              <td
                className={`max-w-[200px] truncate ${adminListTdClassName} text-muted-foreground`}
              >
                {item.title?.trim() || "—"}
              </td>
              <td className={adminListTdClassName}>
                <AdminListStatus status={item.status} />
              </td>
              <AdminListActionsCell>
                <OpenContentButton href="/works/experience/" />
              </AdminListActionsCell>
            </AdminClickableRow>
          ))}
          {empty ? (
            <AdminListEmptyRow colSpan={5}>まだ投稿がありません</AdminListEmptyRow>
          ) : null}
        </tbody>
      </table>

      {editing ? (
        <ExperienceEditModal initial={editing} open onClose={close} />
      ) : null}
    </>
  );
}
