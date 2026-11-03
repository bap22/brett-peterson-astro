import type { APIRoute } from 'astro';
import { getRoom, saveRoom, deleteRoom } from '../../../../games/jangki/store';
import { makeMove, type Position } from '../../../../games/jangki/rules';

export const prerender = false;

const err = (error: string, status: number) => Response.json({ error }, { status });

export const GET: APIRoute = async ({ params, url }) => {
  const room = await getRoom(params.roomId!);
  if (!room) return err('Game not found', 404);
  // ?chat=1 returns the room's chat alongside the game
  if (url.searchParams.get('chat')) return Response.json({ ...room.game, chat: room.chat });
  return Response.json(room.game);
};

export const POST: APIRoute = async ({ params, request }) => {
  const roomId = params.roomId!;
  const room = await getRoom(roomId);
  if (!room) return err('Game not found', 404);
  const { game } = room;

  const body = await request.json().catch(() => ({}));
  const { action, playerId, playerColor, from, to, text } = body as {
    action?: string; playerId?: string; playerColor?: 'red' | 'blue'; from?: Position; to?: Position; text?: string;
  };

  if (action === 'join') {
    if (playerId && game.players.red !== playerId && game.players.blue !== playerId) {
      if (!game.players.red) game.players.red = playerId;
      else if (!game.players.blue) game.players.blue = playerId;
    }
    await saveRoom(roomId, room);
    return Response.json(game);
  }

  if (action === 'move') {
    // Only the seated player whose turn it is may move.
    if (!playerId || game.players[game.currentPlayer] !== playerId) return err('Not your turn', 403);
    const next = from && to ? makeMove(game, from, to) : null;
    if (!next) return err('Invalid move', 400);
    await saveRoom(roomId, { ...room, game: next });
    return Response.json(next);
  }

  if (action === 'chat') {
    if (!text || typeof text !== 'string') return err('Message required', 400);
    room.chat = [...room.chat, { id: crypto.randomUUID(), playerId: playerId ?? 'anon', playerColor, text: text.trim().slice(0, 200), timestamp: Date.now() }].slice(-50);
    await saveRoom(roomId, room);
    return Response.json({ success: true });
  }

  if (action === 'delete') {
    await deleteRoom(roomId);
    return Response.json({ success: true });
  }

  return err('Unknown action', 400);
};
