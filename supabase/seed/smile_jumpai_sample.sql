-- Sample Smile / Jampai rows
-- 1) Run supabase/migrations/20260717100000_smile_jumpai.sql first
-- 2) Then this file, or: npm run migrate:smile && npm run migrate:jumpai

insert into public.smile (
  slug, title, date, location, camera, image_url, photo_tag, body_html, status, published_at
) values
(
  'koenji-afternoon', '高円寺の午後', '2025-11-08T14:20:00Z', '高円寺, Tokyo', 'Pixel',
  '/images/top/12.webp', array['街','東京'],
  '<p>近所を歩いているときに切り取った光。いつもの景色が、少しだけ違って見えた。</p><p><img src="/images/top/12.webp" alt="高円寺の午後" /></p>',
  'published', '2025-11-08T14:20:00Z'
),
(
  'kannai-window', '関内の窓', '2025-09-22T11:05:00Z', '関内, Yokohama', 'Pixel',
  '/images/top/18.webp', array['横浜','建築'],
  '<p>オフィス近くで見つけた窓の反射。都市の境界がやわらかく溶ける瞬間。</p><p><img src="/images/top/18.webp" alt="関内の窓" /></p>',
  'published', '2025-09-22T11:05:00Z'
),
(
  'green-room', '緑のルーム', '2025-05-24T07:30:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-24/greenroom.png', array['室内','緑'],
  '<p>朝の光が差し込むグリーンルーム。静かな時間が滞留している。</p><p><img src="/images/diary/2025-05-24/greenroom.png" alt="緑のルーム" /></p>',
  'published', '2025-05-24T07:30:00Z'
),
(
  'fire-and-shadow', '火と影', '2025-05-24T20:15:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-24/fire.jpg', array['夜','火'],
  '<p>夜の火のゆらぎ。輪郭がほどけて、ただ温度だけが残る。</p><p><img src="/images/diary/2025-05-24/fire.jpg" alt="火と影" /></p>',
  'published', '2025-05-24T20:15:00Z'
),
(
  'may-sky', '五月の空', '2025-05-19T16:40:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-19/ycxsxmfg8tjhbbff.jpg', array['空','季節'],
  '<p>風が強い日の空。雲の隙間から落ちる光を待っていた。</p><p><img src="/images/diary/2025-05-19/ycxsxmfg8tjhbbff.jpg" alt="五月の空" /></p>',
  'published', '2025-05-19T16:40:00Z'
),
(
  'alley-color', '路地の色', '2025-05-18T08:05:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-18/pxl_20250518_075849752.jpg', array['街','朝'],
  '<p>朝の路地。誰もいない時間帯の色だけを持ち帰った。</p><p><img src="/images/diary/2025-05-18/pxl_20250518_075849752.jpg" alt="路地の色" /></p>',
  'published', '2025-05-18T08:05:00Z'
)
on conflict (slug) do update set
  title = excluded.title,
  date = excluded.date,
  location = excluded.location,
  camera = excluded.camera,
  image_url = excluded.image_url,
  photo_tag = excluded.photo_tag,
  body_html = excluded.body_html,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

insert into public.jumpai (
  slug, title, date, location, camera, image_url, photo_tag, body_html, status, published_at
) values
(
  'jumpai-01', 'ジャンパイ #01', '2025-12-01T13:10:00Z', 'Tokyo', 'Pixel',
  '/images/top/3.webp', array['ジャンパイ','スナップ'],
  '<p>ジャンパイの一枚。たまたま撮れた瞬間を、そのまま置いておく。</p><p><img src="/images/top/3.webp" alt="ジャンパイ #01" /></p>',
  'published', '2025-12-01T13:10:00Z'
),
(
  'jumpai-02', 'ジャンパイ #02', '2025-10-12T15:45:00Z', 'Yokohama', 'Pixel',
  '/images/top/7.webp', array['ジャンパイ','横浜'],
  '<p>歩いている途中で立ち止まった風景。説明はいらない。</p><p><img src="/images/top/7.webp" alt="ジャンパイ #02" /></p>',
  'published', '2025-10-12T15:45:00Z'
),
(
  'jumpai-03', 'ジャンパイ #03', '2025-08-03T18:20:00Z', 'Tokyo', 'Pixel',
  '/images/top/15.webp', array['ジャンパイ','夕方'],
  '<p>夕暮れのエッジ。色が変わりきる直前の、いちばん好きな時間。</p><p><img src="/images/top/15.webp" alt="ジャンパイ #03" /></p>',
  'published', '2025-08-03T18:20:00Z'
),
(
  'jumpai-04', 'ジャンパイ #04', '2025-05-26T12:21:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-26/pxl_20250526_122121905.jpg', array['ジャンパイ','昼'],
  '<p>昼下がりの断片。ピントより、気配を優先した。</p><p><img src="/images/diary/2025-05-26/pxl_20250526_122121905.jpg" alt="ジャンパイ #04" /></p>',
  'published', '2025-05-26T12:21:00Z'
),
(
  'jumpai-05', 'ジャンパイ #05', '2025-05-17T08:18:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-17/pxl_20250517_081819295.jpg', array['ジャンパイ','朝'],
  '<p>朝の空気のままシャッターを切った。まだ一日が始まっていない感じ。</p><p><img src="/images/diary/2025-05-17/pxl_20250517_081819295.jpg" alt="ジャンパイ #05" /></p>',
  'published', '2025-05-17T08:18:00Z'
),
(
  'jumpai-06', 'ジャンパイ #06', '2025-05-10T16:05:00Z', 'Tokyo', 'Pixel',
  '/images/diary/2025-05-10/pxl_20250510_160558101.jpg', array['ジャンパイ','午後'],
  '<p>午後の光が壁に落ちるところ。ただそれだけ。</p><p><img src="/images/diary/2025-05-10/pxl_20250510_160558101.jpg" alt="ジャンパイ #06" /></p>',
  'published', '2025-05-10T16:05:00Z'
)
on conflict (slug) do update set
  title = excluded.title,
  date = excluded.date,
  location = excluded.location,
  camera = excluded.camera,
  image_url = excluded.image_url,
  photo_tag = excluded.photo_tag,
  body_html = excluded.body_html,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();
