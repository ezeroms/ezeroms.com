-- Here ページを 3 カード（導入 / 権利 / 更新通知）で編集・表示する

alter table public.about
  add column if not exists intro_md text not null default '',
  add column if not exists intro_html text not null default '',
  add column if not exists rights_md text not null default '',
  add column if not exists rights_html text not null default '',
  add column if not exists updates_md text not null default '',
  add column if not exists updates_html text not null default '';

comment on column public.about.intro_md is 'Here: このサイトについて（Markdown）';
comment on column public.about.intro_html is 'Here: このサイトについて（HTML）';
comment on column public.about.rights_md is 'Here: コンテンツの権利（Markdown）';
comment on column public.about.rights_html is 'Here: コンテンツの権利（HTML）';
comment on column public.about.updates_md is 'Here: 更新通知を受け取る（Markdown）';
comment on column public.about.updates_html is 'Here: 更新通知を受け取る（HTML）';
