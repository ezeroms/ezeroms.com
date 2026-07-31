"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const GIANTS_EDITOR_FORM_ID = "giants-editor-form";

export type GiantsEditorInitial = {
  slug: string;
  body_md: string;
  topics: string;
  book_title: string;
  author: string;
  publisher: string;
  published_year: string;
  citation_override: string;
  source_url: string;
  og_image: string;
  status: "published" | "draft";
};

export function GiantsEditorForm({
  initial,
  formId = GIANTS_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: GiantsEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => ({
    bodyMd: initial?.body_md ?? "",
    topics: initial?.topics ?? "",
    bookTitle: initial?.book_title ?? "",
    author: initial?.author ?? "",
    publisher: initial?.publisher ?? "",
    publishedYear: initial?.published_year ?? "",
    citationOverride: initial?.citation_override ?? "",
    sourceUrl: initial?.source_url ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [topics, setTopics] = useState(baseline.topics);
  const [bookTitle, setBookTitle] = useState(baseline.bookTitle);
  const [author, setAuthor] = useState(baseline.author);
  const [publisher, setPublisher] = useState(baseline.publisher);
  const [publishedYear, setPublishedYear] = useState(baseline.publishedYear);
  const [citationOverride, setCitationOverride] = useState(
    baseline.citationOverride,
  );
  const [sourceUrl, setSourceUrl] = useState(baseline.sourceUrl);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    bodyMd !== baseline.bodyMd ||
    topics !== baseline.topics ||
    bookTitle !== baseline.bookTitle ||
    author !== baseline.author ||
    publisher !== baseline.publisher ||
    publishedYear !== baseline.publishedYear ||
    citationOverride !== baseline.citationOverride ||
    sourceUrl !== baseline.sourceUrl ||
    ogImage !== baseline.ogImage ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading) return;
    setError(null);
    setLoading(true);
    try {
      const payload = {
        body_md: bodyMd,
        topics,
        book_title: bookTitle,
        author,
        publisher,
        published_year: publishedYear,
        citation_override: citationOverride,
        source_url: sourceUrl,
        og_image: ogImage,
        status,
      };
      const res = await fetch(
        isEdit
          ? `/api/admin/giants/${initial!.slug}/`
          : "/api/admin/giants/",
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
        <Label htmlFor="giants-body">引用本文</Label>
        <AdminRichTextEditor
          id="giants-body"
          value={bodyMd}
          onChange={setBodyMd}
          placeholder="引用・メモを入力…"
          minHeightClassName="min-h-[160px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="giants-topics">トピック（カンマ区切り）</Label>
        <Input
          id="giants-topics"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="暇, 労働, …"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="giants-author">著者</Label>
          <Input
            id="giants-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="國分功一郎"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="giants-book-title">書名</Label>
          <Input
            id="giants-book-title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="暇と退屈の倫理学"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="giants-publisher">出版社</Label>
          <Input
            id="giants-publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="新潮社"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="giants-year">出版年</Label>
          <Input
            id="giants-year"
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
            placeholder="2021"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="giants-citation-override">書誌の上書き（任意）</Label>
        <Textarea
          id="giants-citation-override"
          value={citationOverride}
          onChange={(e) => setCitationOverride(e.target.value)}
          placeholder="空なら「著者『書名』（出版社、年）」を自動生成"
          className="min-h-[72px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="giants-source-url">購入リンク（任意）</Label>
        <Input
          id="giants-source-url"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://…（Amazon / 出版社など）"
        />
        <p className="m-0 text-xs text-muted-foreground">
          Amazon の短縮URL（amzn.asia など）は保存時に{" "}
          <code className="text-xs">amazon.co.jp/dp/…</code>{" "}
          へ正規化し、公開時に Settings のアフィリエイト ID
          を付与します。出版社サイトなど非 Amazon
          のリンクはそのまま保存され、アフィリエイトは付きません。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="giants-status">公開状態</Label>
          <Select
            id="giants-status"
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

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="giants"
      />

      {!hideSubmit ? (
        <button type="submit" className="sr-only" tabIndex={-1}>
          保存
        </button>
      ) : null}
    </form>
  );
}
