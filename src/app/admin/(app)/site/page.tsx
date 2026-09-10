import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { Alert } from "@/components/ui/alert";
import { loadSiteSettings } from "@/lib/content/queries/site-settings";
import { requireAdminPage } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  await requireAdminPage();

  const loadError = !hasSupabaseConfig()
    ? "Supabase が設定されていません（.env.local を確認してください）"
    : null;

  const settings = loadError
    ? { og_image: "" }
    : await loadSiteSettings();

  return (
    <AdminContent>
      <AdminPageHeader
        title="Settings"
        description="トップページの OGP など、サイト全体の設定"
      />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      <SiteSettingsForm
        initialOgImage={settings.og_image}
      />
    </AdminContent>
  );
}
