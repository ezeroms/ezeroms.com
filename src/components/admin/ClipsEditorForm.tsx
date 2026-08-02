"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipYoutubeEmbed } from "@/components/ClipYoutubeEmbed";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseYoutubeVideoId } from "@/lib/content/clip-meta";

function localDatetimeValue(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const CLIPS_EDITOR_FORM_ID = "clips-editor-form";

export type ClipsEditorInitial = {
  slug: string;
  title: string;
  source_url: string;
  source_name: string;
  date: string;
  memo: string;
  tags: string;
  status: "published" | "draft";
  og_image?: string;
  og_description?: string;
};

export function ClipsEditorForm({
  initial,
  formId = CLIPS_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: ClipsEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => ({
    title: initial?.title ?? "",
    sourceUrl: initial?.source_url ?? "",
    sourceName: initial?.source_name ?? "",
    date: initial?.date
      ? localDatetimeValue(new Date(initial.date))
      : localDatetimeValue(),
    memo: initial?.memo ?? "",
    tags: initial?.tags ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
    ogImage: initial?.og_image ?? "",
    ogDescription: initial?.og_description ?? "",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [sourceUrl, setSourceUrl] = useState(baseline.sourceUrl);
  const [sourceName, setSourceName] = useState(baseline.sourceName);
  const [date, setDate] = useState(baseline.date);
  const [memo, setMemo] = useState(baseline.memo);
  const [tags, setTags] = useState(baseline.tags);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [ogDescription, setOgDescription] = useState(baseline.ogDescription);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ogLoading, setOgLoading] = useState(false);

  const youtubeId = useMemo(
    () => parseYoutubeVideoId(sourceUrl),
    [sourceUrl],
  );

  const dirty =
    title !== baseline.title ||
    sourceUrl !== baseline.sourceUrl ||
    sourceName !== baseline.sourceName ||
    date !== baseline.date ||
    memo !== baseline.memo ||
    tags !== baseline.tags ||
    status !== baseline.status ||
    ogImage !== baseline.ogImage ||
    ogDescription !== baseline.ogDescription;

  useEffect(() => {
    onLoadingChange?.(loading || ogLoading);
  }, [loading, ogLoading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

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
        siteName?: string;
      };
      if (!res.ok) {
        setError(data.error || "OGP の取得に失敗しました");
        return;
      }
      if (data.image) setOgImage(data.image);
      if (data.description) setOgDescription(data.description);
      if (data.siteName) setSourceName(data.siteName);
      // 明示的な再取得では既存値も上書きする（文字化けしたタイトルが残らないように）
      if (data.title) setTitle(data.title);
      if (!data.image && !data.title && !data.siteName) {
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
    if (!dirty || loading) return;
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title,
        source_url: sourceUrl,
        source_name: sourceName,
        date: new Date(date).toISOString(),
        memo,
        tags,
        status,
        og_image: ogImage,
        og_description: ogDescription,
        refresh_og: isEdit && !ogImage && !youtubeId,
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
      if (data.item?.og_image) setOgImage(data.item.og_image);
      router.refresh();
      onSaved?.();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="clip-url">出典 URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="clip-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…（記事 or YouTube）"
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchOgp()}
            disabled={ogLoading || loading || !sourceUrl.trim()}
          >
            {ogLoading ? "取得中…" : "OGP を取得"}
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          {youtubeId
            ? "YouTube URL を検出したので、公開カードでは埋め込み動画を表示します。"
            : "OGP 取得で画像・タイトル候補・出典名が入ります。"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clip-source-name">出典</Label>
        <Input
          id="clip-source-name"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="メディア名（OGP の site_name）"
        />
        <p className="m-0 text-xs text-muted-foreground">
          一覧・公開カードの出典表示に使います。空ならホスト名（YouTube は
          YouTube）です。
        </p>
      </div>

      {youtubeId ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <ClipYoutubeEmbed videoId={youtubeId} title={title || "YouTube"} />
        </div>
      ) : ogImage ? (
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

      <div className="space-y-2">
        <Label htmlFor="clip-title">タイトル</Label>
        <Input
          id="clip-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={youtubeId ? "動画タイトル" : "記事タイトル"}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clip-date">メモした日付</Label>
          <Input
            id="clip-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="clip-memo">短いメモ（任意）</Label>
        <Textarea
          id="clip-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="なぜ残したか、要点など（短く）"
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clip-tags">タグ（カンマ区切り）</Label>
        <Input
          id="clip-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="AI, デザイン"
        />
      </div>

      {!hideSubmit ? (
        <div className="pt-1">
          <Button type="submit" disabled={loading || !dirty}>
            {loading ? "保存中…" : isEdit ? "更新" : "追加"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
