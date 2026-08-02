import { renderSearchPage } from "@/lib/site/render-search-page";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderSearchPage("clips", searchParams);
}
