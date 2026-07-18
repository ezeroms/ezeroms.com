"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function localDatetimeValue(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type NotesEditorInitial = {
  slug: string;
  body_md: string;
  date: string;
  tags: string;
  place: string;
  status: "published" | "draft";
  og_image: string;
};

export function NotesEditorForm({
  initial,
}: {
  initial?: NotesEditorInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? "");
  const [date, setDate] = useState(
    initial?.date ? localDatetimeValue(new Date(initial.date)) : localDatetimeValue(),
  );
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [ogImage, setOgImage] = useState(initial?.og_image ?? "");
  const [status, setStatus] = useState<"published" | "draft">(
    initial?.status ?? "published",
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ slug: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const payload = {
        body_md: bodyMd,
        date: new Date(date).toISOString(),
        tags,
        place,
        og_image: ogImage,
        status,
      };
      const res = await fetch(
        isEdit ? `/api/admin/notes/${initial!.slug}/` : "/api/admin/notes/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        item?: { slug: string };
      };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      if (data.item?.slug) {
        setOk({ slug: data.item.slug });
        if (!isEdit) {
          setBodyMd("");
          setTags("");
          setPlace("");
          setOgImage("");
        }
        router.refresh();
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {isEdit ? (
        <p className="text-xs text-muted-foreground">
          slug: <code className="rounded bg-muted px-1 py-0.5">{initial!.slug}</code>
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-body">本文（Markdown）</Label>
        <Textarea
          id="note-body"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder="今日あったこと、考えたこと…"
          required
        />
      </div>
      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="diary"
        disabled={loading}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-date">日時</Label>
        <Input
          id="note-date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-tags">タグ（カンマ区切り）</Label>
        <Input
          id="note-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="散歩, 音楽"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-place">場所</Label>
        <Input
          id="note-place"
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="高円寺"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-status">公開状態</Label>
        <Select
          id="note-status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value === "draft" ? "draft" : "published")
          }
        >
          <option value="published">公開</option>
          <option value="draft">下書き</option>
        </Select>
      </div>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok ? (
        <Alert variant="success">
          保存しました。{" "}
          <Link href={`/diary/${ok.slug}/`} className="underline">
            投稿を見る
          </Link>
          {isEdit ? null : (
            <>
              {" · "}
              <Link href={`/admin/notes/${ok.slug}/edit/`} className="underline">
                続けて編集
              </Link>
            </>
          )}
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : isEdit ? "更新する" : "投稿する"}
        </Button>
        {isEdit ? (
          <Button asChild type="button" variant="outline">
            <Link href="/admin/notes/">一覧へ戻る</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
