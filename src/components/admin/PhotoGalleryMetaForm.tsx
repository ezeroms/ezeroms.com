"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  PhotoGalleryId,
  PhotoGalleryStatus,
} from "@/lib/content/photo-galleries";

export const PHOTO_GALLERY_META_FORM_ID = "photo-gallery-meta-form";


type Props = {
  galleryId: PhotoGalleryId;
  initialLabel: string;
  initialDescription: string;
  initialStatus?: PhotoGalleryStatus;
  initialOgImage?: string;
  /** 保存成功時（モーダルを閉じるなど） */
  onSaved?: () => void;
  /** 送信中フラグの変化（フッターボタン用） */
  onLoadingChange?: (loading: boolean) => void;
  /** フォーム内の送信ボタンを出さない（フッターに置く場合） */
  hideSubmit?: boolean;
  formId?: string;
};

/** ギャラリーの表示名・説明文・公開状態・OGP を編集する。 */
export function PhotoGalleryMetaForm({
  galleryId,
  initialLabel,
  initialDescription,
  initialStatus = "published",
  initialOgImage = "",
  onSaved,
  onLoadingChange,
  hideSubmit = false,
  formId = PHOTO_GALLERY_META_FORM_ID,
}: Props) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<PhotoGalleryStatus>(initialStatus);
  const [ogImage, setOgImage] = useState(initialOgImage);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function setLoadingState(next: boolean) {
    setLoading(next);
    onLoadingChange?.(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoadingState(true);
    try {
      const res = await fetch(`/api/admin/photos/${galleryId}/meta/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          description,
          status,
          og_image: ogImage,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      setSaved(true);
      router.refresh();
      onSaved?.();
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoadingState(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      {...ignorePasswordManagersProps}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {saved ? <Alert variant="success">ページ設定を保存しました</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="gallery-label">表示名</Label>
        <Input
          id="gallery-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gallery-description">説明文</Label>
        <Textarea
          id="gallery-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="公開ページの ? アイコンで表示される説明"
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gallery-status">ステータス</Label>
        <Select
          id="gallery-status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value === "private" ? "private" : "published")
          }
          {...ignorePasswordManagersProps}
        >
          <option value="published">公開</option>
          <option value="private">非公開</option>
        </Select>
      </div>

      <OgImageField
        id="gallery-og-image"
        value={ogImage}
        onChange={setOgImage}
        uploadKind={`photo-${galleryId}`}
        disabled={loading}
      />

      {!hideSubmit ? (
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中…" : "設定を保存"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
