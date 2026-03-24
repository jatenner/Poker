// Client
export { createServiceClient, createBrowserClient } from "./client";

// Queries - Games
export {
  createGame,
  getGame,
  listGames,
  updateGameStatus,
  type CreateGameParams,
} from "./queries/games";

// Queries - Seats
export { takeSeat, leaveSeat, getSeats } from "./queries/seats";

// Queries - Profiles
export {
  getProfile,
  getProfileByUserId,
  updateProfile,
  type UpdateProfileParams,
} from "./queries/profiles";

// Queries - Results
export {
  saveGameResults,
  saveSettlements,
  getGameResults,
  getSettlements,
  type GameResultInput,
  type SettlementInput,
} from "./queries/results";

// Queries - Hands
export {
  saveHand,
  saveHandPlayers,
  saveHandActions,
  getGameHands,
  getHandDetails,
  type HandInput,
  type HandPlayerInput,
  type HandActionInput,
} from "./queries/hands";
