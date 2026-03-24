// ============================================================
// Socket.IO Auth Middleware – Supabase JWT Verification
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Socket } from 'socket.io';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _supabase;
}

/**
 * Socket.IO middleware that verifies the Supabase JWT provided in
 * `socket.handshake.auth.token` and attaches the authenticated
 * `userId` and `userEmail` to `socket.data`.
 *
 * In development mode, a dev bypass is available by passing
 * `x-dev-user-id` in handshake headers.
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    // --- Dev bypass ---
    if (process.env.NODE_ENV === 'development') {
      const devUserId =
        (socket.handshake.headers['x-dev-user-id'] as string | undefined) ??
        (socket.handshake.auth?.devUserId as string | undefined);

      if (devUserId) {
        socket.data.userId = devUserId;
        socket.data.userEmail = `${devUserId}@dev.local`;
        console.log(
          `[auth] Dev bypass: userId=${devUserId}`,
        );
        return next();
      }
    }

    // --- Normal Supabase JWT verification ---
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const {
      data: { user },
      error,
    } = await getSupabase().auth.getUser(token);

    if (error || !user) {
      return next(new Error('Authentication error: invalid token'));
    }

    socket.data.userId = user.id;
    socket.data.userEmail = user.email ?? null;

    next();
  } catch (err) {
    console.error('[auth] Unexpected failure:', err);
    next(new Error('Authentication error: unexpected failure'));
  }
}
