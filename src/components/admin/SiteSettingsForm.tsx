"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SITE_SETTINGS_FORM_ID = "site-settings-form";

type Props = {
  initialOgImage?: string;
  initialAmazonAffiliateTag?: string;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  hideSubmit?: boolean;
  formId?: string;
};

/** サイト全体（トップ含む）のデフォルト OGP・アフィリエイト設定を編集する。 */
export function SiteSettingsForm({
  initialOgImage = "",
  initialAmazonAffiliateTag = "",
  onSaved,
  onLoadingChange,
  hideSubmit = false,
  formId = SITE_SETTINGS_FORM_ID,
}: Props) {
  const router = useRouter();
  const [ogImage, setOgImage] = useState(initialOgImage);
  const [amazonAffiliateTag, setAmazonAffiliateTag] = useState(
    initialAmazonAffiliateTag,
  );
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
      const res = await fetch("/api/admin/site/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          og_image: ogImage,
          amazon_affiliate_tag: amazonAffiliateTag,
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
      className="flex flex-col gap-8"
      onSubmit={onSubmit}
      {...ignorePasswordManagersProps}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {saved ? <Alert variant="success">サイト設定を保存しました</Alert> : null}

      <div className="flex flex-col gap-4">
        <OgImageField
          id="site-og-image"
          value={ogImage}
          onChange={setOgImage}
          uploadKind="site"
          disabled={loading}
        />

        <p className="m-0 text-sm text-muted-foreground">
          トップページの OGP（SNS
          シェア時の画像）です。未設定のときは静的ファイル{" "}
          <code className="text-xs">/images/common/og-image.png</code>{" "}
          が使われます。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="site-amazon-affiliate-tag">
          Amazon アフィリエイト ID
        </Label>
        <Input
          id="site-amazon-affiliate-tag"
          value={amazonAffiliateTag}
          onChange={(e) => setAmazonAffiliateTag(e.target.value)}
          placeholder="例: ezeroms03-22"
          disabled={loading}
          autoComplete="off"
        />
        <p className="m-0 text-sm text-muted-foreground">
          The shoulders of Giants
          の購入リンクが Amazon のとき、公開ページで自動的に{" "}
          <code className="text-xs">?tag=…</code>{" "}
          を付与します（短縮URLは保存時に商品URLへ正規化済みの想定）。非 Amazon
          のリンクには付与しません。空にするとアフィリエイト付与を止めます。
        </p>
      </div>

      {hideSubmit ? null : (
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中…" : "保存"}
          </Button>
        </div>
      )}
    </form>
  );
}
