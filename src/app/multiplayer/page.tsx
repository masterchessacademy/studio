'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChessGame } from '@/components/chess-game-multiplayer';
import { get, ref, set, child } from 'firebase/database';
import { useFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';


export default function MultiplayerPage() {
  const [gameId, setGameId] = useState('');
  const [joinedGame, setJoinedGame] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState('');
  const { db } = useFirebase();

  useEffect(() => {
    // Generate playerId only on the client-side to avoid hydration errors
    setPlayerId('player-' + Math.random().toString(36).substr(2, 9));
  }, []);

  const gamesRef = db ? ref(db, 'games') : null;

  async function createGame(newGameId: string) {
    if (!gamesRef) return;
    const gameRef = child(gamesRef, newGameId);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
      await set(gameRef, {
        fen: 'start',
        players: [],
        turn: 'w',
      });
    }
  }

  async function joinGame(id: string, pId: string) {
    if (!gamesRef || !pId) return false;
    const gameRef = child(gamesRef, id);
    const snapshot = await get(gameRef);
    const game = snapshot.val();
    
    // Allow rejoining if already in the game
    if (game && game.players.includes(pId)) {
        return true;
    }

    if (game && game.players.length < 2 && !game.players.includes(pId)) {
      const updatedPlayers = [...game.players, pId];
      await set(child(gameRef, 'players'), updatedPlayers);
      return true;
    }
    
    return false;
  }

  const handleCreateGame = async () => {
    if (!db) return;
    const newGameId = Math.random().toString(36).substr(2, 9);
    await createGame(newGameId);
    setGameId(newGameId);
    await handleJoinGame(newGameId);
  };

  const handleJoinGame = async (id: string) => {
    if (!db) return;
    if(!id) {
        setError('Please enter a game ID.');
        return;
    }
    const success = await joinGame(id, playerId);
    if (success) {
      setJoinedGame(id);
      setError('');
    } else {
      setError('Game is full or does not exist.');
    }
  };

  if (!db || !playerId) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>
  }

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinGame(gameId);
                }
              }}
            />
            <Button onClick={() => handleJoinGame(gameId)}>Join Game</Button>
          </div>
          {error && <p className="text-destructive">{error}</p>}
          {gameId && !joinedGame && (
            <p className="text-sm text-muted-foreground">
              Share this game ID with a friend: <span className="font-bold">{gameId}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
