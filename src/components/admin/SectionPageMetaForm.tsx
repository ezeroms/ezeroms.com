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

export const SECTION_PAGE_META_FORM_ID = "section-page-meta-form";


export type SectionPublishStatus = "published" | "private";

type Props = {
  /** PATCH 先（例: /api/admin/library/clips/meta/） */
  metaApiPath: string;
  initialLabel: string;
  /** 一覧ページの OGP description */
  initialDescription?: string;
  initialStatus?: SectionPublishStatus;
  initialOgImage?: string;
  /** OgImageField の upload kind */
  ogUploadKind?: string;
  /** OGP 説明文の下に出す補足（Photo の「? アイコン」など） */
  descriptionHelp?: string;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  hideSubmit?: boolean;
  formId?: string;
};

/** セクションのタイトル・説明文・公開状態・OGP を編集する。 */
export function SectionPageMetaForm({
  metaApiPath,
  initialLabel,
  initialDescription = "",
  initialStatus = "published",
  initialOgImage = "",
  ogUploadKind = "section",
  descriptionHelp,
  onSaved,
  onLoadingChange,
  hideSubmit = false,
  formId = SECTION_PAGE_META_FORM_ID,
}: Props) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<SectionPublishStatus>(initialStatus);
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
      const res = await fetch(metaApiPath, {
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
        <Label htmlFor="section-page-label">タイトル</Label>
        <Input
          id="section-page-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          {...ignorePasswordManagersProps}
        />
        <p className="m-0 text-xs text-muted-foreground">
          ナビ・パンくず・OGP のタイトルに使います。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-page-description">OGP 説明文</Label>
        <Textarea
          id="section-page-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="SNS や検索結果に出る説明文"
          {...ignorePasswordManagersProps}
        />
        {descriptionHelp ? (
          <p className="m-0 text-xs text-muted-foreground">{descriptionHelp}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-page-status">ステータス</Label>
        <Select
          id="section-page-status"
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
        id="section-page-og-image"
        value={ogImage}
        onChange={setOgImage}
        uploadKind={ogUploadKind}
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
