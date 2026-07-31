"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { cn } from "@/lib/cn";
import {
  compareFriendsByKana,
  formatFriendBirthday,
  formatLastActivityAt,
  friendBirthdayDay,
  friendBirthdayMonth,
  friendListNameWithNickname,
  friendSectionLabel,
  monthSectionLabel,
  type WorkspaceFriend,
} from "@/types/friends";

export type FriendsTableItem = {
  friend: WorkspaceFriend;
  /** 紐づく最新 Activity の occurred_at。UI 列名は「最後に遊んだ日」。 */
  lastActivityAt: string | null;
  lastActivityTitle: string | null;
};

type Props = {
  items: FriendsTableItem[];
};

type SortKey = "name" | "lastActivity" | "birthday";
type SortDir = "asc" | "desc";

type Section = {
  label: string | null;
  items: FriendsTableItem[];
};

function activityTime(iso: string | null): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  dir: SortDir,
): number {
  const aMissing = a == null;
  const bMissing = b == null;
  if (aMissing && bMissing) return 0;
  // Missing values always sink to the end, regardless of direction.
  if (aMissing) return 1;
  if (bMissing) return -1;
  const diff = a - b;
  return dir === "asc" ? diff : -diff;
}

function compareItems(
  a: FriendsTableItem,
  b: FriendsTableItem,
  sortKey: SortKey,
  sortDir: SortDir,
): number {
  if (sortKey === "name") {
    const byName = compareFriendsByKana(a.friend, b.friend);
    return sortDir === "asc" ? byName : -byName;
  }

  if (sortKey === "birthday") {
    const byMonth = compareNullableNumber(
      friendBirthdayMonth(a.friend),
      friendBirthdayMonth(b.friend),
      sortDir,
    );
    if (byMonth !== 0) return byMonth;
    const byDay = compareNullableNumber(
      friendBirthdayDay(a.friend),
      friendBirthdayDay(b.friend),
      sortDir,
    );
    if (byDay !== 0) return byDay;
    return compareFriendsByKana(a.friend, b.friend);
  }

  // 最終アクティビティ日 — 時系列ソートのみ（セクション見出しなし）
  const aMissing = a.lastActivityAt == null;
  const bMissing = b.lastActivityAt == null;
  if (aMissing && bMissing) return compareFriendsByKana(a.friend, b.friend);
  if (aMissing) return 1;
  if (bMissing) return -1;
  const byTime =
    activityTime(a.lastActivityAt) - activityTime(b.lastActivityAt);
  if (byTime !== 0) return sortDir === "asc" ? byTime : -byTime;
  return compareFriendsByKana(a.friend, b.friend);
}

function sectionLabelFor(
  item: FriendsTableItem,
  sortKey: SortKey,
): string | null {
  if (sortKey === "name") return friendSectionLabel(item.friend);
  if (sortKey === "birthday") {
    return monthSectionLabel(friendBirthdayMonth(item.friend));
  }
  return null;
}

function groupBySection(
  items: FriendsTableItem[],
  sortKey: SortKey,
): Section[] {
  if (sortKey === "lastActivity") {
    return [{ label: null, items }];
  }

  const sections: Section[] = [];
  for (const item of items) {
    const label = sectionLabelFor(item, sortKey);
    const last = sections[sections.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
}

function SortHeader({
  label,
  active,
  dir,
  className,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  className?: string;
  onClick: () => void;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap py-3 text-left font-medium",
        className,
      )}
      aria-sort={
        active ? (dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/sort inline-flex items-center gap-1 border-0 bg-transparent p-0 font-medium text-muted-foreground transition-colors hover:text-foreground",
          active && "text-foreground",
        )}
      >
        <span>{label}</span>
        {active ? (
          dir === "asc" ? (
            <ArrowUp
              className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/sort:text-foreground"
              aria-hidden
            />
          ) : (
            <ArrowDown
              className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/sort:text-foreground"
              aria-hidden
            />
          )
        ) : null}
      </button>
    </th>
  );
}

export function FriendsListTable({ items }: Props) {
  const router = useRouter();
  const now = new Date();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sections = useMemo(() => {
    const sorted = [...items].sort((a, b) =>
      compareItems(a, b, sortKey, sortDir),
    );
    return groupBySection(sorted, sortKey);
  }, [items, sortKey, sortDir]);

  function toggleSort(next: SortKey) {
    if (sortKey === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir("asc");
  }

  return (
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
          <SortHeader
            label="名前"
            active={sortKey === "name"}
            dir={sortDir}
            className="w-[1%] pl-4 pr-2"
            onClick={() => toggleSort("name")}
          />
          <SortHeader
            label="最後に遊んだ日"
            active={sortKey === "lastActivity"}
            dir={sortDir}
            className="w-[1%] px-4"
            onClick={() => toggleSort("lastActivity")}
          />
          <th className="w-full px-4 py-3 font-medium">最後のアクティビティ</th>
          <SortHeader
            label="誕生日"
            active={sortKey === "birthday"}
            dir={sortDir}
            className="w-[1%] px-4"
            onClick={() => toggleSort("birthday")}
          />
        </tr>
      </thead>
      <tbody>
        {sections.map((section, sectionIndex) => (
          <Fragment key={`${sortKey}:${section.label ?? "flat"}:${sectionIndex}`}>
            {section.label ? (
              <tr>
                <th
                  colSpan={4}
                  scope="colgroup"
                  className="px-4 pb-2 pt-5 text-left text-xs font-semibold tracking-wide text-muted-foreground"
                >
                  {section.label}
                </th>
              </tr>
            ) : null}
            {section.items.map(
              ({ friend, lastActivityAt, lastActivityTitle }) => (
                <AdminClickableRow
                  key={friend.id}
                  className="hover:bg-muted/30"
                  onActivate={() =>
                    router.push(`/admin/workspace/friends/${friend.id}/`)
                  }
                >
                  <td className="w-[1%] whitespace-nowrap py-2.5 pl-4 pr-2 align-middle">
                    <span className="font-medium text-foreground">
                      {friendListNameWithNickname(friend)}
                    </span>
                  </td>
                  <td className="w-[1%] whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                    {formatLastActivityAt(lastActivityAt, now) || ""}
                  </td>
                  <td className="w-full max-w-0 truncate px-4 py-2.5 align-middle text-muted-foreground">
                    {lastActivityTitle || ""}
                  </td>
                  <td className="w-[1%] whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                    {formatFriendBirthday(friend, now) || "—"}
                  </td>
                </AdminClickableRow>
              ),
            )}
          </Fragment>
        ))}
        {items.length === 0 ? (
          <tr>
            <td
              colSpan={4}
              className="px-4 py-10 text-center text-muted-foreground"
            >
              まだ友達がいません
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
