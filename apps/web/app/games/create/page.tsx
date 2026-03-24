"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export default function CreateGamePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [title, setTitle] = useState("");
  const [smallBlind, setSmallBlind] = useState(1);
  const [bigBlind, setBigBlind] = useState(2);
  const [minBuyIn, setMinBuyIn] = useState(20);
  const [maxBuyIn, setMaxBuyIn] = useState(200);
  const chipValue = 1.0;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (smallBlind <= 0) return "Small blind must be greater than 0.";
    if (bigBlind !== smallBlind * 2)
      return "Big blind must be exactly 2x the small blind.";
    if (minBuyIn <= 0) return "Min buy-in must be greater than 0.";
    if (maxBuyIn <= minBuyIn)
      return "Max buy-in must be greater than min buy-in.";
    if (chipValue <= 0) return "Chip value must be greater than 0.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError("You must be logged in to create a game.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    // Create the game
    const { data: game, error: createError } = await supabase
      .from("games")
      .insert({
        creator_user_id: user.id,
        title: title.trim(),
        status: "lobby",
        max_seats: 8,
        small_blind: smallBlind,
        big_blind: bigBlind,
        min_buy_in: minBuyIn,
        max_buy_in: maxBuyIn,
        chip_value: chipValue,
      })
      .select("id")
      .single();

    if (createError || !game) {
      setError(createError?.message ?? "Failed to create game.");
      setLoading(false);
      return;
    }

    // Create 8 empty seats (0-indexed: 0 through 7)
    const seats = Array.from({ length: 8 }, (_, i) => ({
      game_id: game.id,
      seat_number: i,
      user_id: null,
      status: "open",
    }));

    const { error: seatsError } = await supabase
      .from("game_seats")
      .insert(seats);

    if (seatsError) {
      setError(seatsError.message);
      setLoading(false);
      return;
    }

    router.push(`/games/${game.id}`);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface text-center">
          <p className="mb-4 text-[var(--color-text-secondary)]">
            You need to be logged in to create a game.
          </p>
          <Link href="/login" className="btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-md card-surface">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--color-text-primary)]">
          Create a Game
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Game Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
              placeholder="Friday Night Poker"
            />
          </div>

          {/* Blinds presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              Blinds
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                [0.25, 0.5],
                [0.5, 1],
                [1, 2],
                [2, 4],
                [5, 10],
                [10, 20],
              ].map(([sb, bb]) => (
                <button
                  key={sb}
                  type="button"
                  onClick={() => { setSmallBlind(sb); setBigBlind(bb); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    smallBlind === sb
                      ? "bg-felt-600 text-white"
                      : "border border-white/10 bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-felt-500"
                  }`}
                >
                  ${sb} / ${bb}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
              Small blind ${smallBlind} / Big blind ${bigBlind}
            </p>
          </div>

          {/* Buy-in presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              Buy-in Range
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                [10, 50],
                [20, 100],
                [20, 200],
                [50, 500],
                [100, 1000],
              ].map(([min, max]) => (
                <button
                  key={`${min}-${max}`}
                  type="button"
                  onClick={() => { setMinBuyIn(min); setMaxBuyIn(max); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    minBuyIn === min && maxBuyIn === max
                      ? "bg-felt-600 text-white"
                      : "border border-white/10 bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-felt-500"
                  }`}
                >
                  ${min} – ${max}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
              Min ${minBuyIn} / Max ${maxBuyIn}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-chip-red/10 px-4 py-2 text-sm text-chip-red">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          <Link href="/games" className="text-felt-400 hover:text-felt-300">
            Back to Games
          </Link>
        </p>
      </div>
    </div>
  );
}
