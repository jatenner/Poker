// ============================================================
// Shared Types for Poker App
// ============================================================

// --- Enums & Literal Types ---

export const Suit = {
  Hearts: 'hearts',
  Diamonds: 'diamonds',
  Clubs: 'clubs',
  Spades: 'spades',
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

export const Rank = {
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
  Jack: 'J',
  Queen: 'Q',
  King: 'K',
  Ace: 'A',
} as const;

export type Rank = (typeof Rank)[keyof typeof Rank];

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type GameStatus = 'lobby' | 'active' | 'paused' | 'completed';

export type SeatStatus = 'open' | 'occupied' | 'sitting-out';

// --- Core Data Structures ---

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface BuyInConfig {
  minBuyIn: number;
  maxBuyIn: number;
  chipValue: number;
}

export interface GameConfig {
  title: string;
  smallBlind: number;
  bigBlind: number;
  maxSeats: number;
  buyInConfig: BuyInConfig;
}

export interface GameSeat {
  seatNumber: number;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  status: SeatStatus;
  stack: number;
}

// --- Player State ---

export interface PublicPlayerState {
  userId: string;
  seatNumber: number;
  displayName: string;
  avatarUrl?: string;
  stack: number;
  isFolded: boolean;
  isAllIn: boolean;
  isTurn: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  currentBet: number;
  lastAction?: PlayerAction;
}

export interface PrivatePlayerState {
  holeCards: [Card, Card];
}

// --- Table State ---

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface PublicTableState {
  gameId: string;
  status: GameStatus;
  seats: GameSeat[];
  communityCards: Card[];
  pot: number;
  pots: SidePot[];
  street: Street;
  dealerSeat: number;
  currentTurn?: number;
  minBet?: number;
  handNumber: number;
}

// --- Actions ---

export interface ActionRequest {
  type: PlayerAction;
  amount?: number;
}

// --- Results ---

export interface WinnerInfo {
  userId: string;
  seatNumber: number;
  amount: number;
  hand?: string;
}

export interface PotResult {
  potIndex: number;
  amount: number;
  winners: WinnerInfo[];
}

export interface HandResult {
  winners: WinnerInfo[];
  potResults: PotResult[];
}

export interface GameResult {
  userId: string;
  displayName: string;
  totalBuyIn: number;
  finalChips: number;
  cashoutValue: number;
  netResult: number;
}

export interface Settlement {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  amount: number;
}
