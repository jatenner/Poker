"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import BuyInModal from "@/components/BuyInModal";
import type { GameStatus, SeatStatus } from "@poker/shared";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GameDetails {
  id: string;
  title: string;
  status: GameStatus;
  creator_user_id: string;
  max_seats: number;
  small_blind: number;
  big_blind: number;
  min_buy_in: number;
  max_buy_in: number;
  chip_value: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

interface SeatRow {
  id: string;
  game_id: string;
  seat_number: number;
  user_id: string | null;
  status: string;
  player?:
    | { display_name: string | null; avatar_url: string | null }
    | { display_name: string | null; avatar_url: string | null }[]
    | null;
}

interface BuyInRow {
  user_id: string;
  cash_amount: number;
}

interface SeatData {
  seatNumber: number;
  status: SeatStatus;
  userId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  buyInAmount: number | null;
}

/* ------------------------------------------------------------------ */
/*  Seat positions around the oval (percentage-based)                  */
/*  8 seats: 0,1,2 top · 3 right · 4,5,6 bottom · 7 left             */
/* ------------------------------------------------------------------ */

const SEAT_POSITIONS: { top: string; left: string }[] = [
  // Top row: seats 0, 1, 2
  { top: "2%", left: "18%" },
  { top: "0%", left: "44%" },
  { top: "2%", left: "70%" },
  // Right: seat 3
  { top: "42%", left: "90%" },
  // Bottom row: seats 4, 5, 6
  { top: "80%", left: "70%" },
  { top: "82%", left: "44%" },
  { top: "80%", left: "18%" },
  // Left: seat 7
  { top: "42%", left: "-2%" },
];

/* ------------------------------------------------------------------ */
/*  Avatar colors by seat                                              */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  "bg-chip-red",
  "bg-chip-blue",
  "bg-chip-gold",
  "bg-felt-500",
  "bg-purple-600",
  "bg-orange-600",
  "bg-teal-600",
  "bg-pink-600",
];

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: GameStatus }) {
  const map: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    lobby: { bg: "bg-felt-700/30", text: "text-felt-300", label: "Lobby", dot: "bg-felt-400" },
    active: { bg: "bg-chip-gold/20", text: "text-chip-gold", label: "Active", dot: "bg-chip-gold" },
    paused: { bg: "bg-chip-blue/20", text: "text-chip-blue", label: "Paused", dot: "bg-chip-blue" },
    completed: { bg: "bg-white/10", text: "text-[var(--color-text-secondary)]", label: "Completed", dot: "bg-[var(--color-text-secondary)]" },
  };
  const c = map[status] ?? map.completed;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Seat Component (poker-table style)                                 */
/* ------------------------------------------------------------------ */

function PokerSeat({
  seat,
  isCurrentUser,
  onTakeSeat,
  onLeaveSeat,
  isLobby,
}: {
  seat: SeatData;
  isCurrentUser: boolean;
  onTakeSeat: (n: number) => void;
  onLeaveSeat: (n: number) => void;
  isLobby: boolean;
}) {
  const isEmpty = seat.status === "open";
  const isSittingOut = seat.status === "sitting-out";
  const initials = seat.displayName?.[0]?.toUpperCase() ?? "?";
  const colorClass = AVATAR_COLORS[seat.seatNumber % AVATAR_COLORS.length];

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed transition
            ${isLobby
              ? "border-white/15 bg-black/30 hover:border-felt-500/60 cursor-pointer group"
              : "border-white/10 bg-black/20"
            }`}
          onClick={() => isLobby && onTakeSeat(seat.seatNumber)}
        >
          {isLobby ? (
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/30 group-hover:text-felt-400 transition">
              Sit
            </span>
          ) : (
            <span className="text-[10px] text-white/20">{seat.seatNumber + 1}</span>
          )}
        </div>
        <span className="text-[10px] text-white/30">Seat {seat.seatNumber + 1}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Avatar ring */}
      <div
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition
          ${isCurrentUser
            ? "border-felt-400 shadow-[0_0_12px_rgba(102,187,106,0.4)]"
            : isSittingOut
            ? "border-white/10 opacity-50"
            : "border-white/20"
          }`}
      >
        {seat.avatarUrl ? (
          <img
            src={seat.avatarUrl}
            alt={seat.displayName ?? "Player"}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center rounded-full text-base font-bold text-white ${colorClass}`}
          >
            {initials}
          </span>
        )}
        {isSittingOut && (
          <span className="absolute -bottom-0.5 rounded-full bg-black/80 px-1.5 text-[8px] font-semibold text-[var(--color-text-secondary)]">
            Away
          </span>
        )}
      </div>

      {/* Name plate */}
      <div
        className={`mt-0.5 rounded-md px-2 py-0.5 text-center
          ${isCurrentUser ? "bg-felt-800/60" : "bg-black/50"}`}
      >
        <div className="max-w-[80px] truncate text-[11px] font-semibold text-white">
          {seat.displayName ?? "Player"}
        </div>
        {seat.buyInAmount != null && (
          <div className="text-[10px] font-medium text-chip-gold">
            ${seat.buyInAmount.toFixed(2)}
          </div>
        )}
      </div>

      {/* Leave button */}
      {isCurrentUser && isLobby && (
        <button
          onClick={() => onLeaveSeat(seat.seatNumber)}
          className="mt-0.5 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-chip-red/70 transition hover:bg-chip-red/10 hover:text-chip-red"
        >
          Leave
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();

  const [game, setGame] = useState<GameDetails | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Buy-in modal
  const [buyInModalOpen, setBuyInModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const supabase = createBrowserClient();

  /* ---- helpers ---- */

  const mapSeats = (seatRows: SeatRow[], buyIns: BuyInRow[]): SeatData[] => {
    // Build a map of user_id -> total buy-in cash amount
    const buyInMap = new Map<string, number>();
    for (const b of buyIns) {
      buyInMap.set(b.user_id, (buyInMap.get(b.user_id) ?? 0) + b.cash_amount);
    }

    return seatRows
      .map((s) => {
        const player = Array.isArray(s.player) ? s.player[0] : s.player;
        return {
          seatNumber: s.seat_number,
          status: s.status as SeatStatus,
          userId: s.user_id,
          displayName: player?.display_name ?? null,
          avatarUrl: player?.avatar_url ?? null,
          buyInAmount: s.user_id ? (buyInMap.get(s.user_id) ?? null) : null,
        };
      })
      .sort((a, b) => a.seatNumber - b.seatNumber);
  };

  const seatQuery = `
    id,
    game_id,
    seat_number,
    user_id,
    status,
    player:profiles!game_seats_user_id_fkey(display_name, avatar_url)
  `;

  /* ---- data fetching ---- */

  const fetchSeats = useCallback(async () => {
    const [seatRes, buyInRes] = await Promise.all([
      supabase
        .from("game_seats")
        .select(seatQuery)
        .eq("game_id", gameId)
        .order("seat_number"),
      supabase
        .from("buy_ins")
        .select("user_id, cash_amount")
        .eq("game_id", gameId),
    ]);
    if (seatRes.data) {
      setSeats(
        mapSeats(
          seatRes.data as unknown as SeatRow[],
          (buyInRes.data as BuyInRow[]) ?? []
        )
      );
    }
  }, [gameId]);

  const fetchGame = useCallback(async () => {
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !gameData) {
      setError("Game not found.");
      setLoading(false);
      return;
    }

    const g = gameData as GameDetails;
    setGame(g);

    // If game is active, redirect to play
    if (g.status === "active") {
      router.replace(`/games/${gameId}/play`);
      return;
    }

    await fetchSeats();
    setLoading(false);
  }, [gameId, fetchSeats, router]);

  // Initial fetch
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Realtime: game_seats changes
  useEffect(() => {
    const channel = supabase
      .channel(`game_seats:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_seats",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchSeats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchSeats]);

  // Realtime: game status changes (to detect "active")
  useEffect(() => {
    const channel = supabase
      .channel(`game_status:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<GameDetails>;
          if (updated.status === "active") {
            router.replace(`/games/${gameId}/play`);
          }
          setGame((prev) => (prev ? { ...prev, ...updated } : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, router]);

  /* ---- actions ---- */

  const handleTakeSeat = (seatNumber: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSelectedSeat(seatNumber);
    setBuyInModalOpen(true);
  };

  const handleConfirmBuyIn = async (amount: number) => {
    if (!user || selectedSeat === null || !game) return;

    setActionLoading(true);
    setBuyInModalOpen(false);

    // Claim the seat
    const { error: seatError, data: updatedRows } = await supabase
      .from("game_seats")
      .update({
        user_id: user.id,
        status: "occupied",
        joined_at: new Date().toISOString(),
      })
      .eq("game_id", gameId)
      .eq("seat_number", selectedSeat)
      .eq("status", "open")
      .select();

    if (seatError) {
      setError(seatError.message);
    } else if (!updatedRows || updatedRows.length === 0) {
      setError("Seat is no longer available.");
    } else {
      setError(null);

      // Record the buy-in
      const chipsAmount = game.chip_value > 0 ? Math.floor(amount / game.chip_value) : 0;
      const { error: buyInError } = await supabase.from("buy_ins").insert({
        game_id: gameId,
        user_id: user.id,
        cash_amount: amount,
        chips_amount: chipsAmount,
      });
      if (buyInError) {
        setError(buyInError.message);
      }
    }

    await fetchSeats();
    setSelectedSeat(null);
    setActionLoading(false);
  };

  const handleLeaveSeat = async (seatNumber: number) => {
    if (!user) return;
    setActionLoading(true);

    const { error: leaveError } = await supabase
      .from("game_seats")
      .update({
        user_id: null,
        status: "open",
      })
      .eq("game_id", gameId)
      .eq("seat_number", seatNumber)
      .eq("user_id", user.id);

    if (leaveError) {
      setError(leaveError.message);
    } else {
      setError(null);
    }

    await fetchSeats();
    setActionLoading(false);
  };

  const handleStartGame = async () => {
    if (!user || !game) return;
    // Just redirect to the play page — the socket server handles starting
    router.push(`/games/${gameId}/play?start=1`);

    setActionLoading(false);
  };

  /* ---- derived state ---- */

  const isCreator = user?.id === game?.creator_user_id;
  const userSeat = seats.find((s) => s.userId === user?.id);
  const occupiedCount = seats.filter(
    (s) => s.status === "occupied" || s.status === "sitting-out"
  ).length;
  const isLobbyFull = occupiedCount >= (game?.max_seats ?? 8) && !userSeat;

  /* ---- loading ---- */

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-700 border-t-felt-400" />
          <span className="text-sm text-[var(--color-text-secondary)]">Loading table...</span>
        </div>
      </div>
    );
  }

  /* ---- error ---- */

  if (error && !game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4">
        <div className="card-surface max-w-sm text-center">
          <p className="mb-4 text-[var(--color-text-secondary)]">{error}</p>
          <Link href="/games" className="btn-primary">
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  if (!game) return null;

  // Fill seats array to 8 if fewer exist
  const allSeats: SeatData[] = Array.from({ length: 8 }, (_, i) => {
    const existing = seats.find((s) => s.seatNumber === i);
    return (
      existing ?? {
        seatNumber: i,
        status: "open" as SeatStatus,
        userId: null,
        displayName: null,
        avatarUrl: null,
        buyInAmount: null,
      }
    );
  });

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0a0a0a]">
        <Link
          href="/games"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Lobby
        </Link>

        <div className="flex items-center gap-3">
          <StatusBadge status={game.status} />
          <span className="text-sm text-[var(--color-text-secondary)]">
            {occupiedCount}/{game.max_seats}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Info strip */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="font-bold text-[var(--color-text-primary)] text-lg">{game.title}</span>
          <span className="text-[var(--color-text-secondary)]">
            Blinds: <span className="text-[var(--color-text-primary)] font-medium">${game.small_blind}/{game.big_blind}</span>
          </span>
          <span className="text-[var(--color-text-secondary)]">
            Buy-in: <span className="text-[var(--color-text-primary)] font-medium">${game.min_buy_in}&ndash;${game.max_buy_in}</span>
          </span>
        </div>

        {/* ============ THE TABLE ============ */}
        <div className="relative w-full max-w-[720px] aspect-[16/10]">
          {/* Outer rail / border */}
          <div
            className="absolute inset-[6%] rounded-[50%] shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            style={{
              background: "linear-gradient(145deg, #6d4c41, #3e2723)",
              padding: "6px",
            }}
          >
            {/* Inner felt surface */}
            <div
              className="h-full w-full rounded-[50%] relative"
              style={{
                background: "radial-gradient(ellipse at 40% 40%, #2e7d32 0%, #1b5e20 40%, #0a3a10 100%)",
                boxShadow: "inset 0 2px 30px rgba(0,0,0,0.3), inset 0 0 60px rgba(0,0,0,0.15)",
              }}
            >
              {/* Subtle felt texture overlay */}
              <div
                className="absolute inset-0 rounded-[50%] opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Table center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="rounded-full border border-white/[0.06] bg-black/15 px-5 py-2">
                  <span className="text-sm font-semibold text-white/40 tracking-wide">
                    {game.title}
                  </span>
                </div>
                {game.status === "lobby" && (
                  <span className="mt-2 text-xs text-white/25">
                    Waiting for players...
                  </span>
                )}
              </div>

              {/* Rail highlight (top edge shine) */}
              <div
                className="absolute inset-0 rounded-[50%]"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 20%)",
                }}
              />
            </div>
          </div>

          {/* ============ SEATS ============ */}
          {allSeats.map((seat) => {
            const pos = SEAT_POSITIONS[seat.seatNumber];
            if (!pos) return null;
            return (
              <div
                key={seat.seatNumber}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ top: pos.top, left: pos.left }}
              >
                <PokerSeat
                  seat={seat}
                  isCurrentUser={seat.userId === user?.id}
                  onTakeSeat={handleTakeSeat}
                  onLeaveSeat={handleLeaveSeat}
                  isLobby={game.status === "lobby"}
                />
              </div>
            );
          })}
        </div>

        {/* ============ CONTROLS BELOW TABLE ============ */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* Start Game button (creator only) */}
          {isCreator && game.status === "lobby" && occupiedCount >= 2 && (
            <button
              onClick={handleStartGame}
              disabled={actionLoading}
              className="rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-8 py-3 text-base font-bold text-white shadow-lg transition
                hover:from-felt-400 hover:to-felt-600 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Starting...
                </span>
              ) : (
                "Start Game"
              )}
            </button>
          )}

          {isCreator && game.status === "lobby" && occupiedCount < 2 && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Need at least 2 players to start
            </p>
          )}

          {/* Full table notice */}
          {isLobbyFull && (
            <div className="rounded-lg bg-chip-gold/10 px-4 py-2 text-sm font-medium text-chip-gold">
              Table is full
            </div>
          )}

          {/* Join Table link if game is active */}
          {game.status === "active" && (
            <Link
              href={`/games/${gameId}/play`}
              className="rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-8 py-3 text-base font-bold text-white shadow-lg transition
                hover:from-felt-400 hover:to-felt-600"
            >
              Join Table
            </Link>
          )}

          {/* Inline error */}
          {error && game && (
            <p className="rounded-lg bg-chip-red/10 px-4 py-2 text-sm text-chip-red">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Buy-in modal */}
      <BuyInModal
        isOpen={buyInModalOpen}
        onClose={() => {
          setBuyInModalOpen(false);
          setSelectedSeat(null);
        }}
        onConfirm={handleConfirmBuyIn}
        minBuyIn={game.min_buy_in}
        maxBuyIn={game.max_buy_in}
        chipValue={game.chip_value}
        seatNumber={selectedSeat ?? undefined}
      />
    </div>
  );
}
