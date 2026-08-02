import { AboutBasedInSection } from "@/components/admin/AboutBasedInSection";
import { AboutFavoritesSection } from "@/components/admin/AboutFavoritesSection";
import {
  AboutProfileEditor,
  type AboutProfileEditorInitial,
} from "@/components/admin/AboutProfileEditor";
import { AboutWebLinksSection } from "@/components/admin/AboutWebLinksSection";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminMePage() {
  await getSessionUser();

  let loadError: string | null = null;
  let profile: AboutProfileEditorInitial | null = null;
  let favorites: { id: string; label: string; sort_order: number }[] = [];
  let basedIn: {
    id: string;
    location: string;
    body_md: string;
    sort_order: number;
  }[] = [];
  let webLinks: {
    id: string;
    label: string;
    url: string;
    sort_order: number;
  }[] = [];

  if (!hasSupabaseConfig()) {
    loadError = "Supabase が設定されていません";
  } else {
    const sb = getSupabaseAdmin();
    const [profileRes, favRes, basedRes, linkRes] = await Promise.all([
      sb
        .from("about_profile")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      sb
        .from("about_favorite")
        .select("id, label, sort_order")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
      sb
        .from("about_based_in")
        .select("id, location, body_md, body_html, sort_order")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
      sb
        .from("about_web_link")
        .select("id, label, url, sort_order")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
    ]);

    if (profileRes.error || favRes.error || basedRes.error || linkRes.error) {
      const msg =
        profileRes.error?.message ||
        favRes.error?.message ||
        basedRes.error?.message ||
        linkRes.error?.message ||
        "読み込みに失敗しました";
      loadError = /does not exist|schema cache/i.test(msg)
        ? "about_* テーブルが未作成です。supabase/migrations/20260719140000_about_me_profile.sql を適用してください。"
        : msg;
    } else {
      if (profileRes.data) {
        const row = profileRes.data as Record<string, unknown>;
        const bioMd =
          String(row.bio_md ?? "").trim() ||
          htmlToEditableMarkdown(String(row.bio_html ?? ""));
        profile = {
          id: String(row.id),
          name: String(row.name ?? "ezeroms"),
          sub_name: String(row.sub_name ?? ""),
          bio_md: bioMd,
          cover_image: String(
            row.cover_image ?? "/images/about/profile.webp",
          ),
          og_image: String(row.og_image ?? ""),
        };
      }
      favorites = (favRes.data ?? []) as typeof favorites;
      basedIn = ((basedRes.data ?? []) as Record<string, unknown>[]).map(
        (row) => ({
          id: String(row.id),
          location: String(row.location ?? ""),
          body_md:
            String(row.body_md ?? "").trim() ||
            htmlToEditableMarkdown(String(row.body_html ?? "")),
          sort_order: Number(row.sort_order ?? 0),
        }),
      );
      webLinks = (linkRes.data ?? []) as typeof webLinks;
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader title="Me" />

      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <AboutProfileEditor initial={profile} />
          </CardContent>
        </Card>

        {!loadError ? (
          <>
            <AboutFavoritesSection items={favorites} />
            <AboutBasedInSection items={basedIn} />
            <AboutWebLinksSection items={webLinks} />
          </>
        ) : null}
      </div>
    </AdminContent>
  );
}
