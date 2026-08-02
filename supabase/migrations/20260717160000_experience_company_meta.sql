-- Experience: company meta for resume-style detail
alter table public.experience
  add column if not exists business text;

alter table public.experience
  add column if not exists employee_count text;

alter table public.experience
  add column if not exists capital text;

alter table public.experience
  add column if not exists note text;

comment on column public.experience.business is '事業内容';
comment on column public.experience.employee_count is '従業員数（表示用）';
comment on column public.experience.capital is '資本金（表示用）';
comment on column public.experience.note is '補足（売却・社名変更など）';
comment on column public.experience.projects is
  'JSON array of {title, description?, start_date?, end_date?, role?, team_scale?, tasks?}';
