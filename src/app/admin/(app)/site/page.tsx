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
    ? { og_image: "" }
    : await loadSiteSettings();

  return (
    <AdminContent>
      <AdminPageHeader
        title="Site"
        description="トップページの OGP など、サイト全体の設定"
      />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>デフォルト OGP</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteSettingsForm initialOgImage={settings.og_image} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
