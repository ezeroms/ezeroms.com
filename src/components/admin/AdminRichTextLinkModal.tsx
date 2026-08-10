"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";

type Props = {
  open: boolean;
  initialHref: string;
  onClose: () => void;
  onApply: (href: string) => void;
  onRemove: () => void;
};

function normalizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * リッチテキスト用のリンク挿入／編集モーダル（window.prompt の代替）。
 */
export function AdminRichTextLinkModal({
  open,
  initialHref,
  onClose,
  onApply,
  onRemove,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const initialHrefRef = useRef(initialHref);
  initialHrefRef.current = initialHref;
  const [href, setHref] = useState(initialHref);
  const hasExisting = Boolean(initialHref.trim());

  useEffect(() => {
    if (!open) return;
    setHref(initialHrefRef.current || "https://");
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  function submit() {
    const next = normalizeHref(href);
    if (!next) {
      onRemove();
      return;
    }
    onApply(next);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default appearance-none border-0 bg-transparent p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-lg border-0 bg-card font-sans text-foreground shadow-none"
        {...ignorePasswordManagersProps}
      >
        <div className="shrink-0 border-0 border-b border-solid border-border px-5 py-4">
          <h2 id={titleId} className="m-0 text-base font-semibold tracking-tight">
            {hasExisting ? "リンクを編集" : "リンクを挿入"}
          </h2>
        </div>

        <form
          className="flex flex-col gap-4 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          {...ignorePasswordManagersProps}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-rte-link-url">URL</Label>
            <Input
              ref={inputRef}
              id="admin-rte-link-url"
              type="text"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://example.com"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              {...ignorePasswordManagersProps}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              {hasExisting ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onRemove}
                >
                  リンクを解除
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">{hasExisting ? "更新" : "挿入"}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.querySelector(".admin-app") ??
      document.querySelector(".admin-root") ??
      document.body,
  );
}
