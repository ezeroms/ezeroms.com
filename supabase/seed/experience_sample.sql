-- Sample Experience rows (run after 20260717130000_experience.sql)
-- Or: npx tsx scripts/migrate-to-supabase/index.ts experience

insert into public.experience (
  slug, organization, employment_type, title, role,
  start_date, end_date, summary, body_html, projects, sort_order,
  status, published_at
) values
(
  'chooning-inc',
  'チューニング株式会社',
  '代表取締役',
  '代表',
  'プロダクトデザイン・開発',
  '2020-01-01',
  null,
  'Chooning をはじめとするプロダクトの企画・デザイン・開発。',
  '<p>デザインとエンジニアリングの両面から、プロダクトをつくり続けています。横浜・関内にオフィスを構えています。</p>',
  '[{"title":"Chooning","description":"音楽への思いを記録するアプリ／Web サービス。"},{"title":"Cateras","description":"人事評価制度を支えるプロダクト（協力）。"}]'::jsonb,
  0,
  'published',
  '2020-01-01T00:00:00Z'
),
(
  'bellface',
  'ベルフェイス株式会社',
  '業務委託',
  'プロダクトデザイン',
  'UI / UX デザイン',
  '2019-01-01',
  '2019-12-31',
  'オンライン商談システム bellFace のプロダクトデザインに関わりました。',
  '<p>営業現場で使われる UI の設計と改善に携わりました。</p>',
  '[{"title":"bellFace","description":"オンライン商談・画面共有のプロダクト。"}]'::jsonb,
  5,
  'published',
  '2019-01-01T00:00:00Z'
),
(
  'freelance',
  'フリーランス / 制作協力',
  'フリーランス',
  'デザイナー・フロントエンド',
  'UI デザイン・実装',
  '2018-10-01',
  '2020-12-31',
  'エージェンシー経由のキャンペーンサイトやブランド体験の制作協力。',
  '<p>クライアントワークを中心に、企画から実装まで関わりました。チューニング株式会社設立後も一部並行して続けています。</p>',
  '[{"title":"キャンペーン・ブランドサイト","description":"博報堂プロダクツなどとの制作協力を含む。"},{"title":"POTETO Media 案件","description":"政治・行政系サイトなどのデザイン協力。"}]'::jsonb,
  8,
  'published',
  '2018-10-01T00:00:00Z'
),
(
  'synapse',
  'シナプス株式会社',
  '正社員',
  'デザイナー',
  'プロダクトデザイン',
  '2015-04-01',
  '2018-09-30',
  'オンラインサロン・プラットフォーム Synapse のデザインに携わりました。',
  '<p>Web サービスの UI / UX デザインを担当していました。</p>',
  '[{"title":"Synapse","description":"オンラインサロン・プラットフォームの UI / UX。"}]'::jsonb,
  10,
  'published',
  '2015-04-01T00:00:00Z'
)
on conflict (slug) do update set
  organization = excluded.organization,
  employment_type = excluded.employment_type,
  title = excluded.title,
  role = excluded.role,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  summary = excluded.summary,
  body_html = excluded.body_html,
  projects = excluded.projects,
  sort_order = excluded.sort_order,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();
