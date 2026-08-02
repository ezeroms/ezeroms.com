"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  filenameFromImageUrl,
  slugFromFilename,
} from "@/lib/media/photo-name";
import { cn } from "@/lib/cn";

export const TOP_IMAGE_EDITOR_FORM_ID = "top-image-editor-form";

export type TopImageEditorInitial = {
  slug: string;
  filename: string;
  image_url: string;
  alt: string;
  location: string;
  captured_year: string;
  sort_order: string;
  status: "published" | "draft";
};

export function TopImageEditorForm({
  initial,
  formId = TOP_IMAGE_EDITOR_FORM_ID,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: TopImageEditorInitial;
  formId?: string;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => {
    const filename =
      initial?.filename?.trim() ||
      (initial?.image_url ? filenameFromImageUrl(initial.image_url) : "");
    return {
      filename,
      slug: initial?.slug ?? "",
      imageUrl: initial?.image_url ?? "",
      alt: initial?.alt ?? "Random Image",
      location: initial?.location ?? "",
      capturedYear: initial?.captured_year ?? "",
      sortOrder: initial?.sort_order ?? "0",
      status: (initial?.status ?? "published") as "published" | "draft",
    };
  });

  const autoFromFilename = slugFromFilename(baseline.filename);

  const [filename, setFilename] = useState(baseline.filename);
  const [slug, setSlug] = useState(baseline.slug);
  const [slugManual, setSlugManual] = useState(
    Boolean(
      baseline.slug &&
        autoFromFilename &&
        baseline.slug !== autoFromFilename,
    ),
  );
  const [imageUrl, setImageUrl] = useState(baseline.imageUrl);
  const [alt, setAlt] = useState(baseline.alt);
  const [location, setLocation] = useState(baseline.location);
  const [capturedYear, setCapturedYear] = useState(baseline.capturedYear);
  const [sortOrder, setSortOrder] = useState(baseline.sortOrder);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dirty =
    filename !== baseline.filename ||
    slug !== baseline.slug ||
    imageUrl !== baseline.imageUrl ||
    alt !== baseline.alt ||
    location !== baseline.location ||
    capturedYear !== baseline.capturedYear ||
    sortOrder !== baseline.sortOrder ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading || uploading);
  }, [loading, uploading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function applyFilename(nextFilename: string) {
    setFilename(nextFilename);
    const nextSlug = slugFromFilename(nextFilename);
    if (!nextSlug) return;
    if (!slugManual) setSlug(nextSlug);
  }

  function pickImageFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    void uploadImage(file);
  }

  function clearImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (uploading || loading) return;
    setImageUrl("");
    setFilename("");
    if (!slugManual) setSlug("");
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  }

  async function uploadImage(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/top-images/upload/", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        image_url?: string;
        path?: string;
        file_id?: string;
      };
      if (!res.ok) {
        setError(data.error || "画像のアップロードに失敗しました");
        return;
      }
      if (data.image_url) setImageUrl(data.image_url);
      const confirmedName =
        (data.path ? data.path.split("/").pop() : null) ||
        (data.file_id
          ? `${data.file_id}.jpg`
          : data.image_url
            ? filenameFromImageUrl(data.image_url)
            : "");
      if (confirmedName) applyFilename(confirmedName);
    } catch {
      setError("アップロード中に通信エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading || uploading) return;
    setError(null);
    setLoading(true);
    try {
      const yearTrim = capturedYear.trim();
      const payload = {
        slug: slug.trim(),
        image_url: imageUrl,
        alt,
        location,
        captured_year: yearTrim === "" ? null : yearTrim,
        sort_order: sortOrder.trim() === "" ? 0 : Number(sortOrder),
        status,
      };
      const res = await fetch(
        isEdit
          ? `/api/admin/top-images/${initial!.slug}/`
          : "/api/admin/top-images/",
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
      if (!data.item?.slug) {
        setError("保存結果が不正です");
        return;
      }
      router.refresh();
      onSaved?.();
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="top-image-file">画像</Label>
        <input
          ref={fileRef}
          id="top-image-file"
          type="file"
          accept="image/*,.heic,.heif,image/heic,image/heif"
          className="sr-only"
          disabled={uploading || loading}
          onChange={(e) => {
            pickImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={uploading || loading ? -1 : 0}
          aria-controls="top-image-file"
          aria-label="画像をアップロード"
          aria-disabled={uploading || loading}
          onClick={() => {
            if (uploading || loading) return;
            fileRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (uploading || loading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !loading) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !loading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (uploading || loading) return;
            pickImageFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-solid border-border bg-card px-6 py-8 text-center shadow-none transition-colors",
            "hover:border-border-hover",
            dragOver && "border-border-hover",
            (uploading || loading) && "pointer-events-none opacity-60",
          )}
        >
          {imageUrl ? (
            <>
              <button
                type="button"
                className={cn(
                  "share-btn absolute right-2 top-2 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
                  "cursor-pointer text-foreground transition-[opacity,background-color]",
                  "opacity-30 hover:bg-accent hover:opacity-100",
                  "disabled:pointer-events-none disabled:opacity-20",
                )}
                aria-label="画像を削除"
                disabled={uploading || loading}
                onClick={clearImage}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="m-0 max-h-56 w-full object-contain"
              />
              <p className="mb-0 mt-4 text-sm text-muted-foreground">
                {uploading
                  ? "アップロード中…"
                  : "クリックまたはドロップで差し替え"}
              </p>
            </>
          ) : (
            <>
              <Upload
                className="mb-3 size-8 text-muted-foreground"
                aria-hidden
              />
              <p className="m-0 text-sm font-medium text-foreground">
                画像をドラッグ＆ドロップ
              </p>
              <p className="mb-0 mt-1 text-sm text-muted-foreground">
                またはクリックしてファイルを選択
              </p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="top-image-filename">ファイル名</Label>
        <Input
          id="top-image-filename"
          value={filename}
          onChange={(e) => applyFilename(e.target.value)}
          onBlur={() => {
            const trimmed = filename.trim();
            if (trimmed) applyFilename(trimmed);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="top-image-slug">スラッグ</Label>
        <Input
          id="top-image-slug"
          value={slug}
          onChange={(e) => {
            setSlugManual(true);
            setSlug(e.target.value);
          }}
          required
          pattern="[A-Za-z0-9_-]+"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="top-image-location">場所</Label>
          <Input
            id="top-image-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: Sado"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="top-image-year">年</Label>
          <Input
            id="top-image-year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            value={capturedYear}
            onChange={(e) => setCapturedYear(e.target.value)}
            placeholder="例: 2013"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="top-image-sort">表示順</Label>
          <Input
            id="top-image-sort"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="top-image-status">ステータス</Label>
          <Select
            id="top-image-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
          >
            <option value="published">公開</option>
            <option value="draft">非公開</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="top-image-alt">代替テキスト</Label>
        <Input
          id="top-image-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Random Image"
        />
      </div>
    </form>
  );
}
