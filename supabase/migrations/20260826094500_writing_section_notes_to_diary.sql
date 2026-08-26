-- writing_section: Notes → Diary

alter table public.writing_section
  drop constraint if exists writing_section_id_check;

update public.writing_section
set
  id = 'diary',
  label = case when label = 'Notes' then 'Diary' else label end,
  description = case
    when description = '日常の短いメモとスナップ。気づきや記録を残す場所です。'
      then '日々のできごとや考えたことの記録。'
    else description
  end
where id = 'notes';

alter table public.writing_section
  add constraint writing_section_id_check
  check (id in ('diary', 'column'));

comment on table public.writing_section is
  'Writing section page settings (Diary / Column): label, status, og_image';
