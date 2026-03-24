-- 001_initial_schema.sql
-- Initial database schema for poker application

-- ============================================================================
-- TABLES
-- ============================================================================

-- profiles: linked to Supabase auth.users
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- games: poker game sessions
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid references profiles (id) on delete set null,
  title text not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'active', 'paused', 'completed')),
  max_seats int not null default 8,
  small_blind int not null,
  big_blind int not null,
  min_buy_in int not null,
  max_buy_in int not null,
  chip_value numeric(10, 2) not null default 1.00,
  created_at timestamptz default now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- game_seats: seats within a game
create table if not exists game_seats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games (id) on delete cascade,
  seat_number int not null check (seat_number >= 0 and seat_number < 8),
  user_id uuid references profiles (id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'occupied', 'sitting-out')),
  joined_at timestamptz,
  updated_at timestamptz default now(),
  unique (game_id, seat_number)
);

-- buy_ins: chip purchases within a game
create table if not exists buy_ins (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  cash_amount numeric(10, 2) not null,
  chips_amount int not null,
  created_at timestamptz default now()
);

-- hands: individual poker hands
create table if not exists hands (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games (id) on delete cascade,
  hand_number int not null,
  dealer_seat int not null,
  small_blind_seat int not null,
  big_blind_seat int not null,
  phase text not null default 'preflop',
  pot_total int not null default 0,
  board_cards jsonb default '[]',
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- hand_players: players participating in a hand
create table if not exists hand_players (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid references hands (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  seat_number int not null,
  hole_cards jsonb,
  starting_stack int not null,
  ending_stack int,
  folded boolean default false,
  all_in boolean default false,
  showed_cards boolean default false,
  winnings int default 0
);

-- hand_actions: actions taken during a hand
create table if not exists hand_actions (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid references hands (id) on delete cascade,
  street text not null,
  action_number int not null,
  user_id uuid references profiles (id) on delete set null,
  seat_number int not null,
  action_type text not null,
  amount int default 0,
  created_at timestamptz default now()
);

-- game_results: final results for each player in a game
create table if not exists game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  total_buy_in numeric(10, 2) not null,
  final_chips int not null,
  cashout_value numeric(10, 2) not null,
  net_result numeric(10, 2) not null,
  unique (game_id, user_id)
);

-- settlements: money transfers between players after a game
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games (id) on delete cascade,
  from_user_id uuid references profiles (id) on delete set null,
  to_user_id uuid references profiles (id) on delete set null,
  amount numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'settled')),
  created_at timestamptz default now()
);

-- ============================================================================
-- INDEXES ON FOREIGN KEYS
-- ============================================================================

create index if not exists idx_games_creator_user_id on games (creator_user_id);
create index if not exists idx_game_seats_game_id on game_seats (game_id);
create index if not exists idx_game_seats_user_id on game_seats (user_id);
create index if not exists idx_buy_ins_game_id on buy_ins (game_id);
create index if not exists idx_buy_ins_user_id on buy_ins (user_id);
create index if not exists idx_hands_game_id on hands (game_id);
create index if not exists idx_hand_players_hand_id on hand_players (hand_id);
create index if not exists idx_hand_players_user_id on hand_players (user_id);
create index if not exists idx_hand_actions_hand_id on hand_actions (hand_id);
create index if not exists idx_hand_actions_user_id on hand_actions (user_id);
create index if not exists idx_game_results_game_id on game_results (game_id);
create index if not exists idx_game_results_user_id on game_results (user_id);
create index if not exists idx_settlements_game_id on settlements (game_id);
create index if not exists idx_settlements_from_user_id on settlements (from_user_id);
create index if not exists idx_settlements_to_user_id on settlements (to_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table games enable row level security;
alter table game_seats enable row level security;
alter table buy_ins enable row level security;
alter table hands enable row level security;
alter table hand_players enable row level security;
alter table hand_actions enable row level security;
alter table game_results enable row level security;
alter table settlements enable row level security;

-- profiles: anyone can read, users can update their own
create policy "profiles_select_all"
  on profiles for select
  using (true);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- games: authenticated can read all, insert own
create policy "games_select_authenticated"
  on games for select
  to authenticated
  using (true);

create policy "games_insert_own"
  on games for insert
  to authenticated
  with check (auth.uid() = creator_user_id);

-- game_seats: authenticated can read all, insert/update with checks
create policy "game_seats_select_authenticated"
  on game_seats for select
  to authenticated
  using (true);

create policy "game_seats_insert_authenticated"
  on game_seats for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "game_seats_update_authenticated"
  on game_seats for update
  to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (true);

-- buy_ins: authenticated can read all, insert own
create policy "buy_ins_select_authenticated"
  on buy_ins for select
  to authenticated
  using (true);

create policy "buy_ins_insert_own"
  on buy_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

-- hands: authenticated can read all
create policy "hands_select_authenticated"
  on hands for select
  to authenticated
  using (true);

-- hand_players: authenticated can read all
create policy "hand_players_select_authenticated"
  on hand_players for select
  to authenticated
  using (true);

-- hand_actions: authenticated can read all
create policy "hand_actions_select_authenticated"
  on hand_actions for select
  to authenticated
  using (true);

-- game_results: authenticated can read all
create policy "game_results_select_authenticated"
  on game_results for select
  to authenticated
  using (true);

-- settlements: authenticated can read own (as sender or receiver)
create policy "settlements_select_own"
  on settlements for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- trigger: fire after a new row is inserted into auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
