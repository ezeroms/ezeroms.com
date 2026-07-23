"use client";

import {
  FormEvent,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { cn } from "@/lib/cn";

export type AboutProfileEditorInitial = {
  id: string;
  name: string;
  sub_name: string;
  bio_md: string;
  cover_image: string;
};

export function AboutProfileEditor({
  initial,
}: {
  initial: AboutProfileEditorInitial | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [baseline] = useState(() => ({
    id: initial?.id ?? "",
    name: initial?.name ?? "ezeroms",
    sub_name: initial?.sub_name ?? "イワモトユウ",
    bio_md: initial?.bio_md ?? "",
    cover_image: initial?.cover_image ?? "/images/about/profile.webp",
  }));

  const [name, setName] = useState(baseline.name);
  const [subName, setSubName] = useState(baseline.sub_name);
  const [bioMd, setBioMd] = useState(baseline.bio_md);
  const [coverImage, setCoverImage] = useState(baseline.cover_image);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dirty =
    name !== baseline.name ||
    subName !== baseline.sub_name ||
    bioMd !== baseline.bio_md ||
    coverImage !== baseline.cover_image;

  const busy = loading || uploading;

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
    if (busy) return;
    setCoverImage("");
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  }

  async function uploadImage(file: File) {
    setError(null);
    setOk(false);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/about/cover/upload/", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        image_url?: string;
      };
      if (!res.ok) {
        setError(data.error || "画像のアップロードに失敗しました");
        return;
      }
      if (data.image_url) setCoverImage(data.image_url);
    } catch {
      setError("アップロード中に通信エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || busy) return;
    setError(null);
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/about/profile/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: baseline.id || undefined,
          name,
          sub_name: subName,
          bio_md: bioMd,
          cover_image: coverImage,
          status: "published",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok ? <Alert>プロフィールを保存しました</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="about-cover">カバー画像</Label>
        <input
          ref={fileRef}
          id="about-cover"
          type="file"
          accept="image/*,.heic,.heif,image/heic,image/heif"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            pickImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-controls="about-cover"
          aria-label="カバー画像をアップロード"
          aria-disabled={busy}
          onClick={() => {
            if (busy) return;
            fileRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) setDragOver(true);
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
            if (busy) return;
            pickImageFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-solid border-border bg-card px-6 py-8 text-center shadow-none transition-colors",
            "hover:border-border-hover",
            dragOver && "border-border-hover",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {coverImage ? (
            <>
              <button
                type="button"
                className={cn(
                  "share-btn absolute right-2 top-2 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
                  "cursor-pointer text-foreground transition-[opacity,background-color]",
                  "opacity-30 hover:bg-accent hover:opacity-100",
                  "disabled:pointer-events-none disabled:opacity-20",
                )}
                aria-label="カバー画像を削除"
                data-tooltip="削除"
                disabled={busy}
                onClick={clearImage}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
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
                カバー画像をドラッグ＆ドロップ
              </p>
              <p className="mb-0 mt-1 text-sm text-muted-foreground">
                またはクリックしてファイルを選択
              </p>
              {uploading ? (
                <p className="mb-0 mt-3 text-xs text-muted-foreground">
                  アップロード中（メタ削除）…
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="about-name">名前（h1）</Label>
          <Input
            id="about-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="ezeroms"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="about-sub-name">サブネーム</Label>
          <Input
            id="about-sub-name"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="イワモトユウ"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about-bio">紹介文</Label>
        <AdminRichTextEditor
          id="about-bio"
          value={bioMd}
          onChange={setBioMd}
          disabled={busy}
          placeholder="プロフィールの紹介文を入力…"
        />
      </div>

      <div>
        <Button type="submit" disabled={!dirty || busy}>
          {loading ? "保存中…" : "プロフィールを保存"}
        </Button>
      </div>
    </form>
  );
}
