// ============================================================
// GameState — the main game state machine for Texas Hold'em
// ============================================================

import type {
  Card,
  Street,
  PlayerAction,
  GameConfig,
  PublicTableState,
  PrivatePlayerState,
  HandResult,
  WinnerInfo,
  PotResult,
} from '@poker/shared';
import { Deck } from './deck';
import { SeatManager } from './seating';
import { BettingManager } from './betting';
import { PotManager, type PlayerContribution } from './pots';
import { evaluateHand, compareHands, type HandEvaluation } from './evaluator';
import { advanceStreet, getCardsToDeal, isTerminalStreet } from './streets';

export class GameState {
  readonly gameId: string;
  readonly config: GameConfig;

  deck: Deck;
  seats: SeatManager;
  betting: BettingManager;
  potManager: PotManager;

  street: Street = 'preflop';
  communityCards: Card[] = [];
  holeCards: Map<string, [Card, Card]> = new Map();

  dealerSeat: number = -1;
  sbSeat: number = -1;
  bbSeat: number = -1;
  currentTurnSeat: number = -1;

  handNumber: number = 0;
  handInProgress: boolean = false;

  /** Accumulated pot from previous streets. */
  private accumulatedPot: number = 0;

  constructor(gameId: string, config: GameConfig) {
    this.gameId = gameId;
    this.config = config;
    this.deck = new Deck();
    this.seats = new SeatManager(config.maxSeats);
    this.betting = new BettingManager(config.bigBlind);
    this.potManager = new PotManager();
  }

  // ---- Hand lifecycle ----

  startHand(): void {
    const occupied = this.seats.getOccupiedSeats();
    if (occupied.length < 2) {
      throw new Error('Need at least 2 players to start a hand');
    }

    this.handNumber++;
    this.handInProgress = true;
    this.street = 'preflop';
    this.communityCards = [];
    this.holeCards.clear();
    this.accumulatedPot = 0;

    // Reset player states
    this.seats.resetForNewHand();

    // Reset deck and betting
    this.deck.reset();
    this.betting.reset(this.config.bigBlind);
    this.potManager.reset();

    // Advance dealer
    this.dealerSeat = this.seats.getNextDealer(this.dealerSeat);
    this.sbSeat = this.seats.getSmallBlind(this.dealerSeat);
    this.bbSeat = this.seats.getBigBlind(this.sbSeat);

    // Post blinds
    this.postBlinds();

    // Deal hole cards
    this.dealHoleCards();

    // Set first to act
    this.currentTurnSeat = this.seats.getFirstToActPreflop(this.bbSeat);
  }

  private postBlinds(): void {
    const sbPlayer = this.seats.getPlayer(this.sbSeat);
    const bbPlayer = this.seats.getPlayer(this.bbSeat);

    if (!sbPlayer || !bbPlayer) {
      throw new Error('Blind players not found');
    }

    // Post small blind
    const sbAmount = Math.min(this.config.smallBlind, sbPlayer.stack);
    sbPlayer.stack -= sbAmount;
    this.betting.bets.set(sbPlayer.userId, sbAmount);
    if (sbPlayer.stack === 0) sbPlayer.isAllIn = true;

    // Post big blind
    const bbAmount = Math.min(this.config.bigBlind, bbPlayer.stack);
    bbPlayer.stack -= bbAmount;
    this.betting.bets.set(bbPlayer.userId, bbAmount);
    this.betting.currentBet = bbAmount;
    this.betting.lastRaiseSize = bbAmount;
    if (bbPlayer.stack === 0) bbPlayer.isAllIn = true;
  }

  private dealHoleCards(): void {
    const occupied = this.seats.getOccupiedSeats();
    for (const { player } of occupied) {
      const cards = this.deck.deal(2) as [Card, Card];
      this.holeCards.set(player.userId, cards);
    }
  }

  // ---- Action processing ----

  processAction(
    userId: string,
    action: PlayerAction,
    amount: number = 0,
  ): { success: boolean; error?: string } {
    if (!this.handInProgress) {
      return { success: false, error: 'No hand in progress' };
    }

    const seatNumber = this.seats.getSeatByUserId(userId);
    if (seatNumber === -1) {
      return { success: false, error: 'Player not found' };
    }
    if (seatNumber !== this.currentTurnSeat) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.seats.getPlayer(seatNumber);
    if (!player || player.isFolded || player.isAllIn) {
      return { success: false, error: 'Player cannot act' };
    }

    // Process the bet
    const result = this.betting.processBet(userId, action, amount, player.stack);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    // Apply stack change
    player.stack -= result.chipsUsed;

    // Handle specific actions
    if (action === 'fold') {
      player.isFolded = true;
      this.potManager.removePlayerFromPots(userId);
    }

    if (action === 'all-in' || player.stack === 0) {
      player.isAllIn = true;
    }

    // Check if hand is over (everyone folded except one)
    const activePlayers = this.seats.getActivePlayers();
    if (activePlayers.length === 1) {
      // Last player standing wins
      this.collectStreetBets();
      this.handInProgress = false;
      return { success: true };
    }

    // Check if betting round is complete
    const activeIds = activePlayers.map((a) => a.player.userId);
    const allInIds = activePlayers
      .filter((a) => a.player.isAllIn)
      .map((a) => a.player.userId);

    if (this.betting.isRoundComplete(activeIds, allInIds)) {
      this.endStreet();
    } else {
      // Move to next player
      this.currentTurnSeat = this.seats.getNextActivePlayer(
        this.currentTurnSeat,
      );
      if (this.currentTurnSeat === -1) {
        // No one left to act
        this.endStreet();
      }
    }

    return { success: true };
  }

  private endStreet(): void {
    this.collectStreetBets();

    const activePlayers = this.seats.getActivePlayers();
    const actingPlayers = this.seats.getActingPlayers();

    // If only one player left or everyone is all-in, run out board
    if (activePlayers.length <= 1 || actingPlayers.length === 0) {
      // Run out remaining community cards
      this.runOutBoard();
      this.handInProgress = false;
      return;
    }

    // Advance to next street
    this.street = advanceStreet(this.street);

    if (isTerminalStreet(this.street)) {
      this.handInProgress = false;
      return;
    }

    // Deal community cards
    const cardsToDeal = getCardsToDeal(this.street);
    if (cardsToDeal > 0) {
      const cards = this.deck.deal(cardsToDeal);
      this.communityCards.push(...cards);
    }

    // Reset betting for new street
    this.betting.resetForNewStreet();

    // Set first to act
    this.currentTurnSeat = this.seats.getFirstToActPostflop(this.dealerSeat);
    if (this.currentTurnSeat === -1) {
      // Everyone is all-in, keep running out
      this.endStreet();
    }
  }

  private collectStreetBets(): void {
    const activePlayers = this.seats.getActivePlayers();
    const contributions: PlayerContribution[] = [];
    const foldedContributions: PlayerContribution[] = [];
    const allInIds: string[] = [];

    // Collect from active players
    for (const { player } of activePlayers) {
      const amount = this.betting.getPlayerBet(player.userId);
      if (amount > 0) {
        contributions.push({ playerId: player.userId, amount });
      }
      if (player.isAllIn) allInIds.push(player.userId);
    }

    // Collect from folded players (dead money)
    const allPlayers = this.seats.getOccupiedSeats();
    for (const { player } of allPlayers) {
      if (player.isFolded) {
        const amount = this.betting.getPlayerBet(player.userId);
        if (amount > 0) {
          foldedContributions.push({ playerId: player.userId, amount });
        }
      }
    }

    this.potManager.addToPots(contributions, allInIds, foldedContributions);
    this.betting.collectBets();
  }

  private runOutBoard(): void {
    // Deal remaining community cards
    while (this.communityCards.length < 5) {
      const nextStreet = advanceStreet(this.street);
      this.street = nextStreet;
      const cardsToDeal = getCardsToDeal(this.street);
      if (cardsToDeal > 0) {
        const cards = this.deck.deal(cardsToDeal);
        this.communityCards.push(...cards);
      }
      if (isTerminalStreet(this.street)) break;
    }
    this.street = 'showdown';
  }

  // ---- Hand resolution ----

  resolveHand(): HandResult {
    const activePlayers = this.seats.getActivePlayers();

    // If only one player, they win everything
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const totalPot = this.potManager.getTotal();
      winner.player.stack += totalPot;

      return {
        winners: [
          {
            userId: winner.player.userId,
            seatNumber: winner.seatNumber,
            amount: totalPot,
          },
        ],
        potResults: [
          {
            potIndex: 0,
            amount: totalPot,
            winners: [
              {
                userId: winner.player.userId,
                seatNumber: winner.seatNumber,
                amount: totalPot,
              },
            ],
          },
        ],
      };
    }

    // Make sure we have all 5 community cards for showdown
    if (this.communityCards.length < 5) {
      this.runOutBoard();
    }

    // Evaluate hands
    const evaluations = new Map<string, HandEvaluation>();
    for (const { player } of activePlayers) {
      const hole = this.holeCards.get(player.userId);
      if (hole) {
        const allCards = [...hole, ...this.communityCards];
        evaluations.set(player.userId, evaluateHand(allCards));
      }
    }

    // If no evaluations (shouldn't happen), split pot equally
    if (evaluations.size === 0) {
      const totalPot = this.potManager.getTotal();
      const share = Math.floor(totalPot / activePlayers.length);
      const winners: WinnerInfo[] = activePlayers.map(({ seatNumber, player }) => {
        player.stack += share;
        return { userId: player.userId, seatNumber, amount: share };
      });
      return { winners, potResults: [{ potIndex: 0, amount: totalPot, winners }] };
    }

    // Distribute pots
    const pots = this.potManager.getPots();
    const potResults: PotResult[] = [];
    const winnerTotals = new Map<string, number>();

    // If no pots exist (edge case), create one from the total
    if (pots.length === 0) {
      const totalPot = this.potManager.getTotal();
      if (totalPot > 0) {
        pots.push({ amount: totalPot, eligiblePlayerIds: activePlayers.map(a => a.player.userId) });
      }
    }

    for (let i = 0; i < pots.length; i++) {
      const pot = pots[i];
      const eligible = pot.eligiblePlayerIds.filter((id) =>
        evaluations.has(id),
      );

      if (eligible.length === 0) continue;

      // Find the best hand among eligible players
      let bestEval: HandEvaluation | null = null;
      for (const id of eligible) {
        const ev = evaluations.get(id)!;
        if (!bestEval || compareHands(ev, bestEval) > 0) {
          bestEval = ev;
        }
      }

      // Find all players who tie for the best hand
      const winners = eligible.filter(
        (id) => compareHands(evaluations.get(id)!, bestEval!) === 0,
      );

      // Split pot among winners (remainder goes to earliest position)
      const share = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount - share * winners.length;

      const potWinners: WinnerInfo[] = [];
      for (let w = 0; w < winners.length; w++) {
        const winnerId = winners[w];
        const winAmount = share + (w === 0 ? remainder : 0);
        const seat = this.seats.getSeatByUserId(winnerId);
        const player = this.seats.getPlayer(seat);

        if (player) {
          player.stack += winAmount;
        }

        winnerTotals.set(
          winnerId,
          (winnerTotals.get(winnerId) ?? 0) + winAmount,
        );

        const eval_ = evaluations.get(winnerId);
        potWinners.push({
          userId: winnerId,
          seatNumber: seat,
          amount: winAmount,
          hand: eval_?.description,
        });
      }

      potResults.push({
        potIndex: i,
        amount: pot.amount,
        winners: potWinners,
      });
    }

    // Build overall winners list
    const allWinners: WinnerInfo[] = [];
    for (const [userId, amount] of winnerTotals) {
      const seat = this.seats.getSeatByUserId(userId);
      const eval_ = evaluations.get(userId);
      allWinners.push({
        userId,
        seatNumber: seat,
        amount,
        hand: eval_?.description,
      });
    }

    return { winners: allWinners, potResults };
  }

  // ---- State queries ----

  getCurrentPlayer(): { userId: string; seatNumber: number } | null {
    if (!this.handInProgress || this.currentTurnSeat === -1) return null;
    const player = this.seats.getPlayer(this.currentTurnSeat);
    if (!player) return null;
    return { userId: player.userId, seatNumber: this.currentTurnSeat };
  }

  isHandComplete(): boolean {
    return !this.handInProgress;
  }

  getPublicState(): PublicTableState {
    const seats = [];
    for (let i = 0; i < this.config.maxSeats; i++) {
      const player = this.seats.getPlayer(i);
      if (player) {
        seats.push({
          seatNumber: i,
          userId: player.userId,
          displayName: player.displayName,
          status: player.isSittingOut
            ? ('sitting-out' as const)
            : ('occupied' as const),
          stack: player.stack,
        });
      } else {
        seats.push({
          seatNumber: i,
          status: 'open' as const,
          stack: 0,
        });
      }
    }

    return {
      gameId: this.gameId,
      status: this.handInProgress ? 'active' : 'lobby',
      seats,
      communityCards: [...this.communityCards],
      pot: this.potManager.getTotal() + this.betting.getTotalPot(),
      pots: this.potManager.getPots(),
      street: this.street,
      dealerSeat: this.dealerSeat,
      currentTurn: this.currentTurnSeat >= 0 ? this.currentTurnSeat : undefined,
      minBet: this.betting.currentBet > 0 ? this.betting.currentBet : this.config.bigBlind,
      handNumber: this.handNumber,
    };
  }

  getPrivateState(userId: string): PrivatePlayerState | null {
    const holeCards = this.holeCards.get(userId);
    if (!holeCards) return null;
    return { holeCards };
  }
}
