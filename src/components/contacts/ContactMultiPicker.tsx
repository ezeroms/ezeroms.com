"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import {
  compareContactsByKana,
  contactListNameWithNickname,
  contactSortKey,
  type WorkspaceContact,
} from "@/types/contacts";

type Props = {
  contacts: WorkspaceContact[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  loading?: boolean;
};

function matchesQuery(contact: WorkspaceContact, q: string): boolean {
  const hay = [
    contact.family_name,
    contact.given_name,
    contact.middle_name,
    contact.family_name_kana,
    contact.given_name_kana,
    contact.middle_name_kana,
    contact.family_name_en,
    contact.given_name_en,
    contact.english_name,
    contact.nickname,
    ...contact.tags,
    contactSortKey(contact),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function ContactMultiPicker({
  contacts,
  selectedIds,
  onChange,
  disabled = false,
  loading = false,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () =>
      contacts
        .filter((c) => selectedIds.has(c.id) && !c.deleted_at)
        .sort(compareContactsByKana),
    [contacts, selectedIds],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => !c.deleted_at && !selectedIds.has(c.id))
      .filter((c) => !q || matchesQuery(c, q))
      .sort(compareContactsByKana)
      .slice(0, 40);
  }, [contacts, selectedIds, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open, candidates.length]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function addContact(id: string) {
    if (disabled || selectedIds.has(id)) return;
    const next = new Set(selectedIds);
    next.add(id);
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  function removeContact(id: string) {
    if (disabled) return;
    const next = new Set(selectedIds);
    next.delete(id);
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || candidates.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = candidates[highlight];
      if (pick) addContact(pick.id);
    }
  }

  if (loading) {
    return <p className="m-0 text-xs text-muted-foreground">読み込み中…</p>;
  }

  if (contacts.length === 0) {
    return (
      <p className="m-0 text-xs text-muted-foreground">
        まだコンタクトがいません。Contacts で追加できます。
      </p>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div className="relative">
        <Input
          value={query}
          disabled={disabled}
          placeholder="コンタクトを検索して追加…"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {open && !disabled ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 m-0 mt-1 max-h-48 w-full list-none overflow-y-auto rounded-md border border-border bg-card p-0 shadow-sm"
          >
            {candidates.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                該当なし
              </li>
            ) : (
              candidates.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    className={
                      i === highlight
                        ? "flex w-full cursor-pointer appearance-none items-baseline justify-between gap-2 border-0 bg-muted px-3 py-2 text-left text-sm"
                        : "flex w-full cursor-pointer appearance-none items-baseline justify-between gap-2 border-0 bg-transparent px-3 py-2 text-left text-sm hover:bg-muted/60"
                    }
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => addContact(c.id)}
                  >
                    <span className="font-medium text-foreground">
                      {contactListNameWithNickname(c)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {[c.family_name_kana, c.given_name_kana]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">名前</th>
              <th className="w-28 px-3 py-2 font-medium">読み</th>
              <th className="w-10 px-2 py-2 font-medium">
                <span className="sr-only">削除</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {selected.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-3 py-2 align-middle font-medium text-foreground">
                  {contactListNameWithNickname(c)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground">
                  {[c.family_name_kana, c.given_name_kana]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </td>
                <td className="px-2 py-2 align-middle text-right">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`${contactListNameWithNickname(c)} を外す`}
                    className="inline-flex size-7 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    onClick={() => removeContact(c.id)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {selected.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  まだ追加されていません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
