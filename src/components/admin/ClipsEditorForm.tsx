"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export type ClipsEditorInitial = {
  slug: string;
  title: string;
  source_url: string;
  date: string;
  memo: string;
  tags: string;
  status: "published" | "draft";
  og_image?: string;
  og_description?: string;
};

export function ClipsEditorForm({
  initial,
}: {
  initial?: ClipsEditorInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? "");
  const [date, setDate] = useState(
    initial?.date ? localDatetimeValue(new Date(initial.date)) : localDatetimeValue(),
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [status, setStatus] = useState<"published" | "draft">(
    initial?.status ?? "published",
  );
  const [ogImage, setOgImage] = useState(initial?.og_image ?? "");
  const [ogDescription, setOgDescription] = useState(
    initial?.og_description ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ slug: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [ogLoading, setOgLoading] = useState(false);

  async function fetchOgp() {
    setError(null);
    const url = sourceUrl.trim();
    if (!url) {
      setError("先に出典 URL を入力してください");
      return;
    }
    setOgLoading(true);
    try {
      const res = await fetch(
        `/api/admin/clips/ogp/?url=${encodeURIComponent(url)}`,
      );
      const data = (await res.json()) as {
        error?: string;
        image?: string;
        title?: string;
        description?: string;
      };
      if (!res.ok) {
        setError(data.error || "OGP の取得に失敗しました");
        return;
      }
      if (data.image) setOgImage(data.image);
      if (data.description) setOgDescription(data.description);
      if (!title.trim() && data.title) setTitle(data.title);
      if (!data.image && !data.title) {
        setError("OGP 情報が見つかりませんでした（保存は可能です）");
      }
    } catch {
      setError("OGP 取得中に通信エラーが発生しました");
    } finally {
      setOgLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const payload = {
        title,
        source_url: sourceUrl,
        date: new Date(date).toISOString(),
        memo,
        tags,
        status,
        og_image: ogImage,
        og_description: ogDescription,
        refresh_og: isEdit && !ogImage,
      };
      const res = await fetch(
        isEdit ? `/api/admin/clips/${initial!.slug}/` : "/api/admin/clips/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        item?: { slug: string; og_image?: string };
      };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      if (data.item?.slug) {
        if (data.item.og_image) setOgImage(data.item.og_image);
        setOk({ slug: data.item.slug });
        if (!isEdit) {
          setTitle("");
          setSourceUrl("");
          setMemo("");
          setTags("");
          setOgImage("");
          setOgDescription("");
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-url">出典 URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="clip-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchOgp()}
            disabled={ogLoading || !sourceUrl.trim()}
          >
            {ogLoading ? "取得中…" : "OGP を取得"}
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          URL を入れて OGP を取得すると、画像プレビューとタイトル候補が入ります。
        </p>
      </div>

      {ogImage ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImage}
            alt=""
            className="m-0 max-h-48 w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-title">タイトル</Label>
        <Input
          id="clip-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="記事タイトル"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-date">メモした日付</Label>
        <Input
          id="clip-date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-memo">短いメモ（任意）</Label>
        <Textarea
          id="clip-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="なぜ残したか、要点など（短く）"
          className="min-h-[120px]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-tags">タグ（カンマ区切り）</Label>
        <Input
          id="clip-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="AI, デザイン"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clip-status">公開状態</Label>
        <Select
          id="clip-status"
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
          <Link href="/clips/" className="underline">
            Clips を見る
          </Link>
          {isEdit ? null : (
            <>
              {" · "}
              <Link href={`/admin/clips/${ok.slug}/edit/`} className="underline">
                続けて編集
              </Link>
            </>
          )}
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : isEdit ? "更新する" : "クリップする"}
        </Button>
        {isEdit ? (
          <Button asChild type="button" variant="outline">
            <Link href="/admin/clips/">一覧へ戻る</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
