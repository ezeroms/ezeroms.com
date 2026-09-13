"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
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
    contact.former_family_name,
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

function contactKana(contact: WorkspaceContact): string {
  return [contact.family_name_kana, contact.given_name_kana]
    .filter(Boolean)
    .join(" ");
}

function contactInitials(contact: WorkspaceContact): string {
  const family = contact.family_name?.trim();
  const given = contact.given_name?.trim();
  if (family && given) return `${family.charAt(0)}${given.charAt(0)}`;
  const name = contactListNameWithNickname(contact);
  return name.replace(/[（）()]/g, "").slice(0, 2) || "?";
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    setOpen(true);
    inputRef.current?.focus();
  }

  function removeContact(id: string) {
    if (disabled) return;
    const next = new Set(selectedIds);
    next.delete(id);
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // 親フォームの送信も、先頭候補の確定もしない。追加はクリックのみ。
      e.preventDefault();
      if (!open) setOpen(true);
      return;
    }
    if (!open && e.key === "ArrowDown") {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (
      e.key === "Backspace" &&
      query === "" &&
      selected.length > 0
    ) {
      e.preventDefault();
      removeContact(selected[selected.length - 1].id);
      return;
    }
    if (!open || candidates.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    }
  }

  if (loading) {
    return <p className="m-0 text-sm text-muted-foreground">読み込み中…</p>;
  }

  if (contacts.length === 0) {
    return (
      <p className="m-0 text-sm text-muted-foreground">
        まだコンタクトがいません。{" "}
        <Link
          href="/admin/workspace/contacts/"
          className="underline-offset-2 hover:underline"
        >
          Contacts
        </Link>{" "}
        で追加してください。
      </p>
    );
  }

  const activeDescendant =
    open && candidates[highlight]
      ? `${listId}-opt-${candidates[highlight].id}`
      : undefined;

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          disabled={disabled}
          placeholder="名前・読みで検索して追加"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          className="pl-9"
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
            className="relative z-20 m-0 mt-1.5 max-h-56 w-full list-none overflow-y-auto rounded-lg border border-border bg-card p-1"
          >
            {candidates.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">
                {query.trim()
                  ? "該当する人がいません"
                  : "追加できる人はいません"}
              </li>
            ) : (
              candidates.map((c, i) => {
                const kana = contactKana(c);
                const highlighted = i === highlight;
                return (
                  <li
                    key={c.id}
                    id={`${listId}-opt-${c.id}`}
                    role="option"
                    aria-selected={highlighted}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full cursor-pointer appearance-none items-center gap-2.5 rounded-md border-0 px-2 py-1.5 text-left",
                        highlighted ? "bg-muted" : "bg-transparent hover:bg-muted/60",
                      )}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => addContact(c.id)}
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground"
                        aria-hidden
                      >
                        {contactInitials(c)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {contactListNameWithNickname(c)}
                        </span>
                        {kana ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {kana}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {selected.map((c) => {
            const kana = contactKana(c);
            const label = contactListNameWithNickname(c);
            return (
              <li
                key={c.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-1.5"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground"
                  aria-hidden
                >
                  {contactInitials(c)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {label}
                  </span>
                  {kana ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {kana}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${label} を外す`}
                  className="inline-flex size-7 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  onClick={() => removeContact(c.id)}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-xs text-muted-foreground">
          まだ誰も追加していません
        </p>
      )}
    </div>
  );
}
