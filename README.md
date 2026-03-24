# Poker - Multiplayer Texas Hold'em

A real-time multiplayer No-Limit Texas Hold'em poker application. Players can create accounts, join game tables with configurable stakes, and play full poker hands with a server-authoritative game engine.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Realtime:** Node.js + Socket.IO
- **Database/Auth:** Supabase (PostgreSQL, Auth, Storage)
- **Package Manager:** pnpm (monorepo with workspaces)

## Prerequisites

- Node.js 22+ (24 recommended)
- pnpm 10+
- A Supabase project (with Auth, Database, and Storage enabled)

## Project Structure

```
apps/
  web/            - Next.js frontend
  server/         - Socket.IO game server
packages/
  shared/         - Shared types, events, constants
  game-engine/    - Poker engine logic (hand evaluation, pot calculation, etc.)
  db/             - Database schema, migrations, queries
```

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd poker
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` in the project root and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | URL of the web app (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SOCKET_URL` | URL of the Socket.IO server (default: `http://localhost:3001`) |
| `SOCKET_SERVER_URL` | Internal URL for the socket server (default: `http://localhost:3001`) |
| `SESSION_SECRET` | Secret for session signing (generate a random string) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret) |
| `DATABASE_URL` | PostgreSQL connection string from Supabase |
| `AVATAR_BUCKET` | Supabase Storage bucket name for avatars (default: `avatars`) |
| `MAX_SEATS_PER_GAME` | Maximum seats per table (default: `8`) |

### 3. Database setup

Run migrations to create the required tables:

```bash
pnpm db:migrate
```

Then create a Supabase Storage bucket named **avatars** and set it to **public**.

### 4. Start development

```bash
pnpm dev          # starts both web and server in parallel
pnpm dev:web      # just the frontend on :3000
pnpm dev:server   # just the socket server on :3001
```

## Features

- Email/password authentication via Supabase Auth
- User profiles with avatar uploads
- Game creation with configurable blinds and buy-ins
- Real-time lobby with live seat updates
- Full poker table UI with 8 seats
- No-Limit Texas Hold'em gameplay
- Side pot calculation
- Hand history persistence
- Game results with settlement minimization
- Who-owes-who calculation at game end

## Architecture

The application uses a **server-authoritative** model:

- **Browser** displays the game state and captures player actions
- **Server** runs the game engine entirely in memory (`GameState`), validates all actions, and broadcasts state updates over Socket.IO
- **Database** persists completed hands, game results, and player profiles
- **Hole cards are private** -- only sent to the socket connection that owns them, never broadcast to other players

This means clients cannot cheat by manipulating local state. All game logic (dealing, betting rounds, hand evaluation, pot splitting) runs on the server.

## Testing

```bash
pnpm test         # runs game engine tests (59 tests via Vitest)
```

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/profile` | Edit display name and avatar |
| `/games` | Game lobby -- browse and join tables |
| `/games/create` | Create a new game table |
| `/games/[id]` | Game detail / seat selection |
| `/games/[id]/play` | Live poker table |
| `/games/[id]/results` | Game results and settlements |
| `/auth/callback` | Supabase auth callback handler |

## Known Limitations / V1 Scope

- No tournament mode
- No private invite system
- No in-app payment processing
- No multiple poker variants (Hold'em only)
- Timer for player actions is cosmetic only (server does not auto-fold)
- No spectator chat
