'use client';

import { useState, useEffect } from 'react';
import { useRouter }from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChessGame } from '@/components/chess-game-multiplayer';

// Mock implementation for real-time functionality
const games = new Map<string, any>();

function createGame(gameId: string) {
  if (!games.has(gameId)) {
    games.set(gameId, {
      fen: 'start',
      players: [],
      turn: 'w',
    });
  }
}

function joinGame(gameId: string, playerId: string) {
    const game = games.get(gameId);
    if (game && game.players.length < 2 && !game.players.includes(playerId)) {
        game.players.push(playerId);
        return true;
    }
    return false;
}

export default function MultiplayerPage() {
  const [gameId, setGameId] = useState('');
  const [joinedGame, setJoinedGame] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const [playerId] = useState(() => 'player-' + Math.random().toString(36).substr(2, 9));


  const handleCreateGame = () => {
    const newGameId = Math.random().toString(36).substr(2, 9);
    createGame(newGameId);
    setGameId(newGameId);
    handleJoinGame(newGameId);
  };

  const handleJoinGame = (id: string) => {
    if(!id) {
        setError('Please enter a game ID.');
        return;
    }
    if (joinGame(id, playerId)) {
      setJoinedGame(id);
      setError('');
    } else {
      setError('Game is full or does not exist.');
    }
  };

  if (joinedGame) {
    return <ChessGame gameId={joinedGame} playerId={playerId} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Multiplayer Chess</CardTitle>
          <CardDescription>Create a new game or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={handleCreateGame}>Create New Game</Button>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <Button onClick={() => handleJoinGame(gameId)}>Join Game</Button>
          </div>
          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
