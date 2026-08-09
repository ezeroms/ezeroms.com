"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import {
  birthdayToInputParts,
  formatContactBirthday,
  inputPartsToBirthday,
  type BirthdayInputParts,
} from "@/types/contacts";

const partInputClassName =
  "cte-input h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0";

type PartsFieldsProps = {
  idPrefix: string;
  parts: BirthdayInputParts;
  onChange: (next: BirthdayInputParts) => void;
  disabled?: boolean;
  /** 枠つき（通常フォーム） / フラット（クリック編集） */
  variant?: "boxed" | "bare";
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
};

/** 年（任意）/ 月 / 日 */
export function BirthdayPartsFields({
  idPrefix,
  parts,
  onChange,
  disabled,
  variant = "boxed",
  onBlur,
  onKeyDown,
  autoFocus,
}: PartsFieldsProps) {
  const bare = variant === "bare";
  const fieldClass = bare
    ? partInputClassName
    : undefined;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <Input
        id={`${idPrefix}-year`}
        type="text"
        inputMode="numeric"
        {...ignorePasswordManagersProps}
        // 誕生日部品はブラウザの bday-* を優先（パスワードマネージャ用 off を上書き）
        autoComplete="bday-year"
        placeholder="年"
        aria-label="生年（任意・空欄なら年不明）"
        value={parts.year}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(fieldClass, bare ? "w-16" : "w-[4.5rem]")}
        onChange={(e) =>
          onChange({ ...parts, year: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <span className="text-muted-foreground">/</span>
      <Input
        id={`${idPrefix}-month`}
        type="text"
        inputMode="numeric"
        {...ignorePasswordManagersProps}
        autoComplete="bday-month"
        placeholder="月"
        aria-label="誕生月"
        value={parts.month}
        disabled={disabled}
        className={cn(fieldClass, bare ? "w-10" : "w-14")}
        onChange={(e) =>
          onChange({ ...parts, month: e.target.value.replace(/[^\d]/g, "").slice(0, 2) })
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <span className="text-muted-foreground">/</span>
      <Input
        id={`${idPrefix}-day`}
        type="text"
        inputMode="numeric"
        {...ignorePasswordManagersProps}
        autoComplete="bday-day"
        placeholder="日"
        aria-label="誕生日"
        value={parts.day}
        disabled={disabled}
        className={cn(fieldClass, bare ? "w-10" : "w-14")}
        onChange={(e) =>
          onChange({ ...parts, day: e.target.value.replace(/[^\d]/g, "").slice(0, 2) })
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

type ClickToEditProps = {
  birthday: string;
  yearKnown: boolean;
  disabled?: boolean;
  onSave: (next: {
    birthday: string | null;
    birthday_year_known: boolean;
  }) => Promise<void>;
};

/**
 * 閲覧表示 → クリックで 年/月/日 編集。
 * 年空欄 = 年不明。
 */
export function ClickToEditBirthday({
  birthday,
  yearKnown,
  disabled,
  onSave,
}: ClickToEditProps) {
  const initial = birthdayToInputParts(birthday || null, yearKnown);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skipBlurCommit = useRef(false);

  useEffect(() => {
    if (!editing) {
      setDraft(birthdayToInputParts(birthday || null, yearKnown));
    }
  }, [birthday, yearKnown, editing]);

  async function commit() {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false;
      return;
    }
    const serialized = inputPartsToBirthday(draft);
    if (serialized.error) {
      setError(serialized.error);
      return;
    }
    setError(null);

    const current = inputPartsToBirthday(
      birthdayToInputParts(birthday || null, yearKnown),
    );
    if (
      serialized.birthday === current.birthday &&
      serialized.birthday_year_known === current.birthday_year_known
    ) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        birthday: serialized.birthday,
        birthday_year_known: serialized.birthday_year_known,
      });
      setEditing(false);
    } catch (err) {
      setDraft(birthdayToInputParts(birthday || null, yearKnown));
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    skipBlurCommit.current = true;
    setDraft(birthdayToInputParts(birthday || null, yearKnown));
    setError(null);
    setEditing(false);
  }

  function onRootBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef.current?.contains(next)) return;
    void commit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      void commit();
    }
  }

  function startEditing(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (disabled) return;
    setEditing(true);
  }

  const display = formatContactBirthday({
    birthday: birthday || null,
    birthday_year_known: yearKnown,
  });

  if (editing) {
    return (
      <div
        ref={rootRef}
        className="flex flex-col gap-1"
        onBlur={onRootBlur}
        onClick={(e) => e.stopPropagation()}
      >
        <BirthdayPartsFields
          idPrefix="cte-birthday"
          parts={draft}
          onChange={setDraft}
          disabled={saving || disabled}
          variant="bare"
          onKeyDown={onKeyDown}
          autoFocus
        />
        {error ? (
          <p className="m-0 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled}
        aria-label="誕生日"
        className={cn(
          "relative w-full min-w-0 border-0 bg-transparent px-0 py-0.5 text-left text-sm leading-normal",
          "before:pointer-events-none before:absolute before:-inset-x-1.5 before:-inset-y-0.5 before:rounded-sm before:bg-muted/40 before:opacity-0 before:transition-opacity before:content-['']",
          "hover:before:opacity-100 focus-visible:before:opacity-100",
          "disabled:cursor-not-allowed disabled:opacity-60",
          display ? "text-foreground" : "text-muted-foreground",
        )}
        onClick={startEditing}
      >
        <span className="relative z-[1]">{display || "未設定"}</span>
      </button>
      {error ? (
        <p className="m-0 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
