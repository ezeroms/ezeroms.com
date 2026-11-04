-- Me の Favorite things / Based in を about_profile 本文へ取り込み、専用テーブルを削除する。

do $$
declare
  fav_md text;
  fav_html text;
  based_md text;
  based_html text;
  extra_md text := '';
  extra_html text := '';
  rec record;
  first_based boolean := true;
begin
  if to_regclass('public.about_favorite') is not null then
    select string_agg(label, '、' order by sort_order)
    into fav_md
    from public.about_favorite
    where is_deleted = false;

    if fav_md is not null and fav_md <> '' then
      extra_md := extra_md || E'\n\n## 😍 Favorite things\n\n' || fav_md;
      extra_html := extra_html
        || '<h2>😍 Favorite things</h2><p>'
        || replace(replace(replace(fav_md, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
        || '</p>';
    end if;
  end if;

  if to_regclass('public.about_based_in') is not null then
    select string_agg(
      '- **' || location || '**'
        || case
          when trim(body_md) <> '' then '：' || trim(body_md)
          else ''
        end,
      E'\n' order by sort_order
    )
    into based_md
    from public.about_based_in
    where is_deleted = false;

    based_html := '';
    for rec in
      select location, body_html, body_md
      from public.about_based_in
      where is_deleted = false
      order by sort_order
    loop
      if first_based then
        based_html := '<h2>🏠 Based in</h2><ul>';
        first_based := false;
      end if;
      based_html := based_html
        || '<li><strong>'
        || replace(replace(replace(rec.location, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
        || '</strong>';
      if trim(coalesce(rec.body_html, '')) <> '' then
        based_html := based_html || '：' || rec.body_html;
      elsif trim(coalesce(rec.body_md, '')) <> '' then
        based_html := based_html
          || '：'
          || replace(replace(replace(trim(rec.body_md), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
      end if;
      based_html := based_html || '</li>';
    end loop;
    if based_html <> '' then
      based_html := based_html || '</ul>';
      extra_md := extra_md || E'\n\n## 🏠 Based in\n\n' || coalesce(based_md, '');
      extra_html := extra_html || based_html;
    end if;
  end if;

  if extra_md <> '' then
    update public.about_profile
    set
      bio_md = trim(both E'\n' from bio_md || extra_md),
      bio_html = trim(bio_html) || extra_html,
      updated_at = now()
    where is_deleted = false
      and bio_md not ilike '%Favorite things%'
      and bio_html not ilike '%Favorite things%';
  end if;
end $$;

drop trigger if exists about_favorite_set_updated_at on public.about_favorite;
drop trigger if exists about_based_in_set_updated_at on public.about_based_in;
drop table if exists public.about_favorite;
drop table if exists public.about_based_in;
