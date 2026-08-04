"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { ContactEditModal } from "@/components/contacts/ContactEditModal";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";
import {
  compareContactsByKana,
  formatContactBirthday,
  formatLastActivityAt,
  contactBirthdayDay,
  contactBirthdayMonth,
  contactListNameWithNickname,
  contactSectionLabel,
  monthSectionLabel,
  type WorkspaceContact,
} from "@/types/contacts";

export type ContactsTableItem = {
  contact: WorkspaceContact;
  /** 紐づく最新 Activity の occurred_at。UI 列名は「最後の記録」。 */
  lastActivityAt: string | null;
  lastActivityTitle: string | null;
  currentCompany?: string | null;
};

type Props = {
  items: ContactsTableItem[];
  emptyMessage?: string;
  /** Show company column (Contacts list). */
  showCompany?: boolean;
  /** Show tags column (Contacts list). */
  showTags?: boolean;
  /** Show birthday column (Friends list). */
  showBirthday?: boolean;
  /** Show last activity date/title columns (Friends list). */
  showLastActivity?: boolean;
};

type SortKey = "name" | "lastActivity" | "birthday";
type SortDir = "asc" | "desc";

type Section = {
  label: string | null;
  items: ContactsTableItem[];
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
  a: ContactsTableItem,
  b: ContactsTableItem,
  sortKey: SortKey,
  sortDir: SortDir,
): number {
  if (sortKey === "name") {
    const byName = compareContactsByKana(a.contact, b.contact);
    return sortDir === "asc" ? byName : -byName;
  }

  if (sortKey === "birthday") {
    const byMonth = compareNullableNumber(
      contactBirthdayMonth(a.contact),
      contactBirthdayMonth(b.contact),
      sortDir,
    );
    if (byMonth !== 0) return byMonth;
    const byDay = compareNullableNumber(
      contactBirthdayDay(a.contact),
      contactBirthdayDay(b.contact),
      sortDir,
    );
    if (byDay !== 0) return byDay;
    return compareContactsByKana(a.contact, b.contact);
  }

  // 最終アクティビティ日 — 時系列ソートのみ（セクション見出しなし）
  const aMissing = a.lastActivityAt == null;
  const bMissing = b.lastActivityAt == null;
  if (aMissing && bMissing) return compareContactsByKana(a.contact, b.contact);
  if (aMissing) return 1;
  if (bMissing) return -1;
  const byTime =
    activityTime(a.lastActivityAt) - activityTime(b.lastActivityAt);
  if (byTime !== 0) return sortDir === "asc" ? byTime : -byTime;
  return compareContactsByKana(a.contact, b.contact);
}

function sectionLabelFor(
  item: ContactsTableItem,
  sortKey: SortKey,
): string | null {
  if (sortKey === "name") return contactSectionLabel(item.contact);
  if (sortKey === "birthday") {
    return monthSectionLabel(contactBirthdayMonth(item.contact));
  }
  return null;
}

function groupBySection(
  items: ContactsTableItem[],
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

export function ContactsListTable({
  items,
  emptyMessage = "まだコンタクトがありません",
  showCompany = false,
  showTags = false,
  showBirthday = true,
  showLastActivity = true,
}: Props) {
  const now = new Date();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const colSpan =
    1 +
    (showCompany ? 1 : 0) +
    (showTags ? 1 : 0) +
    (showLastActivity ? 2 : 0) +
    (showBirthday ? 1 : 0);

  const sections = useMemo(() => {
    let effectiveSort = sortKey;
    if (sortKey === "birthday" && !showBirthday) effectiveSort = "name";
    if (sortKey === "lastActivity" && !showLastActivity) effectiveSort = "name";
    const sorted = [...items].sort((a, b) =>
      compareItems(a, b, effectiveSort, sortDir),
    );
    return groupBySection(sorted, effectiveSort);
  }, [items, sortKey, sortDir, showBirthday, showLastActivity]);

  function toggleSort(next: SortKey) {
    if (next === "birthday" && !showBirthday) return;
    if (next === "lastActivity" && !showLastActivity) return;
    if (sortKey === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir("asc");
  }

  return (
    <>
    <table className="w-full min-w-[480px] border-collapse text-left text-sm">
      <thead>
        <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
          <SortHeader
            label="名前"
            active={sortKey === "name"}
            dir={sortDir}
            className="w-[1%] pl-4 pr-2"
            onClick={() => toggleSort("name")}
          />
          {showCompany ? (
            <th className="min-w-[12rem] w-[28%] px-4 py-3 font-medium">
              会社
            </th>
          ) : null}
          {showTags ? (
            <th className="w-full px-4 py-3 font-medium">タグ</th>
          ) : null}
          {showLastActivity ? (
            <>
              <SortHeader
                label="最後の記録"
                active={sortKey === "lastActivity"}
                dir={sortDir}
                className="w-[1%] px-4"
                onClick={() => toggleSort("lastActivity")}
              />
              <th
                className={
                  showTags
                    ? "w-[1%] px-4 py-3 font-medium"
                    : "w-full px-4 py-3 font-medium"
                }
              >
                最後のアクティビティ
              </th>
            </>
          ) : null}
          {showBirthday ? (
            <SortHeader
              label="誕生日"
              active={sortKey === "birthday"}
              dir={sortDir}
              className="w-[1%] px-4"
              onClick={() => toggleSort("birthday")}
            />
          ) : null}
        </tr>
      </thead>
      <tbody>
        {sections.map((section, sectionIndex) => (
          <Fragment key={`${sortKey}:${section.label ?? "flat"}:${sectionIndex}`}>
            {section.label ? (
              <tr>
                <th
                  colSpan={colSpan}
                  scope="colgroup"
                  className="px-4 pb-2 pt-5 text-left text-xs font-semibold tracking-wide text-muted-foreground"
                >
                  {section.label}
                </th>
              </tr>
            ) : null}
            {section.items.map(
              ({
                contact,
                lastActivityAt,
                lastActivityTitle,
                currentCompany,
              }) => (
                <AdminClickableRow
                  key={contact.id}
                  className="hover:bg-muted/30"
                  onActivate={() => setEditContactId(contact.id)}
                >
                  <td className="w-[1%] whitespace-nowrap py-2.5 pl-4 pr-2 align-middle">
                    <span className="font-medium text-foreground">
                      {contactListNameWithNickname(contact)}
                    </span>
                  </td>
                  {showCompany ? (
                    <td className="min-w-[12rem] w-[28%] max-w-[20rem] truncate px-4 py-2.5 align-middle text-muted-foreground">
                      {currentCompany || ""}
                    </td>
                  ) : null}
                  {showTags ? (
                    <td className="w-full px-4 py-2.5 align-middle">
                      {contact.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.map((tag) => (
                            <span key={tag} className={tagChipClass(false)}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground" />
                      )}
                    </td>
                  ) : null}
                  {showLastActivity ? (
                    <>
                      <td className="w-[1%] whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                        {formatLastActivityAt(lastActivityAt, now) || ""}
                      </td>
                      <td
                        className={
                          showTags
                            ? "w-[1%] max-w-[14rem] truncate px-4 py-2.5 align-middle text-muted-foreground"
                            : "w-full max-w-0 truncate px-4 py-2.5 align-middle text-muted-foreground"
                        }
                      >
                        {lastActivityTitle || ""}
                      </td>
                    </>
                  ) : null}
                  {showBirthday ? (
                    <td className="w-[1%] whitespace-nowrap px-4 py-2.5 align-middle text-muted-foreground">
                      {formatContactBirthday(contact, now) || "—"}
                    </td>
                  ) : null}
                </AdminClickableRow>
              ),
            )}
          </Fragment>
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
    <ContactEditModal
      open={Boolean(editContactId)}
      contactId={editContactId}
      onClose={() => setEditContactId(null)}
    />
    </>
  );
}
