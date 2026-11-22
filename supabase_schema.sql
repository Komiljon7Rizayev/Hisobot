-- Supabase SQL Editor'da bir marta ishga tushiriladi.
create table if not exists public.employees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    text default '',
  task        text default '',
  percent     int  not null default 0 check (percent between 0 and 100),
  photo       text default '',           -- 256px JPEG data-URL
  updated_at  timestamptz not null default now()
);

alter table public.employees enable row level security;

-- HOZIRCHA: kalitni bilgan har bir kompyuter o'qiy va yoza oladi.
-- Keyingi bosqichda login (admin / hodim) qo'shilganda bu siyosatlar toraytiriladi.
create policy "read all"   on public.employees for select using (true);
create policy "insert all" on public.employees for insert with check (true);
create policy "update all" on public.employees for update using (true);
create policy "delete all" on public.employees for delete using (true);

-- Jonli yangilanish (bir kompyuterdagi o'zgarish boshqalarida darhol ko'rinadi)
alter publication supabase_realtime add table public.employees;
