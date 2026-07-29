import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminExperienceListTable,
  type AdminExperienceTableItem,
} from "@/components/admin/AdminExperienceListTable";
import { ExperienceCreateButton } from "@/components/admin/ExperienceCreateButton";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { loadWorksSection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminExperienceListPage() {
  await getSessionUser();
  const section = await loadWorksSection("experience");

  let items: AdminExperienceTableItem[] = [];

  if (hasSupabaseConfig()) {
    const { data } = await getSupabaseAdmin()
      .from("experience")
      .select(
        "slug, organization, title, employment_type, role, start_date, end_date, business, employee_count, capital, note, summary, body_html, projects, sort_order, og_image, status",
      )
      .eq("is_deleted", false)
      .order("start_date", { ascending: false })
      .limit(200);

    items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const slug = String(row.slug ?? "");
      const organization = String(row.organization ?? "");
      const title = String(row.title ?? "");
      const status = String(row.status ?? "published");
      const startDate = row.start_date
        ? String(row.start_date).slice(0, 10)
        : "";
      const endDate = row.end_date ? String(row.end_date).slice(0, 10) : null;
      const bodyHtml = (row.body_html as string | null) ?? "";

      return {
        slug,
        organization,
        title,
        start_date: startDate,
        end_date: endDate,
        status,
        editor: {
          slug,
          organization,
          title,
          employment_type: (row.employment_type as string | null) ?? "",
          role: (row.role as string | null) ?? "",
          start_date: startDate,
          end_date: endDate ?? "",
          business: (row.business as string | null) ?? "",
          employee_count: (row.employee_count as string | null) ?? "",
          capital: (row.capital as string | null) ?? "",
          note: (row.note as string | null) ?? "",
          summary: (row.summary as string | null) ?? "",
          body_md: htmlToEditableMarkdown(bodyHtml),
          projects_json: JSON.stringify(row.projects ?? [], null, 2),
          sort_order: String(row.sort_order ?? 0),
          og_image: (row.og_image as string | null) ?? "",
          status: status === "draft" ? "draft" : "published",
        },
      };
    });
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={section.label}
        actions={
          <div className="flex flex-wrap gap-2">
            <WorksSectionSettingsModal
              metaApiPath="/api/admin/works/experience/meta/"
              initialLabel={section.label}
              initialStatus={section.status}
              initialOgImage={section.og_image}
            />
            <ExperienceCreateButton />
          </div>
        }
      />
      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <AdminExperienceListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
