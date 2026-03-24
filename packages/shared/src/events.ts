// ============================================================
// Socket.IO Event Constants
// ============================================================

// --- Client -> Server Events ---

export const ClientEvents = {
  JOIN_GAME_ROOM: 'game:join',
  TAKE_SEAT: 'game:takeSeat',
  LEAVE_SEAT: 'game:leaveSeat',
  START_GAME: 'game:start',
  PLAYER_ACTION: 'game:playerAction',
  END_GAME: 'game:end',
} as const;

export type ClientEvent = (typeof ClientEvents)[keyof typeof ClientEvents];

// --- Server -> Client Events ---

export const ServerEvents = {
  GAME_STATE: 'game:state',
  SEAT_UPDATED: 'game:seatUpdated',
  HAND_STARTED: 'game:handStarted',
  ACTION_REQUIRED: 'game:actionRequired',
  ACTION_PERFORMED: 'game:actionPerformed',
  HAND_RESULT: 'game:handResult',
  GAME_ENDED: 'game:gameEnded',
  ERROR: 'game:error',
} as const;

export type ServerEvent = (typeof ServerEvents)[keyof typeof ServerEvents];
