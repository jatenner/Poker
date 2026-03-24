-- Fix game_seats RLS to allow creating empty seats when creating a game
-- The creator needs to insert seats with user_id = null

drop policy if exists "game_seats_insert_authenticated" on game_seats;

create policy "game_seats_insert_authenticated"
  on game_seats for insert
  to authenticated
  with check (
    -- Allow inserting empty seats (user_id is null) if user is the game creator
    (user_id is null and exists (
      select 1 from games where games.id = game_id and games.creator_user_id = auth.uid()
    ))
    or
    -- Allow taking a seat (user_id matches current user)
    auth.uid() = user_id
  );
