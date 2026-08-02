-- Amazon アフィリエイト（Associates）タグ。購入リンク本体は各記事の source_url に
-- 汎用 URL を保存し、公開時にこのタグを付与する。空なら付与しない（プログラム離脱時）。

alter table public.site_settings
  add column if not exists amazon_affiliate_tag text not null default '';

comment on column public.site_settings.amazon_affiliate_tag is
  'Amazon Associates tracking ID (e.g. ezeroms03-22). Empty = no affiliate params on purchase links.';

update public.site_settings
set amazon_affiliate_tag = 'ezeroms03-22'
where id = 'site'
  and (amazon_affiliate_tag is null or amazon_affiliate_tag = '');
