// ============================================================
// Game Service — Database interactions for game state persistence
// ============================================================

import {
  createServiceClient,
  getGame,
  updateGameStatus as dbUpdateGameStatus,
  takeSeat as dbTakeSeat,
  leaveSeat as dbLeaveSeat,
  saveGameResults as dbSaveGameResults,
  saveSettlements as dbSaveSettlements,
  getProfileByUserId,
  type GameResultInput,
  type SettlementInput,
} from '@poker/db';
import type { GameConfig, GameStatus, GameResult, Settlement } from '@poker/shared';

// Lazy-init to ensure env vars are loaded before creating the client
let _supabase: ReturnType<typeof createServiceClient> | null = null;
function supabase() {
  if (!_supabase) _supabase = createServiceClient();
  return _supabase;
}

// ---- Game Config ----

export interface FetchedGameConfig {
  config: GameConfig;
  creatorUserId: string;
}

export async function fetchGameConfig(gameId: string): Promise<FetchedGameConfig> {
  const game = await getGame(supabase(), gameId);

  return {
    config: {
      title: game.title,
      smallBlind: game.small_blind,
      bigBlind: game.big_blind,
      maxSeats: game.max_seats,
      buyInConfig: {
        minBuyIn: game.min_buy_in,
        maxBuyIn: game.max_buy_in,
        chipValue: game.chip_value ?? 1,
      },
    },
    creatorUserId: game.creator_user_id,
  };
}

// ---- Game Status ----

export async function updateGameStatus(
  gameId: string,
  status: GameStatus,
): Promise<void> {
  await dbUpdateGameStatus(supabase(), gameId, status);
}

// ---- Seats ----

export async function saveSeatTaken(
  gameId: string,
  seatNumber: number,
  userId: string,
): Promise<void> {
  await dbTakeSeat(supabase(), gameId, seatNumber, userId);
}

export async function saveSeatLeft(
  gameId: string,
  seatNumber: number,
): Promise<void> {
  await dbLeaveSeat(supabase(), gameId, seatNumber);
}

// ---- Buy-In ----

export async function saveBuyIn(
  gameId: string,
  userId: string,
  cashAmount: number,
  chipsAmount: number,
): Promise<void> {
  const { error } = await supabase().from('buy_ins').insert({
    game_id: gameId,
    user_id: userId,
    cash_amount: cashAmount,
    chips_amount: chipsAmount,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---- Hand Records ----

export interface HandRecordData {
  handNumber: number;
  dealerSeat: number;
  communityCards: unknown[];
  potTotal: number;
  players: {
    userId: string;
    seatNumber: number;
    holeCards: unknown[];
    startStack: number;
    endStack: number;
    netChange: number;
  }[];
  actions: {
    street: string;
    seatNumber: number;
    userId: string;
    action: string;
    amount: number;
    timestamp: string;
  }[];
  winners: {
    userId: string;
    amount: number;
    hand?: string;
  }[];
}

export async function saveHandRecord(
  gameId: string,
  handData: HandRecordData,
): Promise<void> {
  // Insert the hand record
  const { data: hand, error: handError } = await supabase()
    .from('hands')
    .insert({
      game_id: gameId,
      hand_number: handData.handNumber,
      dealer_seat: handData.dealerSeat,
      community_cards: handData.communityCards,
      pot_total: handData.potTotal,
      winners: handData.winners,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (handError) {
    console.error('[gameService] Failed to save hand record:', handError);
    return;
  }

  // Insert hand players
  if (handData.players.length > 0) {
    const playerRows = handData.players.map((p) => ({
      hand_id: hand.id,
      game_id: gameId,
      user_id: p.userId,
      seat_number: p.seatNumber,
      hole_cards: p.holeCards,
      start_stack: p.startStack,
      end_stack: p.endStack,
      net_change: p.netChange,
    }));

    const { error: playersError } = await supabase()
      .from('hand_players')
      .insert(playerRows);

    if (playersError) {
      console.error('[gameService] Failed to save hand players:', playersError);
    }
  }

  // Insert hand actions
  if (handData.actions.length > 0) {
    const actionRows = handData.actions.map((a, i) => ({
      hand_id: hand.id,
      game_id: gameId,
      user_id: a.userId,
      seat_number: a.seatNumber,
      street: a.street,
      action: a.action,
      amount: a.amount,
      action_order: i,
    }));

    const { error: actionsError } = await supabase()
      .from('hand_actions')
      .insert(actionRows);

    if (actionsError) {
      console.error('[gameService] Failed to save hand actions:', actionsError);
    }
  }
}

// ---- Game Results ----

export async function saveGameResults(
  gameId: string,
  results: GameResult[],
  settlements: Settlement[],
): Promise<void> {
  const resultInputs: GameResultInput[] = results.map((r) => ({
    gameId,
    userId: r.userId,
    totalBuyIn: r.totalBuyIn,
    finalChips: r.finalChips,
    cashoutValue: r.cashoutValue,
    netResult: r.netResult,
  }));

  const settlementInputs: SettlementInput[] = settlements.map((s) => ({
    gameId,
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: s.amount,
  }));

  await dbSaveGameResults(supabase(), gameId, resultInputs);
  if (settlementInputs.length > 0) {
    await dbSaveSettlements(supabase(), gameId, settlementInputs);
  }
}

// ---- Hydrate Seats from DB ----

export interface SeatedPlayer {
  seatNumber: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarData: Record<string, unknown> | null;
  chips: number;
  cashBuyIn: number;
}

export async function fetchSeatedPlayers(
  gameId: string,
  chipValue: number,
): Promise<SeatedPlayer[]> {
  // Get occupied seats with profile info
  const { data: seatRows, error: seatErr } = await supabase()
    .from('game_seats')
    .select('seat_number, user_id, profiles!game_seats_user_id_fkey(display_name, avatar_url, avatar_data)')
    .eq('game_id', gameId)
    .eq('status', 'occupied');

  if (seatErr || !seatRows) return [];

  // Get buy-ins per user
  const { data: buyInRows } = await supabase()
    .from('buy_ins')
    .select('user_id, cash_amount, chips_amount')
    .eq('game_id', gameId);

  const buyInMap = new Map<string, { cash: number; chips: number }>();
  for (const b of buyInRows ?? []) {
    const prev = buyInMap.get(b.user_id) ?? { cash: 0, chips: 0 };
    buyInMap.set(b.user_id, {
      cash: prev.cash + Number(b.cash_amount),
      chips: prev.chips + b.chips_amount,
    });
  }

  return seatRows
    .filter((s: any) => s.user_id)
    .map((s: any) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const bi = buyInMap.get(s.user_id) ?? { cash: 0, chips: 0 };
      return {
        seatNumber: s.seat_number,
        userId: s.user_id,
        displayName: profile?.display_name ?? s.user_id.slice(0, 8),
        avatarUrl: profile?.avatar_url ?? null,
        avatarData: profile?.avatar_data ?? null,
        chips: bi.chips > 0 ? bi.chips : Math.floor(bi.cash / chipValue),
        cashBuyIn: bi.cash,
      };
    });
}

// ---- Profile Lookup ----

export async function getDisplayName(userId: string): Promise<string> {
  try {
    const profile = await getProfileByUserId(supabase(), userId);
    return profile?.display_name ?? userId.slice(0, 8);
  } catch {
    return userId.slice(0, 8);
  }
}
