"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Copy, RefreshCw, Settings, X } from "lucide-react";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { filterFieldClass } from "@/lib/site/tag-styles";
import {
  AGE_DECADES,
  DEFAULT_AGE_DECADES,
  DEFAULT_EMAIL_DOMAIN,
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_PASSWORD_SYMBOLS,
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  PASSWORD_SYMBOLS,
  clampPasswordLength,
  emailWithDomain,
  enFull,
  generateAccount,
  jaKana,
  jaKanji,
  normalizeEmailDomain,
  randomBirthday,
  randomEmail,
  randomEnName,
  randomJaName,
  randomPassword,
  type AgeDecade,
  type Birthday,
  type EnName,
  type GeneratedAccount,
  type JaName,
} from "@/lib/tools/id-gen/generate";

const COPY_FEEDBACK_MS = 1600;
const EMAIL_DOMAIN_STORAGE_KEY = "ezeroms.id-gen.email-domain";

function readStoredEmailDomain(): string | null {
  try {
    const saved = localStorage.getItem(EMAIL_DOMAIN_STORAGE_KEY);
    return saved ? normalizeEmailDomain(saved) : null;
  } catch {
    return null;
  }
}

function writeStoredEmailDomain(domain: string) {
  try {
    localStorage.setItem(EMAIL_DOMAIN_STORAGE_KEY, domain);
  } catch {
    // Storage can be unavailable in private browsing. The field still works.
  }
}

function ActionGlyph({
  icon: Icon,
}: {
  icon: typeof RefreshCw;
}) {
  return <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden
    />
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="m-0 mb-3 mt-14 text-[1.25rem] font-semibold leading-[1.5] tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SecretValue({
  text,
  label,
  onCopy,
}: {
  text: string | null;
  label: string;
  onCopy: () => void;
}) {
  if (!text) return <Skeleton className="h-10 w-full" />;
  return (
    <button
      type="button"
      className={cn(
        copySurfaceClass,
        "-mx-2 -my-1 w-fit max-w-full rounded-md px-2 py-1 break-all font-mono text-[0.9375rem] leading-relaxed",
      )}
      aria-label={label}
      onClick={onCopy}
    >
      {text}
    </button>
  );
}

type CopyPart = {
  key: string;
  label: string;
  text: string;
};

function CopyControl({
  copyKey,
  copyText,
  copyLabel,
  parts,
  copiedKey,
  disabled,
  onCopy,
}: {
  copyKey: string;
  copyText: string | null;
  copyLabel: string;
  parts?: CopyPart[];
  copiedKey: string | null;
  disabled?: boolean;
  onCopy: (key: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const available = (parts ?? []).filter((part) => part.text);
  const split = parts != null;
  const copied =
    copiedKey === copyKey || available.some((part) => part.key === copiedKey);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const copyButton = (
    <Button
      type="button"
      size="sm"
      disabled={disabled || !copyText}
      className={split ? "peer rounded-l-md rounded-r-none border-r-0" : undefined}
      aria-label={copied ? "Copied" : copyLabel}
      aria-live="polite"
      onClick={() => {
        if (copyText) onCopy(copyKey, copyText);
      }}
    >
      <ActionGlyph icon={copied ? Check : Copy} />
      {copied ? "Copied" : "Copy"}
    </Button>
  );

  if (!split) return copyButton;

  return (
    <div ref={rootRef} className={cn("relative inline-flex", open && "z-20")}>
      {copyButton}
      <Button
        type="button"
        size="sm"
        disabled={disabled || available.length === 0}
        className="rounded-l-none rounded-r-md px-2 peer-hover:border-border-hover"
        aria-label="Copy a part"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const rect = rootRef.current?.getBoundingClientRect();
          const menuHeight = 8 + available.length * 36;
          let limit = window.innerHeight;
          let node = rootRef.current?.parentElement ?? null;
          while (node) {
            const overflow = getComputedStyle(node).overflowY;
            if (overflow === "auto" || overflow === "scroll" || overflow === "hidden") {
              limit = Math.min(limit, node.getBoundingClientRect().bottom);
              break;
            }
            node = node.parentElement;
          }
          const spaceBelow = limit - (rect?.bottom ?? 0);
          setOpenUp(spaceBelow < menuHeight + 8);
          setOpen(true);
        }}
      >
        <ChevronDown
          className={cn("transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden
        />
      </Button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute left-0 z-20 min-w-[11rem] overflow-hidden rounded-md border border-solid border-border bg-card py-1",
            openUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {available.map((part) => (
            <button
              key={part.key}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer appearance-none items-center justify-between gap-4 border-0 bg-transparent px-3 py-2 text-left font-[inherit] text-sm text-foreground hover:bg-muted"
              aria-label={`Copy ${part.label}`}
              onClick={() => {
                setOpen(false);
                onCopy(part.key, part.text);
              }}
            >
              <span>{part.label}</span>
              <span className="text-muted-foreground">{part.text}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function birthdayCopyText(date: string): string {
  return date.replaceAll("/", "");
}

function DomainModal({
  open,
  domain,
  onSave,
  onClose,
}: {
  open: boolean;
  domain: string;
  onSave: (domain: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(domain);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(domain);
    setInvalid(false);
  }, [open, domain]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function save() {
    const next = normalizeEmailDomain(draft);
    if (!next) {
      setInvalid(true);
      return;
    }
    onSave(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 m-0 cursor-default border-0 p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-lg border border-solid border-border bg-white p-4 font-sans text-foreground shadow-none"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id={titleId} className="m-0 text-sm font-semibold tracking-wide">
            Domain
          </h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={draft}
            aria-labelledby={titleId}
            aria-invalid={invalid}
            className={cn(
              "m-0 box-border h-9 w-full appearance-none rounded-md border border-solid bg-white px-3 py-0",
              "font-sans text-sm text-foreground shadow-none outline-none transition-colors",
              "placeholder:text-muted-foreground focus-visible:border-border-hover",
              invalid ? "border-border-hover" : "border-border",
            )}
            onChange={(event) => {
              setDraft(event.target.value);
              setInvalid(false);
            }}
          />
          {invalid ? (
            <p className="m-0 mt-2 text-sm text-muted-foreground">
              Enter a domain like example.com.
            </p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ActionRow({
  shuffleLabel,
  copyKey,
  copyText,
  copyLabel,
  parts,
  copiedKey,
  disabled,
  onShuffle,
  onCopy,
  trailing,
}: {
  shuffleLabel: string;
  copyKey: string;
  copyText: string | null;
  copyLabel: string;
  parts?: CopyPart[];
  copiedKey: string | null;
  disabled?: boolean;
  onShuffle: () => void;
  onCopy: (key: string, text: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        aria-label={shuffleLabel}
        onClick={onShuffle}
      >
        <ActionGlyph icon={RefreshCw} />
        Regenerate
      </Button>
      <CopyControl
        copyKey={copyKey}
        copyText={copyText}
        copyLabel={copyLabel}
        parts={parts}
        copiedKey={copiedKey}
        disabled={disabled}
        onCopy={onCopy}
      />
      {trailing ? <div className="ml-auto">{trailing}</div> : null}
    </div>
  );
}

const pageColumnClass = "mx-auto w-full max-w-2xl px-5 min-[768px]:px-10";

/** Home の記事行と同じ、ホバーで bg-muted になるコピー面。余白は外へ広げて文字位置は動かさない。 */
const copySurfaceClass =
  "m-0 cursor-pointer appearance-none border-0 bg-transparent text-left font-[inherit] text-foreground shadow-none outline-none transition-colors hover:bg-muted focus-visible:bg-muted";
const displayTitleClass =
  "text-[1.75rem] font-normal leading-none tracking-tight text-foreground min-[768px]:text-4xl";

export function IdGenTool() {
  const [account, setAccount] = useState<GeneratedAccount | null>(null);
  const [length, setLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [symbols, setSymbols] = useState(DEFAULT_PASSWORD_SYMBOLS);
  const [domain, setDomain] = useState(DEFAULT_EMAIL_DOMAIN);
  const [domainOpen, setDomainOpen] = useState(false);
  const [decades, setDecades] = useState<AgeDecade[]>([...DEFAULT_AGE_DECADES]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState(0);
  const [stuck, setStuck] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector(".layout-main__content");
    if (!(root instanceof HTMLElement)) return;
    const update = () => setStuck(root.scrollTop > 0);
    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const saved = readStoredEmailDomain() ?? DEFAULT_EMAIL_DOMAIN;
    setDomain(saved);
    setAccount(
      generateAccount({
        length: DEFAULT_PASSWORD_LENGTH,
        symbols: DEFAULT_PASSWORD_SYMBOLS,
        decades: DEFAULT_AGE_DECADES,
        domain: saved,
      }),
    );
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function clearCopied() {
    setCopiedKey(null);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  async function copyText(key: string, text: string) {
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopiedKey(key);
    setCopyNotice((notice) => notice + 1);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
      timerRef.current = null;
    }, COPY_FEEDBACK_MS);
  }

  function update(patch: Partial<GeneratedAccount>) {
    setAccount((current) => (current ? { ...current, ...patch } : current));
    clearCopied();
  }

  function saveDomain(next: string) {
    setDomain(next);
    writeStoredEmailDomain(next);
    setAccount((current) =>
      current ? { ...current, email: emailWithDomain(current.email, next) } : current,
    );
    clearCopied();
    setDomainOpen(false);
  }

  function changeLength(next: number) {
    const clamped = clampPasswordLength(next);
    setLength(clamped);
    update({ password: randomPassword({ length: clamped, symbols }) });
  }

  function changeSymbols(next: boolean) {
    setSymbols(next);
    update({ password: randomPassword({ length, symbols: next }) });
  }

  function changeDecade(decade: AgeDecade, checked: boolean) {
    const next = checked
      ? [...decades, decade].sort((a, b) => a - b)
      : decades.filter((item) => item !== decade);
    setDecades(next);
    update({ birthday: randomBirthday(next) });
  }

  const ready = account !== null;
  const ja: JaName | null = account?.ja ?? null;
  const en: EnName | null = account?.en ?? null;
  const birthday: Birthday | null = account?.birthday ?? null;

  return (
    <div className="bg-white font-sans text-foreground">
      <div className="sticky top-0 z-20 flex h-14 items-center border-0 border-b border-solid border-border bg-white px-4 min-[1080px]:hidden">
        <MobileMenuButton />
      </div>

      <div className="sticky top-14 z-10 bg-white min-[1080px]:top-0">
        <div className={cn(pageColumnClass, "pt-6 pb-8")}>
          <h1 className={cn("m-0", displayTitleClass)}>
            Personal Information Generator
          </h1>
          <p className="m-0 mt-2 text-sm leading-snug text-muted-foreground">
            個人情報ジェネレーター
          </p>
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border",
            !stuck && "hidden",
          )}
        />
      </div>

      <div className={cn(pageColumnClass, "pb-8 [&>section:first-child>h2]:mt-0")}>
        <Field title="Email">
          <SecretValue
            text={account?.email ?? null}
            label="Copy email"
            onCopy={() => account && copyText("email", account.email)}
          />
          <ActionRow
            shuffleLabel="Regenerate email"
            copyKey="email"
            copyText={account?.email ?? null}
            copyLabel="Copy email"
            copiedKey={copiedKey}
            disabled={!ready}
            onShuffle={() => update({ email: randomEmail(domain) })}
            onCopy={copyText}
            trailing={
              <Button
                type="button"
                size="sm"
                disabled={!ready}
                className="w-9 px-0"
                aria-label="Domain settings"
                onClick={() => setDomainOpen(true)}
              >
                <ActionGlyph icon={Settings} />
              </Button>
            }
          />
        </Field>

        <Field title="Password">
          <SecretValue
            text={account?.password ?? null}
            label="Copy password"
            onCopy={() => account && copyText("password", account.password)}
          />
          <div className="mt-6 flex items-center gap-3">
            <label
              htmlFor="password-length"
              className="shrink-0 text-sm text-foreground"
            >
              Length
            </label>
            <input
              id="password-length"
              type="range"
              min={PASSWORD_LENGTH_MIN}
              max={PASSWORD_LENGTH_MAX}
              step={1}
              value={length}
              disabled={!ready}
              aria-valuemin={PASSWORD_LENGTH_MIN}
              aria-valuemax={PASSWORD_LENGTH_MAX}
              aria-valuenow={length}
              aria-valuetext={`${length} characters`}
              onChange={(event) => changeLength(Number(event.target.value))}
              className="m-0 h-6 min-w-0 flex-1 cursor-pointer accent-[hsl(var(--foreground))] disabled:cursor-default disabled:opacity-50"
            />
            <span className="w-7 shrink-0 text-right text-sm tabular-nums text-foreground">
              {length}
            </span>
          </div>
          <label
            className={cn(
              "mt-5 flex w-fit items-center gap-2 text-sm text-foreground",
              ready ? "cursor-pointer" : "cursor-default opacity-50",
            )}
          >
            <input
              type="checkbox"
              checked={symbols}
              disabled={!ready}
              onChange={(event) => changeSymbols(event.target.checked)}
              className="m-0 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))] disabled:cursor-default"
            />
            Include symbols ({PASSWORD_SYMBOLS})
          </label>
          <ActionRow
            shuffleLabel="Regenerate password"
            copyKey="password"
            copyText={account?.password ?? null}
            copyLabel="Copy password"
            copiedKey={copiedKey}
            disabled={!ready}
            onShuffle={() =>
              update({ password: randomPassword({ length, symbols }) })
            }
            onCopy={copyText}
          />
        </Field>

        <Field title="Japanese name">
          {ja ? (
            <button
              type="button"
              className={cn(
                copySurfaceClass,
                "-mx-2 -my-1 w-fit rounded-md px-2 py-1 text-lg font-medium leading-snug",
              )}
              aria-label="Copy Japanese name"
              onClick={() => copyText("ja", jaKanji(ja))}
            >
              {jaKanji(ja)}
            </button>
          ) : (
            <Skeleton className="h-7 w-2/5" />
          )}
          <div className="mt-3">
            {ja ? (
              <button
                type="button"
                className={cn(
                  copySurfaceClass,
                  "-mx-2 -my-1 w-fit rounded-md px-2 py-1 text-sm text-muted-foreground",
                )}
                aria-label="Copy reading"
                onClick={() => copyText("ja-kana", jaKana(ja))}
              >
                {jaKana(ja)}
              </button>
            ) : (
              <Skeleton className="h-5 w-1/2" />
            )}
          </div>
          <ActionRow
            shuffleLabel="Regenerate Japanese name"
            copyKey="ja"
            copyText={ja ? jaKanji(ja) : null}
            copyLabel="Copy Japanese name"
            parts={[
              { key: "ja-family", label: "Last（漢）", text: ja?.family ?? "" },
              { key: "ja-given", label: "First（漢）", text: ja?.given ?? "" },
              { key: "ja-sei", label: "Last（ひ）", text: ja?.familyKana ?? "" },
              { key: "ja-mei", label: "First（ひ）", text: ja?.givenKana ?? "" },
            ]}
            copiedKey={copiedKey}
            disabled={!ready}
            onShuffle={() => update({ ja: randomJaName() })}
            onCopy={copyText}
          />
        </Field>

        <Field title="English name">
          {en ? (
            <button
              type="button"
              className={cn(
                copySurfaceClass,
                "-mx-2 -my-1 w-fit rounded-md px-2 py-1 text-lg font-medium leading-snug",
              )}
              aria-label="Copy English name"
              onClick={() => copyText("en", enFull(en))}
            >
              {enFull(en)}
            </button>
          ) : (
            <Skeleton className="h-7 w-2/5" />
          )}
          <ActionRow
            shuffleLabel="Regenerate English name"
            copyKey="en"
            copyText={en ? enFull(en) : null}
            copyLabel="Copy English name"
            parts={[
              { key: "en-first", label: "First", text: en?.first ?? "" },
              { key: "en-last", label: "Last", text: en?.last ?? "" },
            ]}
            copiedKey={copiedKey}
            disabled={!ready}
            onShuffle={() => update({ en: randomEnName() })}
            onCopy={copyText}
          />
        </Field>

        <Field title="Birthday">
          {birthday ? (
            <button
              type="button"
              className={cn(
                copySurfaceClass,
                "-mx-2 -my-1 inline-flex w-fit items-baseline rounded-md px-2 py-1 font-mono text-[0.9375rem] leading-relaxed",
              )}
              aria-label="Copy birthday"
              onClick={() => copyText("birthday", birthdayCopyText(birthday.date))}
            >
              {birthday.date}
              <span className="ml-[0.5em] font-sans tabular-nums text-muted-foreground">
                (Age {birthday.age})
              </span>
            </button>
          ) : ready ? (
            <div className={filterFieldClass({ empty: true })}>—</div>
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            {AGE_DECADES.map((decade) => (
              <label
                key={decade}
                className={cn(
                  "flex items-center gap-2 text-sm text-foreground",
                  ready ? "cursor-pointer" : "cursor-default opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={decades.includes(decade)}
                  disabled={!ready}
                  onChange={(event) => changeDecade(decade, event.target.checked)}
                  className="m-0 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))] disabled:cursor-default"
                />
                {decade}s
              </label>
            ))}
          </div>
          <ActionRow
            shuffleLabel="Regenerate birthday"
            copyKey="birthday"
            copyText={birthday ? birthdayCopyText(birthday.date) : null}
            copyLabel="Copy birthday"
            copiedKey={copiedKey}
            disabled={!ready || decades.length === 0}
            onShuffle={() => update({ birthday: randomBirthday(decades) })}
            onCopy={copyText}
          />
        </Field>
      </div>

      <noscript>
        <p className="m-0 mt-6 text-sm text-muted-foreground">
          Enable JavaScript to generate values in this browser.
        </p>
      </noscript>
      <DomainModal
        open={domainOpen}
        domain={domain}
        onSave={saveDomain}
        onClose={() => setDomainOpen(false)}
      />
      {copyNotice > 0 ? (
        <div
          key={copyNotice}
          className="notification show"
          role="status"
          aria-live="polite"
        >
          Copied
        </div>
      ) : null}
    </div>
  );
}
