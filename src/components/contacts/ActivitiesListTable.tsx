"use client";

import { useRouter } from "next/navigation";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { tagChipClass } from "@/lib/site/tag-styles";
import {
  formatActivityDate,
  type WorkspaceActivity,
} from "@/types/contacts";

export type ActivitiesTableItem = {
  activity: WorkspaceActivity;
  contactNames: string[];
};

type Props = {
  items: ActivitiesTableItem[];
  emptyMessage?: string;
  /** 友達詳細など、友達列が不要なときは false */
  showContacts?: boolean;
};

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span key={value} className={tagChipClass(false)}>
          {value}
        </span>
      ))}
    </div>
  );
}

export function ActivitiesListTable({
  items,
  emptyMessage = "まだ Activity がありません",
  showContacts = true,
}: Props) {
  const router = useRouter();
  const colSpan = showContacts ? 4 : 3;

  return (
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
          <th className="w-28 px-4 py-3 font-medium">日付</th>
          <th className="w-[28%] max-w-[14rem] px-4 py-3 font-medium">
            アクティビティ名
          </th>
          <th className="px-4 py-3 font-medium">タグ</th>
          {showContacts ? (
            <th className="px-4 py-3 font-medium">コンタクト</th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {items.map(({ activity, contactNames }) => (
          <AdminClickableRow
            key={activity.id}
            className="hover:bg-muted/30"
            onActivate={() =>
              router.push(`/admin/workspace/activities/${activity.id}/`)
            }
          >
            <td className="w-28 whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
              {formatActivityDate(activity.occurred_at) || "—"}
            </td>
            <td className="w-[28%] max-w-[14rem] px-4 py-2.5 align-middle">
              <span className="line-clamp-2 font-medium text-foreground">
                {activity.title || "（無題）"}
              </span>
            </td>
            <td className="px-4 py-2.5 align-middle">
              <ChipList values={activity.tags} />
            </td>
            {showContacts ? (
              <td className="px-4 py-2.5 align-middle">
                <ChipList values={contactNames} />
              </td>
            ) : null}
          </AdminClickableRow>
        ))}
        {items.length === 0 ? (
          <tr>
            <td
              colSpan={colSpan}
              className="px-4 py-10 text-center text-muted-foreground"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
