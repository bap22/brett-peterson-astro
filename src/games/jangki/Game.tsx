
import { useState, useEffect, useCallback, useRef } from 'react';
import { getValidMoves, type GameState, type Piece, type Player, type Position, type Move } from "./rules";
import Board from './Board';

interface ChatMessage {
  id: string;
  playerId: string;
  playerColor?: Player;
  text: string;
  timestamp: number;
}

export default function GamePage({ roomId }: { roomId: string }) {
  const router = { push: (u: string) => { window.location.href = u === '/' ? '/games/jangki' : u; } };
  
  const [game, setGame] = useState<GameState | null>(null);
  // Keep the same seat across refreshes.
  const [playerId] = useState(() => {
    const key = `jangki:${roomId}:player`;
    try { const saved = localStorage.getItem(key); if (saved) return saved; } catch {}
    const id = `player-${Math.random().toString(36).slice(2, 9)}`;
    try { localStorage.setItem(key, id); } catch {}
    return id;
  });
  const [myColor, setMyColor] = useState<Player | null>(null);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/jangki/games/${roomId}?chat=1`);
      if (!res.ok) throw new Error('Game not found');
      const { chat, ...data } = await res.json();
      setGame(data);
      setChatMessages(chat ?? []);
      
      if (data.players.red === playerId) setMyColor('red');
      else if (data.players.blue === playerId) setMyColor('blue');
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load game');
      setLoading(false);
    }
  }, [roomId, playerId]);

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function joinGame() {
    try {
      await fetch(`/api/jangki/games/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', playerId }),
      });
      fetchGame();
    } catch (err) {
      setError('Failed to join game');
    }
  }

  async function makeMove(from: Position, to: Position) {
    if (!game || !myColor || game.currentPlayer !== myColor) return;
    
    try {
      const res = await fetch(`/api/jangki/games/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', from, to, playerId }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid move');
      }
      
      setSelectedPos(null);
      setValidMoves([]);
      fetchGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid move');
      setTimeout(() => setError(null), 2000);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !game) return;
    
    try {
      await fetch(`/api/jangki/games/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'chat',
          playerId, 
          playerColor: myColor,
          text: chatInput.trim() 
        }),
      });
      setChatInput('');
    } catch (err) {
      console.error('Failed to send chat:', err);
    }
  }

  function handleSquareClick(pos: Position, piece: Piece | null) {
    if (!game || !myColor || game.gameOver) return;
    if (game.currentPlayer !== myColor) return;

    if (selectedPos && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      makeMove(selectedPos, pos);
      return;
    }

    if (piece && piece.player === myColor) {
      setSelectedPos(pos);
      const moves = getValidMoves(game.board, pos);
      setValidMoves(moves);
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  }

  const formatMove = (move: Move, index: number): string => {
    const fromCol = String.fromCharCode(65 + move.from.col);
    const fromRow = 10 - move.from.row;
    const toCol = String.fromCharCode(65 + move.to.col);
    const toRow = 10 - move.to.row;
    
    const pieceNames: Record<string, string> = {
      'janggun': 'General',
      'sa': 'Guard',
      'sang': 'Elephant',
      'ma': 'Horse',
      'cha': 'Chariot',
      'po': 'Cannon',
      'byeol': 'Soldier',
    };
    
    const pieceName = pieceNames[move.piece.type];
    const capture = move.captured ? ` captures ${pieceNames[move.captured.type]}` : '';
    
    return `${index + 1}. ${move.piece.player === 'red' ? '🔴' : '🔵'} ${pieceName} ${fromCol}${fromRow} → ${toCol}${toRow}${capture}`;
  };

  if (loading) {
    return <div style={styles.center}>Loading game...</div>;
  }

  if (error || !game) {
    return (
      <div style={styles.center}>
        <p style={styles.errorMessage}>{error || 'Game not found'}</p>
        <button onClick={() => router.push('/')} style={styles.button}>Back to Home</button>
      </div>
    );
  }

  if (!myColor) {
    return (
      <div style={styles.center}>
        <h2 style={styles.roomTitle}>🎮 Room: {roomId}</h2>
        <p style={styles.waitingText}>Players: {Object.keys(game.players).length}/2</p>
        <button onClick={joinGame} style={styles.button}>
          {game.players.red ? 'Join as Blue' : 'Join as Red'}
        </button>
        <p style={styles.hint}>Share this room ID with your opponent</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 Jangki</h1>
        <div style={styles.status}>
          <span style={styles.statusItem}>🏠 <strong>{roomId}</strong></span>
          <span style={styles.statusItem}>👤 <strong style={{ color: myColor === 'red' ? '#dc2626' : '#2563eb' }}>{myColor.toUpperCase()}</strong></span>
          <span style={styles.statusItem}>🎯 <strong style={{ color: game.currentPlayer === 'red' ? '#dc2626' : '#2563eb' }}>{game.currentPlayer.toUpperCase()}</strong></span>
        </div>
      </div>

      {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

      {game.gameOver && (
        <div style={styles.gameOver}>
          <h2>🏆 Game Over!</h2>
          <p style={styles.winnerText}>
            Winner: <strong style={{ color: game.winner === 'red' ? '#dc2626' : '#2563eb' }}>{game.winner?.toUpperCase()}</strong>
          </p>
          <button onClick={() => router.push('/')} style={styles.button}>Play Again</button>
        </div>
      )}

      {!game.players.blue && (
        <div style={styles.waiting}>
          ⏳ Waiting for opponent to join...
        </div>
      )}

      {game.players.blue && game.currentPlayer === myColor && !game.gameOver && (
        <div style={styles.yourTurn}>✅ Your turn!</div>
      )}

      {game.players.blue && game.currentPlayer !== myColor && !game.gameOver && (
        <div style={styles.theirTurn}>⏳ Opponent's turn...</div>
      )}

      <div style={styles.gameArea}>
        <div style={styles.boardSection}>
          <Board
            board={game.board}
            selectedPos={selectedPos}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            perspective={myColor}
          />
        </div>

        <div style={styles.sidebar}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>📜 Move Log</h3>
            <div style={styles.moveLog}>
              {game.moves.length === 0 ? (
                <p style={styles.emptyLog}>No moves yet</p>
              ) : (
                game.moves.map((move, index) => (
                  <div key={index} style={styles.moveEntry}>
                    {formatMove(move, index)}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>💬 Chat</h3>
            <div style={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <p style={styles.emptyChat}>Say something!</p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={msg.id || index} style={styles.chatMessage}>
                    <span style={{ 
                      ...styles.chatPlayer, 
                      color: msg.playerColor === 'red' ? '#dc2626' : '#2563eb' 
                    }}>
                      {msg.playerColor ? `${msg.playerColor.toUpperCase()}` : 'System'}:
                    </span>
                    <span style={styles.chatText}>{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={styles.chatInput}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message..."
                style={styles.input}
                maxLength={200}
              />
              <button onClick={sendChat} style={styles.chatButton}>Send</button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button onClick={() => router.push('/')} style={styles.secondaryButton}>← Back to Lobby</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em',
  },
  status: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    fontSize: '1rem',
    color: '#4b5563',
  },
  statusItem: {
    fontSize: '1rem',
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  roomTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  errorBanner: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: '500',
    border: '1px solid #fecaca',
  },
  errorMessage: {
    color: '#dc2626',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  gameOver: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    marginBottom: '1rem',
    color: '#1a1a1a',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  winnerText: {
    fontSize: '1.25rem',
    margin: '1rem 0',
  },
  waiting: {
    textAlign: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: '500',
    border: '1px solid #bfdbfe',
  },
  waitingText: {
    color: '#6b7280',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  hint: {
    color: '#9ca3af',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
  yourTurn: {
    textAlign: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: '600',
    border: '1px solid #bbf7d0',
  },
  theirTurn: {
    textAlign: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: '500',
    border: '1px solid #fde68a',
  },
  gameArea: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  boardSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '300px',
    maxWidth: '340px',
  },
  panel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  panelTitle: {
    color: '#1a1a1a',
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #f3f4f6',
  },
  moveLog: {
    maxHeight: '220px',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    fontFamily: 'system-ui, sans-serif',
    border: '1px solid #e5e7eb',
  },
  moveEntry: {
    padding: '0.35rem 0',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
  },
  emptyLog: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  chatMessages: {
    maxHeight: '220px',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.9rem',
    border: '1px solid #e5e7eb',
  },
  chatMessage: {
    padding: '0.35rem 0',
    borderBottom: '1px solid #f3f4f6',
  },
  chatPlayer: {
    fontWeight: '700',
  },
  chatText: {
    color: '#374151',
    marginLeft: '0.5rem',
  },
  emptyChat: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  chatInput: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  input: {
    flex: 1,
    padding: '0.625rem',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#1a1a1a',
    fontSize: '0.9rem',
    outline: 'none',
  },
  chatButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  button: {
    padding: '1rem 2rem',
    fontSize: '1.05rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'white',
    color: '#4b5563',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
};
