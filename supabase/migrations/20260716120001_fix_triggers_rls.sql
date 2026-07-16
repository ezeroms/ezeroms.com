-- Finish triggers + RLS (only if tables already exist)
do $$
declare
  t text;
  trig text;
begin
  foreach t in array array[
    'about', 'media_coverage', 'diary', 'column', 'work',
    'shoulders_of_giants', 'snap', 'chronicle', 'ui_design_guidebook'
  ]
  loop
    trig := t || '_set_updated_at';
    execute format('drop trigger if exists %I on public.%I', trig, t);
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      trig, t
    );
  end loop;
end $$;

alter table public.about enable row level security;
alter table public.media_coverage enable row level security;
alter table public.diary enable row level security;
alter table public."column" enable row level security;
alter table public.work enable row level security;
alter table public.shoulders_of_giants enable row level security;
alter table public.snap enable row level security;
alter table public.chronicle enable row level security;
alter table public.ui_design_guidebook enable row level security;
