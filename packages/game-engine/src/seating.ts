// ============================================================
// Seat Manager — manages player seating and position logic
// ============================================================

import { MAX_SEATS } from '@poker/shared';

export interface SeatPlayer {
  userId: string;
  displayName: string;
  stack: number;
  isFolded: boolean;
  isAllIn: boolean;
  isSittingOut: boolean;
}

export class SeatManager {
  private seats: (SeatPlayer | null)[];
  readonly maxSeats: number;

  constructor(maxSeats: number = MAX_SEATS) {
    this.maxSeats = maxSeats;
    this.seats = new Array(maxSeats).fill(null);
  }

  seatPlayer(
    seatNumber: number,
    userId: string,
    stack: number,
    displayName: string = userId,
  ): void {
    if (seatNumber < 0 || seatNumber >= this.maxSeats) {
      throw new Error(`Invalid seat number: ${seatNumber}`);
    }
    if (this.seats[seatNumber] !== null) {
      throw new Error(`Seat ${seatNumber} is already occupied`);
    }
    this.seats[seatNumber] = {
      userId,
      displayName,
      stack,
      isFolded: false,
      isAllIn: false,
      isSittingOut: false,
    };
  }

  unseatPlayer(seatNumber: number): void {
    if (seatNumber < 0 || seatNumber >= this.maxSeats) {
      throw new Error(`Invalid seat number: ${seatNumber}`);
    }
    this.seats[seatNumber] = null;
  }

  getPlayer(seatNumber: number): SeatPlayer | null {
    return this.seats[seatNumber] ?? null;
  }

  getSeatByUserId(userId: string): number {
    for (let i = 0; i < this.maxSeats; i++) {
      if (this.seats[i]?.userId === userId) return i;
    }
    return -1;
  }

  /**
   * All occupied, non-sitting-out seats.
   */
  getOccupiedSeats(): { seatNumber: number; player: SeatPlayer }[] {
    const result: { seatNumber: number; player: SeatPlayer }[] = [];
    for (let i = 0; i < this.maxSeats; i++) {
      const p = this.seats[i];
      if (p && !p.isSittingOut) {
        result.push({ seatNumber: i, player: p });
      }
    }
    return result;
  }

  /**
   * Players who haven't folded and are still in the hand.
   */
  getActivePlayers(): { seatNumber: number; player: SeatPlayer }[] {
    return this.getOccupiedSeats().filter((s) => !s.player.isFolded);
  }

  /**
   * Players who haven't folded and are NOT all-in (can still act).
   */
  getActingPlayers(): { seatNumber: number; player: SeatPlayer }[] {
    return this.getActivePlayers().filter((s) => !s.player.isAllIn);
  }

  getPlayerCount(): number {
    return this.getOccupiedSeats().length;
  }

  /**
   * Get the next occupied seat clockwise from the given seat.
   */
  private getNextOccupied(fromSeat: number): number {
    for (let i = 1; i <= this.maxSeats; i++) {
      const seat = (fromSeat + i) % this.maxSeats;
      const p = this.seats[seat];
      if (p && !p.isSittingOut) return seat;
    }
    return -1;
  }

  getNextDealer(currentDealer: number): number {
    return this.getNextOccupied(currentDealer);
  }

  /**
   * In heads-up, dealer posts SB. Otherwise, SB is next after dealer.
   */
  getSmallBlind(dealerSeat: number): number {
    if (this.getPlayerCount() === 2) {
      return dealerSeat;
    }
    return this.getNextOccupied(dealerSeat);
  }

  /**
   * BB is next occupied seat after SB.
   */
  getBigBlind(sbSeat: number): number {
    return this.getNextOccupied(sbSeat);
  }

  /**
   * First to act preflop is the player after BB.
   * First to act postflop is the first active player after the dealer.
   */
  getFirstToActPreflop(bbSeat: number): number {
    const active = this.getActivePlayers();
    // Next active player after BB
    for (let i = 1; i <= this.maxSeats; i++) {
      const seat = (bbSeat + i) % this.maxSeats;
      if (active.some((a) => a.seatNumber === seat && !a.player.isAllIn)) {
        return seat;
      }
    }
    return -1;
  }

  getFirstToActPostflop(dealerSeat: number): number {
    const active = this.getActivePlayers();
    for (let i = 1; i <= this.maxSeats; i++) {
      const seat = (dealerSeat + i) % this.maxSeats;
      if (active.some((a) => a.seatNumber === seat && !a.player.isAllIn)) {
        return seat;
      }
    }
    return -1;
  }

  getNextActivePlayer(currentSeat: number): number {
    const active = this.getActivePlayers();
    for (let i = 1; i <= this.maxSeats; i++) {
      const seat = (currentSeat + i) % this.maxSeats;
      if (active.some((a) => a.seatNumber === seat && !a.player.isAllIn)) {
        return seat;
      }
    }
    return -1;
  }

  resetForNewHand(): void {
    for (const seat of this.seats) {
      if (seat) {
        seat.isFolded = false;
        seat.isAllIn = false;
      }
    }
  }
}
