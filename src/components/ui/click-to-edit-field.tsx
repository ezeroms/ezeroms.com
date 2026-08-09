"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";

export type ClickToEditFieldProps = {
  value: string;
  onSave: (next: string) => Promise<void>;
  /** text (default) | date | textarea */
  inputType?: "text" | "date" | "textarea";
  emptyLabel?: string;
  /** Display when empty / as hint. Defaults to emptyLabel. */
  placeholder?: string;
  displayClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  /** Reject empty after trim (single-line only). */
  required?: boolean;
  requiredMessage?: string;
  ariaLabel?: string;
  /** Customize read-mode rendering of a non-empty value. */
  formatDisplay?: (value: string) => ReactNode;
  /**
   * 空のときの表示。
   * - placeholder: 常に emptyLabel を表示（デフォルト）
   * - hover-add: 通常は非表示。親の `group/cte` ホバー時に追加導線を表示
   */
  emptyDisplay?: "placeholder" | "hover-add";
  /** emptyDisplay="hover-add" のときの導線ラベル */
  emptyAddLabel?: string;
  /** true のときマウント／変化で編集開始 */
  autoFocusEdit?: boolean;
  /** 編集終了時（保存・キャンセル問わず） */
  onEditEnd?: () => void;
};

/**
 * テキストは左右 padding なしでラベルと揃える。
 * ホバー背景は ::before で外側にだけ広げる。
 */
const shellClassName =
  "relative w-full min-w-0 border-0 bg-transparent px-0 py-0.5 text-left text-sm leading-normal";

const hoverHitClassName = cn(
  "before:pointer-events-none before:absolute before:-inset-x-1.5 before:-inset-y-0.5 before:rounded-sm before:bg-muted/40 before:opacity-0 before:transition-opacity before:content-['']",
  "hover:before:opacity-100 focus-visible:before:opacity-100",
);

/**
 * 閲覧表示 → クリックで入力 → フォーカス外れで保存。
 * 編集UIはフォーム枠ではなく、表示テキストに近いフラットな見た目にする。
 */
export function ClickToEditField({
  value,
  onSave,
  inputType = "text",
  emptyLabel = "未設定",
  placeholder,
  displayClassName,
  inputClassName,
  disabled,
  required = false,
  requiredMessage = "入力が必要です",
  ariaLabel,
  formatDisplay,
  emptyDisplay = "placeholder",
  emptyAddLabel = "追加",
  autoFocusEdit = false,
  onEditEnd,
}: ClickToEditFieldProps) {
  const multiline = inputType === "textarea";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const skipBlurCommit = useRef(false);
  const onEditEndRef = useRef(onEditEnd);
  onEditEndRef.current = onEditEnd;

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (autoFocusEdit) setEditing(true);
  }, [autoFocusEdit]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    // date は setSelectionRange 非対応のブラウザがある
    if (inputType === "date") return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editing, inputType]);

  // textarea: 折り返し行も含めて全文が見える高さに合わせる
  useEffect(() => {
    if (!editing || !multiline) return;
    const el = inputRef.current;
    if (!(el instanceof HTMLTextAreaElement)) return;
    const syncHeight = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    syncHeight();
    const id = requestAnimationFrame(syncHeight);
    return () => cancelAnimationFrame(id);
  }, [editing, multiline, draft]);

  function endEditing() {
    setEditing(false);
    onEditEndRef.current?.();
  }

  async function commit() {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false;
      return;
    }
    const next = multiline ? draft : draft.trim();
    setError(null);

    const comparableCurrent = multiline ? value : value.trim();
    if (next === comparableCurrent) {
      setDraft(value);
      endEditing();
      return;
    }
    if (required && !multiline && !next) {
      setDraft(value);
      setError(requiredMessage);
      endEditing();
      return;
    }

    setSaving(true);
    try {
      await onSave(next);
      endEditing();
    } catch (err) {
      setDraft(value);
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      endEditing();
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    skipBlurCommit.current = true;
    setDraft(value);
    setError(null);
    endEditing();
  }

  function onKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  function startEditing(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setEditing(true);
  }

  if (editing) {
    const editClassName = cn(
      "cte-input",
      shellClassName,
      "z-0 m-0 block appearance-none text-foreground shadow-none outline-none",
      "placeholder:text-muted-foreground",
      "caret-foreground",
      "disabled:cursor-wait disabled:opacity-60",
      multiline && "resize-none whitespace-pre-wrap break-words leading-relaxed",
      displayClassName,
      inputClassName,
    );

    return (
      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            ref={inputRef as RefObject<HTMLTextAreaElement>}
            value={draft}
            disabled={saving || disabled}
            rows={1}
            placeholder={placeholder ?? emptyLabel}
            className={cn(editClassName, "overflow-hidden")}
            aria-label={ariaLabel}
            {...ignorePasswordManagersProps}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={onKeyDown}
          />
        ) : (
          <input
            ref={inputRef as RefObject<HTMLInputElement>}
            type={inputType === "date" ? "date" : "text"}
            value={draft}
            disabled={saving || disabled}
            placeholder={placeholder ?? emptyLabel}
            className={editClassName}
            aria-label={ariaLabel}
            {...ignorePasswordManagersProps}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={onKeyDown}
          />
        )}
        {error ? (
          <p className="m-0 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const showEmpty = !value.trim();

  if (showEmpty && emptyDisplay === "hover-add") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={disabled || saving}
          className={cn(
            "mt-0.5 hidden w-fit cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-xs text-muted-foreground",
            "underline-offset-2 hover:text-foreground hover:underline",
            "group-hover/cte:inline-flex group-focus-within/cte:inline-flex focus-visible:inline-flex",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border",
            "disabled:cursor-wait disabled:opacity-60",
          )}
          aria-label={ariaLabel ?? emptyAddLabel}
          onClick={startEditing}
        >
          {emptyAddLabel}
        </button>
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
        disabled={disabled || saving}
        className={cn(
          shellClassName,
          hoverHitClassName,
          "z-0 cursor-text appearance-none focus-visible:outline-none",
          "disabled:cursor-wait disabled:opacity-60",
          displayClassName,
          showEmpty && "text-muted-foreground",
          multiline && "whitespace-pre-wrap break-words leading-relaxed",
        )}
        aria-label={ariaLabel ?? "編集"}
        onClick={startEditing}
      >
        <span className="relative z-[1]">
          {showEmpty ? (
            emptyLabel
          ) : formatDisplay ? (
            formatDisplay(value)
          ) : (
            value
          )}
        </span>
      </button>
      {error ? (
        <p className="m-0 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** 閲覧用のラベル＋値の1行（クリック編集フィールドのラッパー） */
export function ClickToEditRow({
  label,
  children,
  className,
  /**
   * start: 複数行の先頭にラベルを合わせる（メモ・作業枠など）
   * center: 1行の入力／選択と縦中央揃え（状態・期限など）
   */
  align = "start",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "grid gap-1 sm:grid-cols-[7.5rem_1fr] sm:gap-3",
        align === "center" ? "sm:items-center" : "sm:items-start",
        className,
      )}
    >
      <div
        className={cn(
          "text-xs font-medium leading-5 text-muted-foreground",
          // start 時は text-sm 行の先頭付近に合わせる（center 時は items-center に任せる）
          align === "start" && "pt-1",
        )}
      >
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** ラベル上・値下のブロック（Friends 情報タブと同型） */
export function ClickToEditFieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
