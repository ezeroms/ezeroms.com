import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const samples = [
    {
      slug: "clip-test-openai-o3",
      title: "OpenAI announces o3 and o4-mini",
      source_url: "https://openai.com/index/introducing-o3-and-o4-mini/",
      date: new Date("2025-04-16T10:00:00+09:00").toISOString(),
      memo: "推論モデルの次の一手。コストと速度のバランスが実務でどう効くかを見たい。",
      clip_tag: ["AI", "OpenAI"],
      status: "published",
      published_at: new Date("2025-04-16T10:00:00+09:00").toISOString(),
    },
    {
      slug: "clip-test-vercel-fluid",
      title: "Fluid compute on Vercel",
      source_url: "https://vercel.com/blog/fluid-compute",
      date: new Date("2025-03-01T12:00:00+09:00").toISOString(),
      memo: "サーバーレスの課金・スケールの話。個人サイトでも意識しておくと安心。",
      clip_tag: ["インフラ", "Vercel"],
      status: "published",
      published_at: new Date("2025-03-01T12:00:00+09:00").toISOString(),
    },
    {
      slug: "clip-test-nytimes-design",
      title: "How The New York Times designs for trust",
      source_url: "https://www.nytimes.com/",
      date: new Date("2025-11-20T09:30:00+09:00").toISOString(),
      memo: "出典の信頼性・タイポ・余白。Clips のカード設計の参考メモ。",
      clip_tag: ["デザイン", "メディア"],
      status: "published",
      published_at: new Date("2025-11-20T09:30:00+09:00").toISOString(),
    },
    {
      slug: "clip-test-mdn-popover",
      title: "Popover API - MDN",
      source_url: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API",
      date: new Date("2026-01-08T18:00:00+09:00").toISOString(),
      memo: "ネイティブ popover。管理画面のユーザーメニューにも使えそう。",
      clip_tag: ["Web", "フロントエンド"],
      status: "published",
      published_at: new Date("2026-01-08T18:00:00+09:00").toISOString(),
    },
    {
      slug: "clip-test-draft-sample",
      title: "（下書き）あとで読む候補",
      source_url: "https://example.com/article",
      date: new Date("2026-07-16T22:00:00+09:00").toISOString(),
      memo: "公開前の下書きテスト。一覧には出ない想定。",
      clip_tag: ["テスト"],
      status: "draft",
      published_at: null,
    },
  ];

  const { data, error } = await sb
    .from("clip")
    .upsert(samples, { onConflict: "slug" })
    .select("slug, title, status");

  if (error) {
    console.error("ERROR", error.message);
    process.exit(1);
  }
  console.log("OK", data?.length, "clips");
  for (const row of data ?? []) {
    console.log("-", row.status, row.slug, row.title);
  }
}

main();
