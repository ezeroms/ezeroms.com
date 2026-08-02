import { listColumn, listDiary, listChronicle } from "@/lib/content/queries";

export const revalidate = 60;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezeroms.com";
  const [diary, column, chronicle] = await Promise.all([
    listDiary({ limit: 40 }).catch(() => ({ items: [] })),
    listColumn({ limit: 40 }).catch(() => ({ items: [] })),
    listChronicle().catch(() => ({ items: [] })),
  ]);

  const items: { title: string; link: string; date: string; desc: string }[] =
    [];

  for (const d of diary.items) {
    items.push({
      title: `Notes ${d.date}`,
      link: `${site}/diary/${d.slug}/`,
      date: d.date,
      desc: "",
    });
  }
  for (const c of column.items) {
    items.push({
      title: c.title,
      link: `${site}/column/${c.slug}/`,
      date: c.date,
      desc: "",
    });
  }
  for (const c of chronicle.items.slice(0, 20)) {
    items.push({
      title: c.title,
      link: `${site}/chronicle/${c.slug}/`,
      date: c.date,
      desc: c.description ?? "",
    });
  }

  items.sort((a, b) => (a.date < b.date ? 1 : -1));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>ezeroms.com</title>
<link>${escapeXml(site)}</link>
<description>One thing I can tell you is you got to be free!</description>
${items
  .slice(0, 50)
  .map(
    (i) => `<item>
<title>${escapeXml(i.title)}</title>
<link>${escapeXml(i.link)}</link>
<guid>${escapeXml(i.link)}</guid>
<pubDate>${new Date(i.date).toUTCString()}</pubDate>
<description>${escapeXml(i.desc)}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
