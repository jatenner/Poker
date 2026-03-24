-- Enable realtime for game_seats and games tables
-- This is needed for Supabase realtime subscriptions on postgres_changes

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table game_seats;
