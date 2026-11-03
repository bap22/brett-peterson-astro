// Jangki game store. Replaces the original in-memory Map, which lost games whenever
// Vercel routed the two players to different serverless instances.
import { createStore } from '../../lib/kv';
import { createInitialGame, type GameState } from './rules';

export interface ChatMessage { id: string; playerId: string; playerColor?: 'red' | 'blue'; text: string; timestamp: number }
interface Room { game: GameState; chat: ChatMessage[] }

const store = createStore('jangki');
const TTL = 60 * 60 * 24; // rooms expire after a day of inactivity

export const getRoom = (roomId: string) => store.get<Room>(`room:${roomId}`);
export const saveRoom = (roomId: string, room: Room) => store.set(`room:${roomId}`, room, TTL);
export const deleteRoom = (roomId: string) => store.del(`room:${roomId}`);

export async function createRoom(roomId: string) {
  const room: Room = { game: createInitialGame(roomId), chat: [] };
  await saveRoom(roomId, room);
  return room;
}

export async function listRooms() {
  const keys = await store.keys('room:*');
  const rooms = await Promise.all(keys.map((k) => store.get<Room>(k)));
  return rooms.filter((r): r is Room => Boolean(r));
}
