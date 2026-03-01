-- ═══════════════════════════════════════════
-- AABB Tennis — Supabase Schema
-- Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- COURTS
-- ─────────────────────────────────────────
create table if not exists courts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  surface text not null check (surface in ('clay','hard','grass','synthetic')),
  status text not null default 'available' check (status in ('available','maintenance','inactive')),
  has_lighting boolean default true,
  created_at timestamptz default now()
);

-- Seed courts
insert into courts (name, surface, status, has_lighting) values
  ('Quadra 1 – Saibro', 'clay', 'available', true),
  ('Quadra 2 – Cimento', 'hard', 'available', true),
  ('Quadra 3 – Saibro', 'clay', 'available', false),
  ('Quadra 4 – Grama Sint.', 'synthetic', 'available', true),
  ('Quadra 5 – Saibro', 'clay', 'maintenance', false)
on conflict do nothing;

-- ─────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  member_number text unique not null,
  email text not null,
  phone text,
  status text default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  court_id uuid not null references courts(id) on delete restrict,
  member_id uuid not null references members(id) on delete restrict,
  partner_name text,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  type text default 'casual' check (type in ('casual','doubles','tournament','training')),
  status text default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_court_date on bookings(court_id, booking_date);
create index if not exists idx_bookings_member on bookings(member_id);

-- ─────────────────────────────────────────
-- TOURNAMENTS
-- ─────────────────────────────────────────
create table if not exists tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  modality text not null check (modality in ('singles_men','singles_women','doubles_men','doubles_women','doubles_mixed')),
  format text not null default 'single_elimination' check (format in ('single_elimination','double_elimination','round_robin')),
  max_participants int not null default 16,
  start_date date not null,
  end_date date not null,
  registration_deadline date,
  status text default 'registration' check (status in ('draft','registration','in_progress','completed','cancelled')),
  created_by uuid references members(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- TOURNAMENT REGISTRATIONS
-- ─────────────────────────────────────────
create table if not exists tournament_registrations (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  member_id uuid not null references members(id) on delete restrict,
  partner_name text,
  seed int,
  status text default 'registered' check (status in ('registered','confirmed','withdrawn')),
  registered_at timestamptz default now(),
  unique(tournament_id, member_id)
);

-- ─────────────────────────────────────────
-- TOURNAMENT MATCHES
-- ─────────────────────────────────────────
create table if not exists tournament_matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text not null,
  match_number int not null,
  player1_name text,
  player2_name text,
  player1_id uuid references members(id),
  player2_id uuid references members(id),
  winner_id uuid references members(id),
  winner_name text,
  score text,
  court_id uuid references courts(id),
  scheduled_at timestamptz,
  status text default 'pending' check (status in ('pending','scheduled','in_progress','completed','walkover')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table courts enable row level security;
alter table members enable row level security;
alter table bookings enable row level security;
alter table tournaments enable row level security;
alter table tournament_registrations enable row level security;
alter table tournament_matches enable row level security;

-- Courts: public read
drop policy if exists "courts_select" on courts;
create policy "courts_select" on courts for select using (true);

-- Members: authenticated read, own write
drop policy if exists "members_select" on members;
create policy "members_select" on members for select using (auth.role() = 'authenticated');

drop policy if exists "members_insert" on members;
create policy "members_insert" on members for insert with check (auth.uid() = user_id);

drop policy if exists "members_update" on members;
create policy "members_update" on members for update using (auth.uid() = user_id);

-- Bookings: authenticated read, own write
drop policy if exists "bookings_select" on bookings;
create policy "bookings_select" on bookings for select using (auth.role() = 'authenticated');

drop policy if exists "bookings_insert" on bookings;
create policy "bookings_insert" on bookings for insert with check (
  member_id = (select id from members where user_id = auth.uid())
);

drop policy if exists "bookings_update" on bookings;
create policy "bookings_update" on bookings for update using (
  member_id = (select id from members where user_id = auth.uid())
);

-- Tournaments
drop policy if exists "tournaments_select" on tournaments;
create policy "tournaments_select" on tournaments for select using (auth.role() = 'authenticated');

drop policy if exists "tournaments_insert" on tournaments;
create policy "tournaments_insert" on tournaments for insert with check (auth.role() = 'authenticated');

-- Tournament registrations
drop policy if exists "regs_select" on tournament_registrations;
create policy "regs_select" on tournament_registrations for select using (auth.role() = 'authenticated');

drop policy if exists "regs_insert" on tournament_registrations;
create policy "regs_insert" on tournament_registrations for insert with check (
  member_id = (select id from members where user_id = auth.uid())
);

-- Tournament matches
drop policy if exists "matches_select" on tournament_matches;
create policy "matches_select" on tournament_matches for select using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- SAMPLE TOURNAMENTS
-- ─────────────────────────────────────────
do $$
declare
  t1 uuid := uuid_generate_v4();
  t2 uuid := uuid_generate_v4();
begin
  insert into tournaments (id, name, modality, format, max_participants, start_date, end_date, status, registration_deadline)
  values
    (t1, 'Copa AABB 2025', 'singles_men', 'single_elimination', 16, '2025-03-01', '2025-03-31', 'registration', '2025-02-28'),
    (t2, 'Torneio Duplas Misto', 'doubles_mixed', 'single_elimination', 8, '2025-04-15', '2025-04-30', 'registration', '2025-04-10')
  on conflict do nothing;
end $$;
