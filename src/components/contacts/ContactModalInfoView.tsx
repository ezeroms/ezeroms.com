"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  ClickToEditBirthday,
} from "@/components/contacts/BirthdayPartsFields";
import {
  ClickToEditField,
  ClickToEditRow,
} from "@/components/ui/click-to-edit-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";
import {
  buildContactChildrenPayload,
  contactToEditorState,
  joinContactNameParts,
  parseJoinedContactName,
  type ContactEditorState,
} from "@/lib/workspace/contact-editor-state";
import type { WorkspaceContactDetail } from "@/types/contacts";

type Props = {
  contact: WorkspaceContactDetail;
  onContactUpdated: (contact: WorkspaceContactDetail) => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function ContactModalInfoView({
  contact,
  onContactUpdated,
  onDelete,
  deleting = false,
}: Props) {
  const [state, setState] = useState(() => contactToEditorState(contact));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(contactToEditorState(contact));
    setError(null);
  }, [contact]);

  async function patchContact(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/contacts/${contact.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        item?: WorkspaceContactDetail;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      setState(contactToEditorState(data.item));
      onContactUpdated(data.item);
      return data.item;
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setBusy(false);
    }
  }

  /** 子行（電話など）だけ差し替えて PATCH するときのペイロード */
  function childrenPayload(partial: Partial<ContactEditorState>) {
    return buildContactChildrenPayload({ ...state, ...partial });
  }

  const kanjiName = joinContactNameParts(
    state.family_name,
    state.middle_name,
    state.given_name,
  );
  // family_name_en など「英語の姓・名」を1行表示用につなぐ（イングリッシュネームとは別）
  const structuredEnglishName = joinContactNameParts(
    state.family_name_en,
    state.middle_name_en,
    state.given_name_en,
  );
  const kanaName = joinContactNameParts(
    state.family_name_kana,
    state.middle_name_kana,
    state.given_name_kana,
  );

  return (
    <div
      role="tabpanel"
      aria-labelledby="contact-modal-tab-info"
      className="flex flex-col gap-8"
    >
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          基本情報
        </h3>
        <ClickToEditRow label="漢字表記">
          <ClickToEditField
            value={kanjiName}
            emptyLabel="未設定"
            placeholder="姓 名（ミドルは姓 ミドル 名）"
            disabled={busy || deleting}
            ariaLabel="漢字表記"
            onSave={async (next) => {
              const parsed = parseJoinedContactName(next);
              await patchContact({
                family_name: parsed.family || null,
                middle_name: parsed.middle || null,
                given_name: parsed.given || null,
              });
            }}
          />
        </ClickToEditRow>
        <ClickToEditRow label="かな表記">
          <ClickToEditField
            value={kanaName}
            emptyLabel="未設定"
            placeholder="せい めい"
            disabled={busy || deleting}
            ariaLabel="かな表記"
            onSave={async (next) => {
              const parsed = parseJoinedContactName(next);
              await patchContact({
                family_name_kana: parsed.family || null,
                middle_name_kana: parsed.middle || null,
                given_name_kana: parsed.given || null,
              });
            }}
          />
        </ClickToEditRow>
        <ClickToEditRow label="英語表記">
          <ClickToEditField
            value={structuredEnglishName}
            emptyLabel="未設定"
            placeholder="FAMILY GIVEN"
            disabled={busy || deleting}
            ariaLabel="英語表記"
            onSave={async (next) => {
              const parsed = parseJoinedContactName(next);
              await patchContact({
                family_name_en: parsed.family || null,
                middle_name_en: parsed.middle || null,
                given_name_en: parsed.given || null,
              });
            }}
          />
        </ClickToEditRow>

        <ClickToEditRow label="旧姓">
          <ClickToEditField
            value={state.former_family_name}
            emptyLabel="未設定"
            disabled={busy || deleting}
            ariaLabel="旧姓"
            onSave={async (next) => {
              await patchContact({ former_family_name: next || null });
            }}
          />
        </ClickToEditRow>

        <ClickToEditRow label="ニックネーム">
          <ClickToEditField
            value={state.nickname}
            emptyLabel="未設定"
            disabled={busy || deleting}
            ariaLabel="ニックネーム"
            onSave={async (next) => {
              await patchContact({ nickname: next || null });
            }}
          />
        </ClickToEditRow>
        <ClickToEditRow label="イングリッシュネーム">
          <ClickToEditField
            value={state.english_name}
            emptyLabel="未設定"
            disabled={busy || deleting}
            ariaLabel="イングリッシュネーム"
            onSave={async (next) => {
              await patchContact({ english_name: next || null });
            }}
          />
        </ClickToEditRow>

        <ClickToEditRow label="誕生日">
          <ClickToEditBirthday
            birthday={state.birthday}
            yearKnown={state.birthday_year_known}
            disabled={busy || deleting}
            onSave={async (next) => {
              await patchContact({
                birthday: next.birthday,
                birthday_year_known: next.birthday_year_known,
              });
            }}
          />
        </ClickToEditRow>

        <ClickToEditRow label="タグ">
          <ClickToEditField
            value={state.tags}
            emptyLabel="タグなし"
            placeholder="work, networking"
            disabled={busy || deleting}
            ariaLabel="タグ"
            onSave={async (next) => {
              await patchContact({ tags: next });
            }}
          />
        </ClickToEditRow>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          メモ
        </h3>
        <ClickToEditField
          value={state.notes_md}
          inputType="textarea"
          emptyLabel="メモなし"
          disabled={busy || deleting}
          ariaLabel="メモ"
          onSave={async (next) => {
            await patchContact({ notes_md: next || null });
          }}
        />
      </section>

      <LabeledListSection
        title="電話番号"
        emptyLabel="電話番号なし"
        addLabel="電話番号を追加"
        disabled={busy || deleting}
        rows={state.phones}
        onAdd={() =>
          setState((prev) => ({
            ...prev,
            phones: [...prev.phones, { label: "", value: "" }],
          }))
        }
        renderRow={(row, i) => (
          <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr_auto]">
            <ClickToEditField
              value={row.label}
              emptyLabel="ラベル"
              disabled={busy || deleting}
              ariaLabel="電話ラベル"
              displayClassName="text-sm text-muted-foreground"
              onSave={async (next) => {
                const phones = state.phones.map((p, j) =>
                  j === i ? { ...p, label: next } : p,
                );
                setState((prev) => ({ ...prev, phones }));
                await patchContact(childrenPayload({ phones }));
              }}
            />
            <ClickToEditField
              value={row.value}
              emptyLabel="番号を入力"
              disabled={busy || deleting}
              ariaLabel="電話番号"
              onSave={async (next) => {
                const phones = state.phones.map((p, j) =>
                  j === i ? { ...p, value: next } : p,
                );
                setState((prev) => ({ ...prev, phones }));
                await patchContact(childrenPayload({ phones }));
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || deleting}
              onClick={() => {
                const phones = state.phones.filter((_, j) => j !== i);
                setState((prev) => ({ ...prev, phones }));
                void patchContact(childrenPayload({ phones }));
              }}
            >
              削除
            </Button>
          </div>
        )}
      />

      <LabeledListSection
        title="住所"
        emptyLabel="住所なし"
        addLabel="住所を追加"
        disabled={busy || deleting}
        rows={state.addresses}
        onAdd={() =>
          setState((prev) => ({
            ...prev,
            addresses: [...prev.addresses, { label: "", value: "" }],
          }))
        }
        renderRow={(row, i) => (
          <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr_auto]">
            <ClickToEditField
              value={row.label}
              emptyLabel="ラベル"
              disabled={busy || deleting}
              ariaLabel="住所ラベル"
              displayClassName="text-sm text-muted-foreground"
              onSave={async (next) => {
                const addresses = state.addresses.map((a, j) =>
                  j === i ? { ...a, label: next } : a,
                );
                setState((prev) => ({ ...prev, addresses }));
                await patchContact(childrenPayload({ addresses }));
              }}
            />
            <ClickToEditField
              value={row.value}
              inputType="textarea"
              emptyLabel="住所を入力"
              disabled={busy || deleting}
              ariaLabel="住所"
              onSave={async (next) => {
                const addresses = state.addresses.map((a, j) =>
                  j === i ? { ...a, value: next } : a,
                );
                setState((prev) => ({ ...prev, addresses }));
                await patchContact(childrenPayload({ addresses }));
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || deleting}
              onClick={() => {
                const addresses = state.addresses.filter((_, j) => j !== i);
                setState((prev) => ({ ...prev, addresses }));
                void patchContact(childrenPayload({ addresses }));
              }}
            >
              削除
            </Button>
          </div>
        )}
      />

      <LabeledListSection
        title="関連リンク"
        emptyLabel="リンクなし"
        addLabel="リンクを追加"
        disabled={busy || deleting}
        rows={state.links}
        onAdd={() =>
          setState((prev) => ({
            ...prev,
            links: [...prev.links, { label: "", url: "" }],
          }))
        }
        renderRow={(row, i) => (
          <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr_auto]">
            <ClickToEditField
              value={row.label}
              emptyLabel="ラベル"
              disabled={busy || deleting}
              ariaLabel="リンクラベル"
              displayClassName="text-sm text-muted-foreground"
              onSave={async (next) => {
                const links = state.links.map((l, j) =>
                  j === i ? { ...l, label: next } : l,
                );
                setState((prev) => ({ ...prev, links }));
                await patchContact(childrenPayload({ links }));
              }}
            />
            <ClickToEditField
              value={row.url}
              emptyLabel="URL を入力"
              disabled={busy || deleting}
              ariaLabel="URL"
              onSave={async (next) => {
                const links = state.links.map((l, j) =>
                  j === i ? { ...l, url: next } : l,
                );
                setState((prev) => ({ ...prev, links }));
                await patchContact(childrenPayload({ links }));
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || deleting}
              onClick={() => {
                const links = state.links.filter((_, j) => j !== i);
                setState((prev) => ({ ...prev, links }));
                void patchContact(childrenPayload({ links }));
              }}
            >
              削除
            </Button>
          </div>
        )}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            勤務先
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || deleting}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                employments: [
                  ...prev.employments,
                  {
                    company_name: "",
                    title: "",
                    started_on: "",
                    ended_on: "",
                    is_current: prev.employments.length === 0,
                    notes: "",
                  },
                ],
              }))
            }
          >
            履歴を追加
          </Button>
        </div>
        {state.employments.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">会社情報なし</p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.employments.map((row, i) => (
              <div
                key={i}
                className="relative flex flex-col gap-3 rounded-lg border border-solid border-border p-4"
              >
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  {row.is_current ? (
                    <span className={tagChipClass(false)}>メイン</span>
                  ) : null}
                  <EmploymentCardMenu
                    disabled={busy || deleting}
                    showMakeMain={!row.is_current}
                    onMakeMain={() => {
                      const employments = state.employments.map((e, j) => ({
                        ...e,
                        is_current: j === i,
                      }));
                      setState((prev) => ({ ...prev, employments }));
                      void patchContact(childrenPayload({ employments }));
                    }}
                    onDelete={() => {
                      const employments = state.employments.filter(
                        (_, j) => j !== i,
                      );
                      setState((prev) => ({ ...prev, employments }));
                      void patchContact(childrenPayload({ employments }));
                    }}
                  />
                </div>

                <div className="flex max-w-[calc(100%-6.5rem)] flex-col gap-3">
                  <ClickToEditRow label="会社名">
                    <ClickToEditField
                      value={row.company_name}
                      emptyLabel="会社名"
                      disabled={busy || deleting}
                      ariaLabel="会社名"
                      onSave={async (next) => {
                        const employments = state.employments.map((e, j) =>
                          j === i ? { ...e, company_name: next } : e,
                        );
                        setState((prev) => ({ ...prev, employments }));
                        await patchContact(childrenPayload({ employments }));
                      }}
                    />
                  </ClickToEditRow>
                  <ClickToEditRow label="役職">
                    <ClickToEditField
                      value={row.title}
                      emptyLabel="役職なし"
                      disabled={busy || deleting}
                      ariaLabel="役職"
                      onSave={async (next) => {
                        const employments = state.employments.map((e, j) =>
                          j === i ? { ...e, title: next } : e,
                        );
                        setState((prev) => ({ ...prev, employments }));
                        await patchContact(childrenPayload({ employments }));
                      }}
                    />
                  </ClickToEditRow>
                  <ClickToEditRow label="開始">
                    <ClickToEditField
                      value={row.started_on}
                      inputType="date"
                      emptyLabel="未設定"
                      disabled={busy || deleting}
                      ariaLabel="開始日"
                      onSave={async (next) => {
                        const employments = state.employments.map((e, j) =>
                          j === i ? { ...e, started_on: next } : e,
                        );
                        setState((prev) => ({ ...prev, employments }));
                        await patchContact(childrenPayload({ employments }));
                      }}
                    />
                  </ClickToEditRow>
                  <ClickToEditRow label="終了">
                    <ClickToEditField
                      value={row.ended_on}
                      inputType="date"
                      emptyLabel="未設定"
                      disabled={busy || deleting}
                      ariaLabel="終了日"
                      onSave={async (next) => {
                        const employments = state.employments.map((e, j) =>
                          j === i ? { ...e, ended_on: next } : e,
                        );
                        setState((prev) => ({ ...prev, employments }));
                        await patchContact(childrenPayload({ employments }));
                      }}
                    />
                  </ClickToEditRow>
                </div>

                <ClickToEditRow label="メモ">
                  <ClickToEditField
                    value={row.notes}
                    emptyLabel="メモなし"
                    disabled={busy || deleting}
                    ariaLabel="会社メモ"
                    onSave={async (next) => {
                      const employments = state.employments.map((e, j) =>
                        j === i ? { ...e, notes: next } : e,
                      );
                      setState((prev) => ({ ...prev, employments }));
                      await patchContact(childrenPayload({ employments }));
                    }}
                  />
                </ClickToEditRow>
              </div>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-0 border-t border-solid border-border pt-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.is_friend}
            disabled={busy || deleting}
            onChange={(e) => {
              const next = e.target.checked;
              setState((prev) => ({ ...prev, is_friend: next }));
              void patchContact({ is_friend: next }).catch(() => {
                setState((prev) => ({ ...prev, is_friend: !next }));
              });
            }}
          />
          Friend（交友録に表示）
        </label>
        <div>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || deleting}
            onClick={onDelete}
          >
            {deleting ? "削除中…" : "この連絡先を削除"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmploymentCardMenu({
  disabled,
  showMakeMain,
  onMakeMain,
  onDelete,
}: {
  disabled?: boolean;
  showMakeMain: boolean;
  onMakeMain: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label="会社履歴メニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-md border border-solid border-border bg-card py-1"
        >
          {showMakeMain ? (
            <button
              type="button"
              role="menuitem"
              className="block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onMakeMain();
              }}
            >
              メインにする
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            削除
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LabeledListSection<T>({
  title,
  emptyLabel,
  addLabel,
  rows,
  disabled,
  onAdd,
  renderRow,
}: {
  title: string;
  emptyLabel: string;
  addLabel: string;
  rows: T[];
  disabled?: boolean;
  onAdd: () => void;
  renderRow: (row: T, index: number) => ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i}>{renderRow(row, i)}</div>
          ))}
        </div>
      )}
    </section>
  );
}
