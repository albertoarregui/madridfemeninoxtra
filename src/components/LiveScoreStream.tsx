import { useEffect, useState } from 'react';

interface MatchUpdate {
  matchId: number;
  homeScore: number;
  awayScore: number;
  time: string;
  status: 'watching' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  changes: Array<{ field: string; from: any; to: any }>;
}

interface LiveScoreStreamProps {
  matchId: number | string;
  homeTeam?: string;
  awayTeam?: string;
  onGoal?: (data: any) => void;
  onCard?: (data: any) => void;
  onUpdate?: (data: any) => void;
}

export default function LiveScoreStream({
  matchId,
  homeTeam = 'Real Madrid Femenino',
  awayTeam = 'Rival',
  onGoal,
  onCard,
  onUpdate,
}: LiveScoreStreamProps) {
  const [match, setMatch] = useState<MatchUpdate>({
    matchId: Number(matchId),
    homeScore: 0,
    awayScore: 0,
    time: '-',
    status: 'watching',
    lastUpdate: new Date(),
    changes: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [goalAnimating, setGoalAnimating] = useState<'home' | 'away' | null>(
    null
  );

  useEffect(() => {
    console.log(`🎯 Connecting to live stream for match ${matchId}...`);

    const eventSource = new EventSource(`/api/sync/live-stream?matchId=${matchId}`);

    eventSource.addEventListener('connected', (e) => {
      console.log('✅ Connected to live stream');
      const data = JSON.parse(e.data);
      setIsConnected(true);
      setMatch((prev) => ({
        ...prev,
        status: 'connected',
        homeScore: data.data?.goles_rm || 0,
        awayScore: data.data?.goles_rival || 0,
        time: data.data?.tiempo_partido || '-',
      }));
    });

    eventSource.addEventListener('update', (e) => {
      const data = JSON.parse(e.data);
      console.log('📊 Match update:', data);

      setMatch((prev) => ({
        ...prev,
        homeScore: data.data?.goles_rm || prev.homeScore,
        awayScore: data.data?.goles_rival || prev.awayScore,
        time: data.data?.tiempo_partido || prev.time,
        lastUpdate: new Date(data.timestamp),
        changes: data.changes || [],
      }));

      if (onUpdate) onUpdate(data);
    });

    eventSource.addEventListener('goal_scored', (e) => {
      const data = JSON.parse(e.data);
      console.log('⚽ GOAL!', data);

      setGoalAnimating(Number(data.homeScore) > Number(data.awayScore) ? 'home' : 'away');
      setTimeout(() => setGoalAnimating(null), 2000);

      playGoalSound();

      if (onGoal) onGoal(data);
    });

    eventSource.addEventListener('card_shown', (e) => {
      const data = JSON.parse(e.data);
      console.log('🟨 CARD!', data);

      if (onCard) onCard(data);
    });

    eventSource.addEventListener('ping', () => {
    });

    eventSource.addEventListener('error', (e) => {
      console.error('❌ Stream error:', e);
      setIsConnected(false);
      setMatch((prev) => ({
        ...prev,
        status: 'error',
      }));
    });

    eventSource.onerror = () => {
      console.error('Stream closed');
      setIsConnected(false);
      setMatch((prev) => ({
        ...prev,
        status: 'disconnected',
      }));
    };

    return () => {
      console.log('🔌 Disconnecting live stream');
      eventSource.close();
    };
  }, [matchId]);

  const playGoalSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div className="live-score-stream">
      <div
        className={`status-indicator ${
          isConnected ? 'connected' : 'disconnected'
        }`}
      >
        <span className="status-dot"></span>
        {isConnected ? 'En vivo' : 'Reconectando...'}
      </div>

      <div className="scoreboard">
        <div className={`team home ${goalAnimating === 'home' ? 'scoring' : ''}`}>
          <div className="team-info">
            <h3>{homeTeam}</h3>
          </div>
          <div className="score-display">
            <span className="score-number">{match.homeScore}</span>
          </div>
        </div>

        <div className="match-center">
          <div className="match-time">
            <span className="time">{match.time}</span>
          </div>
          <span className="vs">vs</span>
        </div>

        <div className={`team away ${goalAnimating === 'away' ? 'scoring' : ''}`}>
          <div className="score-display">
            <span className="score-number">{match.awayScore}</span>
          </div>
          <div className="team-info">
            <h3>{awayTeam}</h3>
          </div>
        </div>
      </div>

      {match.changes.length > 0 && (
        <div className="updates-feed">
          <h4>Cambios</h4>
          <ul>
            {match.changes.map((change, idx) => (
              <li key={idx} className={`change change-${change.type || 'stat'}`}>
                <span className="change-type">
                  {getChangeEmoji(change.type || '')}
                </span>
                <span className="change-text">
                  {change.field}: {change.from} → {change.to}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="update-info">
        <small>Última actualización: {match.lastUpdate.toLocaleTimeString()}</small>
      </div>

      <style>{`
        .live-score-stream {
          padding: 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          color: white;
          font-family: 'Arial', sans-serif;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff4444;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .status-indicator.connected .status-dot {
          background: #00ff00;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .scoreboard {
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin: 24px 0;
          gap: 16px;
        }

        .team {
          flex: 1;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .team.scoring {
          animation: goalAnimation 0.8s ease-out;
        }

        @keyframes goalAnimation {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }

        .team-info h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.8;
        }

        .score-display {
          margin: 12px 0;
        }

        .score-number {
          font-size: 48px;
          font-weight: bold;
          display: block;
          line-height: 1;
        }

        .match-center {
          text-align: center;
          min-width: 80px;
        }

        .match-time {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .time {
          display: block;
          font-size: 16px;
          color: #ffd700;
        }

        .vs {
          font-size: 12px;
          opacity: 0.6;
        }

        .updates-feed {
          margin-top: 20px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .updates-feed h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .updates-feed ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .change {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .change:last-child {
          border-bottom: none;
        }

        .change-type {
          font-size: 14px;
        }

        .change-text {
          flex: 1;
          opacity: 0.8;
        }

        .change-GOAL {
          color: #00ff00;
        }

        .change-CARD {
          color: #ffaa00;
        }

        .change-STAT {
          color: #cccccc;
        }

        .update-info {
          text-align: right;
          margin-top: 12px;
          opacity: 0.6;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

function getChangeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    GOAL: '⚽',
    CARD: '🟨',
    SUBSTITUTION: '🔄',
    STAT: '📊',
    TIME: '⏱️',
    LINEUP: '👥',
  };
  return emojis[type] || '•';
}
