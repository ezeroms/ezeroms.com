"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AdminClickableRow } from "@/components/admin/AdminClickableRow";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type AboutBasedInItem = {
  id: string;
  location: string;
  body_md: string;
  sort_order: number;
};

const FORM_ID = "about-based-in-form";

export function AboutBasedInSection({ items }: { items: AboutBasedInItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AboutBasedInItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  const open = creating || Boolean(editing);
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (editing) {
      setLocation(editing.location);
      setBodyMd(editing.body_md);
      setDirty(false);
      setError(null);
      setDeleteError(null);
    } else if (creating) {
      setLocation("");
      setBodyMd("");
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

  async function move(id: string, direction: "up" | "down") {
    setReordering(id);
    try {
      const res = await fetch(`/api/admin/about/based-in/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (res.ok) router.refresh();
    } finally {
      setReordering(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/about/based-in/${editing!.id}/`
          : "/api/admin/about/based-in/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, body_md: bodyMd }),
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
    if (!window.confirm("この項目を削除しますか？")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/about/based-in/${editing.id}/`, {
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
        <h2 className="m-0 text-base font-semibold">Based in</h2>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          ＋ 追加
        </Button>
      </div>
      <div className="overflow-x-auto overflow-hidden rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-24 px-4 py-3 font-medium">並び</th>
              <th className="w-28 px-4 py-3 font-medium">場所</th>
              <th className="px-4 py-3 font-medium">内容</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <AdminClickableRow
                key={item.id}
                className="bg-card hover:bg-muted/30"
                onActivate={() => setEditing(item)}
              >
                <td className="px-4 py-2.5 align-middle">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={index === 0 || reordering === item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void move(item.id, "up");
                      }}
                      aria-label="上へ"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={
                        index === items.length - 1 || reordering === item.id
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        void move(item.id, "down");
                      }}
                      aria-label="下へ"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-2.5 align-middle font-medium">
                  {item.location}
                </td>
                <td className="max-w-[360px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                  {item.body_md || "—"}
                </td>
              </AdminClickableRow>
            ))}
            {!items.length ? (
              <tr className="bg-card">
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  まだ項目がありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminContentModal
        open={open}
        onClose={close}
        title={isEdit ? "Based in を編集" : "Based in を追加"}
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
            <Label htmlFor="based-location">場所</Label>
            <Input
              id="based-location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setDirty(true);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="based-body">内容（Markdown）</Label>
            <Textarea
              id="based-body"
              value={bodyMd}
              onChange={(e) => {
                setBodyMd(e.target.value);
                setDirty(true);
              }}
              rows={4}
            />
          </div>
        </form>
      </AdminContentModal>
    </section>
  );
}
