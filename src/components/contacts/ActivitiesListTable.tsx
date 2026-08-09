"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ClickToEditField } from "@/components/ui/click-to-edit-field";
import { tagChipClass } from "@/lib/site/tag-styles";
import { cn } from "@/lib/cn";
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
  /**
   * tags = アクティビティ名 + タグ列（デフォルト）
   * what = 日付 + アクティビティ（名 / 何をしたか を縦積み・インライン編集）
   */
  detailColumn?: "tags" | "what";
  onActivityUpdated?: (activity: WorkspaceActivity) => void;
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

async function patchActivity(
  id: string,
  body: { title?: string; what_md?: string | null },
): Promise<WorkspaceActivity> {
  const res = await fetch(`/api/admin/workspace/activities/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    item?: WorkspaceActivity;
    error?: string;
  };
  if (!res.ok || !data.item) {
    throw new Error(data.error || "保存に失敗しました");
  }
  return data.item;
}

function ActivityWhatCell({
  activity,
  onActivityUpdated,
}: {
  activity: WorkspaceActivity;
  onActivityUpdated?: (activity: WorkspaceActivity) => void;
}) {
  const hasWhat = Boolean(activity.what_md?.trim());
  const [addingWhat, setAddingWhat] = useState(false);
  const showWhatEditor = hasWhat || addingWhat;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-3">
        <div className="min-w-0 flex-1">
          <ClickToEditField
            value={activity.title || ""}
            emptyLabel="（無題）"
            required
            requiredMessage="タイトルは必須です"
            ariaLabel="アクティビティ名を編集"
            displayClassName="font-medium text-foreground"
            onSave={async (next) => {
              const item = await patchActivity(activity.id, {
                title: next,
              });
              onActivityUpdated?.(item);
            }}
          />
        </div>
        {!showWhatEditor ? (
          <button
            type="button"
            className={cn(
              "hidden shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-xs text-muted-foreground",
              "underline-offset-2 hover:text-foreground hover:underline",
              "group-hover/cte:inline-flex group-focus-within/cte:inline-flex focus-visible:inline-flex",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border",
            )}
            aria-label="何をしたかを編集"
            onClick={(event) => {
              event.stopPropagation();
              setAddingWhat(true);
            }}
          >
            メモを追加
          </button>
        ) : null}
      </div>
      {showWhatEditor ? (
        <ClickToEditField
          value={activity.what_md ?? ""}
          inputType="textarea"
          emptyLabel="何をしたかを入力…"
          ariaLabel="何をしたかを編集"
          displayClassName="text-xs leading-relaxed text-muted-foreground"
          autoFocusEdit={addingWhat && !hasWhat}
          onEditEnd={() => {
            if (!activity.what_md?.trim()) setAddingWhat(false);
          }}
          onSave={async (next) => {
            const item = await patchActivity(activity.id, {
              what_md: next || null,
            });
            onActivityUpdated?.(item);
            if (!next.trim()) setAddingWhat(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function ActivitiesListTable({
  items,
  emptyMessage = "まだ Activity がありません",
  showContacts = true,
  detailColumn = "tags",
  onActivityUpdated,
}: Props) {
  const router = useRouter();
  const showWhat = detailColumn === "what";
  const colSpan = showWhat ? 2 : showContacts ? 4 : 3;

  return (
    <table
      className={
        showWhat
          ? "w-full border-collapse text-left text-sm"
          : "w-full min-w-[720px] border-collapse text-left text-sm"
      }
    >
      <thead>
        <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
          <th className="w-28 px-4 py-3 font-medium">日付</th>
          {showWhat ? (
            <th className="px-4 py-3 font-medium">アクティビティ</th>
          ) : (
            <>
              <th className="w-[28%] max-w-[14rem] px-4 py-3 font-medium">
                アクティビティ名
              </th>
              <th className="px-4 py-3 font-medium">タグ</th>
              {showContacts ? (
                <th className="px-4 py-3 font-medium">コンタクト</th>
              ) : null}
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map(({ activity, contactNames }) => {
          const cells = (
            <>
              <td className="w-28 whitespace-nowrap px-4 py-2.5 align-top text-muted-foreground">
                {/* タイトル1行目（ClickToEditField: text-sm + py-0.5）の垂直中央に合わせる */}
                <div className="flex h-7 items-center">
                  {formatActivityDate(activity.occurred_at) || "—"}
                </div>
              </td>
              {showWhat ? (
                <td className="px-4 py-2.5 align-top">
                  <ActivityWhatCell
                    activity={activity}
                    onActivityUpdated={onActivityUpdated}
                  />
                </td>
              ) : (
                <>
                  <td className="w-[28%] max-w-[14rem] px-4 py-2.5 align-top">
                    <span className="font-medium text-foreground">
                      {activity.title || "（無題）"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <ChipList values={activity.tags} />
                  </td>
                  {showContacts ? (
                    <td className="px-4 py-2.5 align-top">
                      <ChipList values={contactNames} />
                    </td>
                  ) : null}
                </>
              )}
            </>
          );

          if (showWhat) {
            return (
              <tr key={activity.id} className="group/cte hover:bg-muted/30">
                {cells}
              </tr>
            );
          }

          return (
            <AdminClickableRow
              key={activity.id}
              className="hover:bg-muted/30"
              onActivate={() =>
                router.push(`/admin/workspace/activities/${activity.id}/`)
              }
            >
              {cells}
            </AdminClickableRow>
          );
        })}
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
