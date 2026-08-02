import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadSiteSettings } from "@/lib/content/queries/site-settings";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  await getSessionUser();

  const loadError = !hasSupabaseConfig()
    ? "Supabase が設定されていません（.env.local を確認してください）"
    : null;

  const settings = loadError
    ? { og_image: "", amazon_affiliate_tag: "" }
    : await loadSiteSettings();

  return (
    <AdminContent>
      <AdminPageHeader
        title="Settings"
        description="トップページの OGP や Amazon アフィリエイトなど、サイト全体の設定"
      />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>サイト設定</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteSettingsForm
            initialOgImage={settings.og_image}
            initialAmazonAffiliateTag={settings.amazon_affiliate_tag}
          />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
