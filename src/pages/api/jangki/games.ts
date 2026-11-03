import type { APIRoute } from 'astro';
import { createRoom, listRooms } from '../../../games/jangki/store';

export const prerender = false;

export const GET: APIRoute = async () => {
  const rooms = await listRooms();
  return Response.json(rooms.map(({ game }) => ({
    roomId: game.roomId, players: game.players, gameOver: game.gameOver, startTime: game.startTime,
  })));
};

export const POST: APIRoute = async () => {
  const roomId = crypto.randomUUID().slice(0, 8);
  const { game } = await createRoom(roomId);
  return Response.json({ roomId, game });
};
