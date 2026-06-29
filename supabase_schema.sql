-- ============================================================
--  Gestão de Grupos da Igreja — Schema Supabase
--  Cole tudo no SQL Editor do Supabase e execute (Run).
-- ============================================================

-- 1. GRUPOS
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  points      integer not null default 0, -- não usado mais (pontuação é calculada)
  created_at  timestamptz not null default now()
);

-- 2. PESSOAS (vinculadas a um grupo)
create table if not exists public.people (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  group_id   uuid references public.groups(id) on delete cascade,
  points     integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. PRESENÇA (status, bíblia e revista de uma pessoa em uma data)
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  date       date not null,
  status     text check (status in ('presente', 'ausente')),
  bible      boolean not null default false,
  booklet    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (person_id, date)
);

-- 4. VISITANTES (cada registro = uma pessoa trouxe 1 visitante em uma data)
create table if not exists public.visitor_events (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now()
);

-- 5. PONTOS DE PERGUNTAS (pontuação direto para o grupo, não para pessoa)
create table if not exists public.quiz_points (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  date       date not null default current_date,
  points     integer not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_people_group     on public.people(group_id);
create index if not exists idx_attendance_dt     on public.attendance(date);
create index if not exists idx_visitor_person    on public.visitor_events(person_id);
create index if not exists idx_visitor_dt        on public.visitor_events(date);
create index if not exists idx_quiz_group        on public.quiz_points(group_id);

-- ============================================================
--  ROW LEVEL SECURITY
--  Apenas usuários autenticados (os admins) podem ler/escrever.
-- ============================================================
alter table public.groups         enable row level security;
alter table public.people         enable row level security;
alter table public.attendance     enable row level security;
alter table public.visitor_events enable row level security;
alter table public.quiz_points    enable row level security;

-- groups
create policy "admins read groups"   on public.groups
  for select to authenticated using (true);
create policy "admins write groups"  on public.groups
  for all to authenticated using (true) with check (true);

-- people
create policy "admins read people"   on public.people
  for select to authenticated using (true);
create policy "admins write people"  on public.people
  for all to authenticated using (true) with check (true);

-- attendance
create policy "admins read attendance"  on public.attendance
  for select to authenticated using (true);
create policy "admins write attendance" on public.attendance
  for all to authenticated using (true) with check (true);

-- visitor_events
create policy "admins read visitor_events"  on public.visitor_events
  for select to authenticated using (true);
create policy "admins write visitor_events" on public.visitor_events
  for all to authenticated using (true) with check (true);

-- quiz_points
create policy "admins read quiz_points"  on public.quiz_points
  for select to authenticated using (true);
create policy "admins write quiz_points" on public.quiz_points
  for all to authenticated using (true) with check (true);

-- ============================================================
--  PONTUAÇÃO DO GRUPO (calculada pelo app, não armazenada)
--  Presença: +10  |  Ausência: -10  |  Bíblia: +1  |  Revista: +1
--  Visitante trazido: +100  |  Pergunta acertada: pontos lançados manualmente
-- ============================================================

-- ============================================================
--  ADMINS
--  Não há tabela de admins: cada admin é um usuário do
--  Supabase Auth. Crie de 2 a 5 contas em
--  Authentication > Users > Add user, OU deixe que se
--  cadastrem pela tela de "Criar conta" do app.
--  (Para travar cadastros abertos, desative "Allow new
--   sign-ups" em Authentication > Providers > Email.)
-- ============================================================
