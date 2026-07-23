"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AboutWebLinkItem = {
  id: string;
  label: string;
  url: string;
  sort_order: number;
};

const FORM_ID = "about-web-link-form";

export function AboutWebLinksSection({ items }: { items: AboutWebLinkItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AboutWebLinkItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = creating || Boolean(editing);
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (editing) {
      setLabel(editing.label);
      setUrl(editing.url);
      setDirty(false);
      setError(null);
      setDeleteError(null);
    } else if (creating) {
      setLabel("");
      setUrl("");
      setDirty(false);
      setError(null);
    }
  }, [editing, creating]);

  function close() {
    setEditing(null);
    setCreating(false);
    setSaving(false);
    setDeleting(false);
    setDirty(false);
    setError(null);
    setDeleteError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/about/web-links/${editing!.id}/`
          : "/api/admin/about/web-links/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, url }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editing || deleting) return;
    if (!window.confirm("このリンクを削除しますか？")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/about/web-links/${editing.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error || "削除に失敗しました");
        return;
      }
      close();
      router.refresh();
    } catch {
      setDeleteError("通信エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-semibold">Around the Web</h2>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          ＋ 追加
        </Button>
      </div>
      <div className="overflow-x-auto overflow-hidden rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-40 px-4 py-3 font-medium">名前</th>
              <th className="px-4 py-3 font-medium">リンク</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminClickableRow
                key={item.id}
                className="bg-card hover:bg-muted/30"
                onActivate={() => setEditing(item)}
              >
                <td className="px-4 py-2.5 align-middle font-medium">
                  {item.label}
                </td>
                <td className="max-w-[420px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                  {item.url}
                </td>
              </AdminClickableRow>
            ))}
            {!items.length ? (
              <tr className="bg-card">
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  まだリンクがありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminContentModal
        open={open}
        onClose={close}
        title={isEdit ? "リンクを編集" : "リンクを追加"}
        formId={FORM_ID}
        isEdit={isEdit}
        saving={saving}
        dirty={dirty}
        deleting={deleting}
        deleteError={deleteError}
        onDelete={isEdit ? onDelete : undefined}
      >
        <form id={FORM_ID} className="space-y-4" onSubmit={onSubmit}>
          {error ? (
            <p className="m-0 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="link-label">名前</Label>
            <Input
              id="link-label"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setDirty(true);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setDirty(true);
              }}
              required
            />
          </div>
        </form>
      </AdminContentModal>
    </section>
  );
}
