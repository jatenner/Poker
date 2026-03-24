"use client";

import { useState } from "react";
import Link from "next/link";
import type { GameStatus } from "@poker/shared";

interface GameRow {
  id: string;
  title: string;
  status: GameStatus;
  max_seats: number;
  small_blind: number;
  big_blind: number;
  min_buy_in?: number;
  max_buy_in?: number;
  created_at: string;
  creator: {
    display_name: string | null;
  } | null;
  seat_count?: number;
}

interface CompletedGameRow {
  id: string;
  title: string;
  status: GameStatus;
  max_seats: number;
  small_blind: number;
  big_blind: number;
  created_at: string;
  ended_at: string | null;
  creator: {
    display_name: string | null;
  } | null;
  player_count: number;
  userNetResult: number | null;
}

type AnyGameRow = GameRow | CompletedGameRow;

function StatusBadge({ status }: { status: GameStatus }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    lobby: {
      bg: "bg-felt-700/40",
      text: "text-felt-300",
      label: "Lobby",
    },
    active: {
      bg: "bg-chip-gold/20",
      text: "text-chip-gold",
      label: "Active",
    },
    completed: {
      bg: "bg-white/5",
      text: "text-[var(--color-text-secondary)]",
      label: "Completed",
    },
    paused: {
      bg: "bg-chip-blue/20",
      text: "text-chip-blue",
      label: "Paused",
    },
  };

  const c = config[status] ?? config.completed;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NetResultBadge({ amount }: { amount: number }) {
  if (amount > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-felt-700/30 px-2 py-0.5 text-xs font-semibold text-felt-300">
        +${amount.toFixed(2)}
      </span>
    );
  }
  if (amount < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-chip-red/15 px-2 py-0.5 text-xs font-semibold text-chip-red">
        -${Math.abs(amount).toFixed(2)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      $0.00
    </span>
  );
}

function OpenGameCard({ game }: { game: GameRow }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="card-surface transition hover:border-felt-600"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {game.title}
        </h3>
        <StatusBadge status={game.status} />
      </div>

      <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
        Created by{" "}
        <span className="text-[var(--color-text-primary)]">
          {game.creator?.display_name ?? "Unknown"}
        </span>
      </p>

      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-[var(--color-text-secondary)]">Seats</span>
          <p className="font-medium text-[var(--color-text-primary)]">
            {game.seat_count ?? 0} / {game.max_seats}
          </p>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">Blinds</span>
          <p className="font-medium text-[var(--color-text-primary)]">
            ${game.small_blind} / ${game.big_blind}
          </p>
        </div>
        {game.min_buy_in != null && game.max_buy_in != null && (
          <div className="col-span-2">
            <span className="text-[var(--color-text-secondary)]">Buy-in</span>
            <p className="font-medium text-[var(--color-text-primary)]">
              ${game.min_buy_in} &ndash; ${game.max_buy_in}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

function CompletedGameCard({ game }: { game: CompletedGameRow }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="card-surface transition hover:border-felt-600"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {game.title}
        </h3>
        <StatusBadge status={game.status} />
      </div>

      <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
        {formatDate(game.created_at)}
        {game.creator?.display_name && (
          <>
            {" "}
            &middot; by{" "}
            <span className="text-[var(--color-text-primary)]">
              {game.creator.display_name}
            </span>
          </>
        )}
      </p>

      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-[var(--color-text-secondary)]">Players</span>
          <p className="font-medium text-[var(--color-text-primary)]">
            {game.player_count}
          </p>
        </div>
        <div>
          <span className="text-[var(--color-text-secondary)]">Blinds</span>
          <p className="font-medium text-[var(--color-text-primary)]">
            ${game.small_blind} / ${game.big_blind}
          </p>
        </div>
        {game.userNetResult !== null && (
          <div className="col-span-2">
            <span className="text-[var(--color-text-secondary)]">
              Your result
            </span>
            <div className="mt-0.5">
              <NetResultBadge amount={game.userNetResult} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function isCompletedGame(g: AnyGameRow): g is CompletedGameRow {
  return g.status === "completed" && "player_count" in g;
}

function isOpenGame(g: AnyGameRow): g is GameRow {
  return g.status !== "completed" || !("player_count" in g);
}

type Tab = "open" | "my" | "completed";

export default function GamesTabs({
  openGames,
  myGames,
  completedGames,
  isLoggedIn,
}: {
  openGames: GameRow[];
  myGames: AnyGameRow[];
  completedGames: CompletedGameRow[];
  isLoggedIn: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("open");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "open", label: "Open Games", count: openGames.length },
    ...(isLoggedIn
      ? [{ key: "my" as Tab, label: "My Games", count: myGames.length }]
      : []),
    { key: "completed", label: "Completed", count: completedGames.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-white/[0.03] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white/10 text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Open Games tab */}
      {activeTab === "open" && (
        <>
          {openGames.length === 0 ? (
            <div className="card-surface py-16 text-center">
              <p className="text-lg font-medium text-[var(--color-text-secondary)]">
                No games available
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Be the first to create a game!
              </p>
              <Link
                href="/games/create"
                className="btn-primary mt-6 inline-flex"
              >
                Create Game
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openGames.map((game) => (
                <OpenGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Games tab */}
      {activeTab === "my" && (
        <>
          {myGames.length === 0 ? (
            <div className="card-surface py-16 text-center">
              <p className="text-lg font-medium text-[var(--color-text-secondary)]">
                You haven&apos;t joined any games yet
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Join an open game or create your own!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myGames.map((game) =>
                isCompletedGame(game) ? (
                  <CompletedGameCard key={game.id} game={game} />
                ) : isOpenGame(game) ? (
                  <OpenGameCard key={game.id} game={game} />
                ) : null
              )}
            </div>
          )}
        </>
      )}

      {/* Completed tab */}
      {activeTab === "completed" && (
        <>
          {completedGames.length === 0 ? (
            <div className="card-surface py-16 text-center">
              <p className="text-lg font-medium text-[var(--color-text-secondary)]">
                No completed games yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedGames.map((game) => (
                <CompletedGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
