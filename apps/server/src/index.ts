// ============================================================
// Poker Socket.IO Server
// ============================================================

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables from the repo-root .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { gameHandler } from './handlers/gameHandler.js';
import { authMiddleware } from './middleware/auth.js';

const PORT = Number(process.env.PORT) || 3001;

// --- Express + HTTP ---
const app = express();
const httpServer = createServer(app);

// Health-check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Socket.IO ---
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Auth middleware – verifies Supabase JWT on every connection
io.use(authMiddleware);

// Connection handler
io.on('connection', (socket) => {
  console.log(`[socket.io] Client connected: ${socket.id} (userId: ${socket.data.userId})`);

  // Register game event listeners
  gameHandler(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`[socket.io] Client disconnected: ${socket.id} (reason: ${reason})`);
  });
});

// --- Start ---
httpServer.listen(PORT, () => {
  console.log(`[server] Poker server listening on port ${PORT}`);
});
