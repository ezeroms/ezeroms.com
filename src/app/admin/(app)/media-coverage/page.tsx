import Link from "next/link";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SectionPageSettingsModal } from "@/components/admin/SectionPageSettingsModal";
import { Button } from "@/components/ui/button";
import { flattenAdminNav } from "@/lib/admin/nav";
import { loadLibrarySection } from "@/lib/content/queries";
import { requireAdminPage } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

const navItem = flattenAdminNav().find(
  (i) => i.href === "/admin/media-coverage/",
)!;

export default async function AdminMediaCoveragePage() {
  await requireAdminPage();
  const section = await loadLibrarySection("media-coverage");

  return (
    <AdminContent>
      <AdminPageHeader
        title={section.label}
        description={navItem.description}
        actions={
          <SectionPageSettingsModal
            metaApiPath="/api/admin/library/media-coverage/meta/"
            initialLabel={section.label}
            initialDescription={section.description}
            initialStatus={section.status}
            initialOgImage={section.og_image}
          />
        }
      />
      <AdminComingSoon>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/workspace/">Workspace へ</Link>
          </Button>
        </div>
      </AdminComingSoon>
    </AdminContent>
  );
}
