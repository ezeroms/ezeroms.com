"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export const WORKS_SECTION_META_FORM_ID = "works-section-meta-form";

const IGNORE_PASSWORD_MANAGERS = {
  "data-1p-ignore": true,
  "data-lpignore": "true",
  autoComplete: "off",
} as const;

export type SectionPublishStatus = "published" | "private";

type Props = {
  /** PATCH 先（例: /api/admin/works/creative/meta/） */
  metaApiPath: string;
  initialLabel: string;
  initialStatus?: SectionPublishStatus;
  initialOgImage?: string;
  /** OgImageField の upload kind */
  ogUploadKind?: string;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  hideSubmit?: boolean;
  formId?: string;
};

/** セクションの表示名・公開状態・OGP を編集する（Works / Library / Writing 共通）。 */
export function WorksSectionMetaForm({
  metaApiPath,
  initialLabel,
  initialStatus = "published",
  initialOgImage = "",
  ogUploadKind = "section",
  onSaved,
  onLoadingChange,
  hideSubmit = false,
  formId = WORKS_SECTION_META_FORM_ID,
}: Props) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
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
        body: JSON.stringify({ label, status, og_image: ogImage }),
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
      autoComplete="off"
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {saved ? <Alert variant="success">ページ設定を保存しました</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="works-section-label">表示名</Label>
        <Input
          id="works-section-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          {...IGNORE_PASSWORD_MANAGERS}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="works-section-status">ステータス</Label>
        <Select
          id="works-section-status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value === "private" ? "private" : "published")
          }
          {...IGNORE_PASSWORD_MANAGERS}
        >
          <option value="published">公開</option>
          <option value="private">非公開</option>
        </Select>
      </div>

      <OgImageField
        id="works-section-og-image"
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
