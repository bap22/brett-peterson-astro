// Jangki (Korean Chess) Game Logic

export type PieceType = 'janggun' | 'sa' | 'sang' | 'ma' | 'cha' | 'po' | 'byeol';
export type Player = 'red' | 'blue';

export interface Piece {
  type: PieceType;
  player: Player;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  moves: Move[];
  gameOver: boolean;
  winner?: Player;
  roomId: string;
  players: {
    red?: string;
    blue?: string;
  };
  startTime: number;
}

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(10).fill(null).map(() => Array(9).fill(null));

  // Blue pieces (top) - Palace: rows 0-2, cols 3-5
  board[0][4] = { type: 'janggun', player: 'blue' };  // Center of palace back row
  board[0][3] = { type: 'sa', player: 'blue' };       // Left guard
  board[0][5] = { type: 'sa', player: 'blue' };       // Right guard
  board[0][2] = { type: 'sang', player: 'blue' };     // Left elephant
  board[0][6] = { type: 'sang', player: 'blue' };     // Right elephant
  board[0][0] = { type: 'cha', player: 'blue' };      // Left chariot
  board[0][8] = { type: 'cha', player: 'blue' };      // Right chariot
  board[0][1] = { type: 'ma', player: 'blue' };       // Left horse
  board[0][7] = { type: 'ma', player: 'blue' };       // Right horse
  board[2][1] = { type: 'po', player: 'blue' };       // Left cannon
  board[2][7] = { type: 'po', player: 'blue' };       // Right cannon
  board[3][0] = { type: 'byeol', player: 'blue' };    // Left soldier
  board[3][2] = { type: 'byeol', player: 'blue' };
  board[3][4] = { type: 'byeol', player: 'blue' };    // Center soldier
  board[3][6] = { type: 'byeol', player: 'blue' };
  board[3][8] = { type: 'byeol', player: 'blue' };    // Right soldier

  // Red pieces (bottom) - Palace: rows 7-9, cols 3-5
  board[9][4] = { type: 'janggun', player: 'red' };   // Center of palace back row
  board[9][3] = { type: 'sa', player: 'red' };        // Left guard
  board[9][5] = { type: 'sa', player: 'red' };        // Right guard
  board[9][2] = { type: 'sang', player: 'red' };      // Left elephant
  board[9][6] = { type: 'sang', player: 'red' };      // Right elephant
  board[9][0] = { type: 'cha', player: 'red' };       // Left chariot
  board[9][8] = { type: 'cha', player: 'red' };       // Right chariot
  board[9][1] = { type: 'ma', player: 'red' };        // Left horse
  board[9][7] = { type: 'ma', player: 'red' };        // Right horse
  board[7][1] = { type: 'po', player: 'red' };        // Left cannon
  board[7][7] = { type: 'po', player: 'red' };        // Right cannon
  board[6][0] = { type: 'byeol', player: 'red' };     // Left soldier
  board[6][2] = { type: 'byeol', player: 'red' };
  board[6][4] = { type: 'byeol', player: 'red' };     // Center soldier
  board[6][6] = { type: 'byeol', player: 'red' };
  board[6][8] = { type: 'byeol', player: 'red' };     // Right soldier

  return board;
}

export function createInitialGame(roomId: string): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'red',
    moves: [],
    gameOver: false,
    roomId,
    players: {},
    startTime: Date.now(),
  };
}

function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 9;
}

export function getValidMoves(board: (Piece | null)[][], pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, player } = piece;

  switch (type) {
    case 'janggun': moves.push(...getPalaceMoves(pos, player)); break;
    case 'sa': moves.push(...getSaMoves(pos, player)); break;
    case 'sang': moves.push(...getElephantMoves(board, pos, player)); break;
    case 'ma': moves.push(...getHorseMoves(board, pos, player)); break;
    case 'cha': moves.push(...getChariotMoves(board, pos, player)); break;
    case 'po': moves.push(...getCannonMoves(board, pos, player)); break;
    case 'byeol': moves.push(...getSoldierMoves(pos, player)); break;
  }

  return moves.filter(move => {
    const targetPiece = board[move.row][move.col];
    return !targetPiece || targetPiece.player !== player;
  });
}

// Palace movement for General (janggun) - can move orthogonally and diagonally within palace
function getPalaceMoves(pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  const palaceRows = player === 'red' ? [7, 8, 9] : [0, 1, 2];
  const palaceCols = [3, 4, 5];
  
  // All 8 directions (orthogonal + diagonal)
  const directions = [
    { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
    { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
  ];

  for (const dir of directions) {
    const newRow = pos.row + dir.dr;
    const newCol = pos.col + dir.dc;
    if (palaceRows.includes(newRow) && palaceCols.includes(newCol)) {
      moves.push({ row: newRow, col: newCol });
    }
  }
  return moves;
}

// Guard (sa) movement - same as general, orthogonal and diagonal within palace
function getSaMoves(pos: Position, player: Player): Position[] {
  return getPalaceMoves(pos, player);
}

function getElephantMoves(board: (Piece | null)[][], pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  // Elephant moves: 1 step orthogonally, then 2 steps diagonally (blocked by first step)
  const patterns = [
    { first: { dr: -1, dc: 0 }, second: { dr: -2, dc: -1 } },
    { first: { dr: -1, dc: 0 }, second: { dr: -2, dc: 1 } },
    { first: { dr: 1, dc: 0 }, second: { dr: 2, dc: -1 } },
    { first: { dr: 1, dc: 0 }, second: { dr: 2, dc: 1 } },
    { first: { dr: 0, dc: -1 }, second: { dr: -1, dc: -2 } },
    { first: { dr: 0, dc: -1 }, second: { dr: 1, dc: -2 } },
    { first: { dr: 0, dc: 1 }, second: { dr: -1, dc: 2 } },
    { first: { dr: 0, dc: 1 }, second: { dr: 1, dc: 2 } },
  ];

  for (const pattern of patterns) {
    const firstPos = { row: pos.row + pattern.first.dr, col: pos.col + pattern.first.dc };
    const finalPos = { row: pos.row + pattern.second.dr, col: pos.col + pattern.second.dc };
    if (isValidPosition(firstPos) && isValidPosition(finalPos) && !board[firstPos.row][firstPos.col]) {
      const targetPiece = board[finalPos.row][finalPos.col];
      if (!targetPiece || targetPiece.player !== player) {
        moves.push(finalPos);
      }
    }
  }
  return moves;
}

function getHorseMoves(board: (Piece | null)[][], pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  // Horse moves: 1 step orthogonally, then 1 step diagonally (blocked by first step)
  const patterns = [
    { first: { dr: -1, dc: 0 }, second: { dr: -1, dc: -1 } },
    { first: { dr: -1, dc: 0 }, second: { dr: -1, dc: 1 } },
    { first: { dr: 1, dc: 0 }, second: { dr: 1, dc: -1 } },
    { first: { dr: 1, dc: 0 }, second: { dr: 1, dc: 1 } },
    { first: { dr: 0, dc: -1 }, second: { dr: -1, dc: -1 } },
    { first: { dr: 0, dc: -1 }, second: { dr: 1, dc: -1 } },
    { first: { dr: 0, dc: 1 }, second: { dr: -1, dc: 1 } },
    { first: { dr: 0, dc: 1 }, second: { dr: 1, dc: 1 } },
  ];

  for (const pattern of patterns) {
    const firstPos = { row: pos.row + pattern.first.dr, col: pos.col + pattern.first.dc };
    const finalPos = { row: pos.row + pattern.second.dr, col: pos.col + pattern.second.dc };
    if (isValidPosition(firstPos) && isValidPosition(finalPos) && !board[firstPos.row][firstPos.col]) {
      const targetPiece = board[finalPos.row][finalPos.col];
      if (!targetPiece || targetPiece.player !== player) {
        moves.push(finalPos);
      }
    }
  }
  return moves;
}

function getChariotMoves(board: (Piece | null)[][], pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];

  for (const dir of directions) {
    let newRow = pos.row + dir.dr;
    let newCol = pos.col + dir.dc;
    while (isValidPosition({ row: newRow, col: newCol })) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (targetPiece.player !== player) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      newRow += dir.dr;
      newCol += dir.dc;
    }
  }
  return moves;
}

function getCannonMoves(board: (Piece | null)[][], pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];

  for (const dir of directions) {
    let newRow = pos.row + dir.dr;
    let newCol = pos.col + dir.dc;
    let jumped = false;
    while (isValidPosition({ row: newRow, col: newCol })) {
      const targetPiece = board[newRow][newCol];
      if (!jumped) {
        if (targetPiece) jumped = true;
      } else {
        if (!targetPiece) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (targetPiece.player !== player) {
            moves.push({ row: newRow, col: newCol });
          }
          break;
        }
      }
      newRow += dir.dr;
      newCol += dir.dc;
    }
  }
  return moves;
}

function getSoldierMoves(pos: Position, player: Player): Position[] {
  const moves: Position[] = [];
  const forward = player === 'red' ? -1 : 1;
  
  // Forward move
  const forwardPos = { row: pos.row + forward, col: pos.col };
  if (isValidPosition(forwardPos)) moves.push(forwardPos);
  
  // Diagonal forward moves (only in enemy territory - rows 0-4 for red, 5-9 for blue)
  const inEnemyTerritory = player === 'red' ? pos.row <= 5 : pos.row >= 4;
  if (inEnemyTerritory) {
    const diagLeft = { row: pos.row + forward, col: pos.col - 1 };
    const diagRight = { row: pos.row + forward, col: pos.col + 1 };
    if (isValidPosition(diagLeft)) moves.push(diagLeft);
    if (isValidPosition(diagRight)) moves.push(diagRight);
  }
  
  return moves;
}

export function makeMove(state: GameState, from: Position, to: Position): GameState | null {
  const piece = state.board[from.row][from.col];
  if (!piece || piece.player !== state.currentPlayer) return null;

  const validMoves = getValidMoves(state.board, from);
  if (!validMoves.some(m => m.row === to.row && m.col === to.col)) return null;

  const newBoard = state.board.map(row => [...row]);
  const captured = newBoard[to.row][to.col];
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  let gameOver = false;
  let winner: Player | undefined;
  if (captured?.type === 'janggun') {
    gameOver = true;
    winner = state.currentPlayer;
  }

  return {
    ...state,
    board: newBoard,
    currentPlayer: state.currentPlayer === 'red' ? 'blue' : 'red',
    moves: [...state.moves, { from, to, piece, captured }],
    gameOver,
    winner,
  };
}
