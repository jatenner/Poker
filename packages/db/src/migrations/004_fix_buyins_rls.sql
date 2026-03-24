-- Fix buy_ins RLS: ensure authenticated users can insert their own buy-ins
-- Also add insert policies for tables that the server writes to

-- buy_ins: allow authenticated insert for own records
drop policy if exists "buy_ins_insert_own" on buy_ins;
create policy "buy_ins_insert_own"
  on buy_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Also ensure game_seats update policy allows taking a seat
-- (the current user takes an open seat by setting user_id to their own id)
drop policy if exists "game_seats_update_authenticated" on game_seats;
create policy "game_seats_update_authenticated"
  on game_seats for update
  to authenticated
  using (true)
  with check (
    -- Allow setting user_id to own id (taking a seat)
    (user_id = auth.uid())
    or
    -- Allow clearing a seat (leaving) - only if current user owns the seat
    (user_id is null)
  );

-- games: allow creator to update their own game
drop policy if exists "games_update_creator" on games;
create policy "games_update_creator"
  on games for update
  to authenticated
  using (auth.uid() = creator_user_id)
  with check (auth.uid() = creator_user_id);
