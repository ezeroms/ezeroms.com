import Link from "next/link";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { flattenAdminNav } from "@/lib/admin/nav";
import { loadLibrarySection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

const navItem = flattenAdminNav().find((i) => i.href === "/admin/chronicle/")!;

export default async function AdminChroniclePage() {
  await getSessionUser();
  const section = await loadLibrarySection("chronicle");

  return (
    <AdminContent>
      <AdminPageHeader
        title={section.label}
        description={navItem.description}
        actions={
          <WorksSectionSettingsModal
            metaApiPath="/api/admin/library/chronicle/meta/"
            initialLabel={section.label}
            initialStatus={section.status}
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>準備中</CardTitle>
          <CardDescription>
            このセクションの編集 UI はこれから実装します。公開／非公開は上の「編集」から設定できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/">ダッシュボードへ</Link>
          </Button>
        </CardContent>
      </Card>
    </AdminContent>
  );
}
