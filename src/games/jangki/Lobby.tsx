
import { useState, useEffect } from 'react';

export default function Home() {
  const router = { push: (u: string) => { window.location.href = u; } };
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState('');
  const [games, setGames] = useState<Array<{
    roomId: string;
    players: { red?: string; blue?: string };
    gameOver: boolean;
  }>>([]);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchGames() {
    try {
      const res = await fetch('/api/jangki/games');
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    }
  }

  async function createGame() {
    setCreating(true);
    try {
      const res = await fetch('/api/jangki/games', { method: 'POST' });
      const data = await res.json();
      router.push(`/games/jangki/${data.roomId}`);
    } catch (err) {
      console.error('Failed to create game:', err);
    }
    setCreating(false);
  }

  async function joinGame(roomId: string) {
    try {
      const playerId = `player-${Math.random().toString(36).slice(2, 9)}`;
      await fetch(`/api/jangki/games/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', playerId }),
      });
      router.push(`/games/jangki/${roomId}`);
    } catch (err) {
      console.error('Failed to join game:', err);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>🎮 Jangki</h1>
        <p style={styles.subtitle}>Korean Chess — Challenge a friend online</p>
      </div>

      <div style={styles.actions}>
        <button
          onClick={createGame}
          disabled={creating}
          style={styles.primaryButton}
        >
          {creating ? 'Creating...' : 'Create New Game'}
        </button>

        <div style={styles.joinSection}>
          <input
            type="text"
            value={joiningId}
            onChange={(e) => setJoiningId(e.target.value)}
            placeholder="Enter Room ID"
            style={styles.input}
          />
          <button
            onClick={() => joinGame(joiningId)}
            disabled={!joiningId}
            style={styles.secondaryButton}
          >
            Join
          </button>
        </div>
      </div>

      {games.length > 0 && (
        <div style={styles.gamesSection}>
          <h2 style={styles.sectionTitle}>Active Games</h2>
          <div style={styles.gamesList}>
            {games.map((game) => (
              <div key={game.roomId} style={styles.gameCard}>
                <div style={styles.gameInfo}>
                  <span style={styles.roomId}>{game.roomId}</span>
                  <span style={styles.players}>
                    {Object.keys(game.players).length}/2 players
                  </span>
                  {game.gameOver && <span style={styles.finished}>Finished</span>}
                </div>
                <button
                  onClick={() => joinGame(game.roomId)}
                  disabled={Object.keys(game.players).length >= 2 || game.gameOver}
                  style={styles.joinButton}
                >
                  {Object.keys(game.players).length >= 2 ? 'Full' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.rulesSection}>
        <h3 style={styles.rulesTitle}>📖 How to Play</h3>
        <p style={styles.rulesText}>
          Janggi (Korean Chess) is a strategic board game for two players. 
          Capture your opponent's General to win!
        </p>
        <a 
          href="https://www.ymimports.com/pages/how-to-play-janggi" 
          target="_blank" 
          rel="noopener noreferrer"
          style={styles.rulesLink}
        >
          Learn the Rules →
        </a>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '3rem 2rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#fafafa',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#6b7280',
    fontWeight: '400',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '3rem',
    alignItems: 'center',
  },
  primaryButton: {
    padding: '1rem 2.5rem',
    fontSize: '1.125rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
  },
  joinSection: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '400px',
  },
  input: {
    flex: 1,
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  secondaryButton: {
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  gamesSection: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  gamesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  gameCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 0.2s',
  },
  gameInfo: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  roomId: {
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: '1rem',
    color: '#1a1a1a',
    backgroundColor: '#f3f4f6',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
  },
  players: {
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  finished: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  joinButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
  },
  rulesSection: {
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  rulesTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '0.75rem',
  },
  rulesText: {
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '1.25rem',
  },
  rulesLink: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f3f4f6',
    color: '#1a1a1a',
    textDecoration: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};
