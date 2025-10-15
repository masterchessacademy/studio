'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChessGame } from '@/components/chess-game-multiplayer';
import { get, ref, set, child, onValue, off, serverTimestamp } from 'firebase/database';
import { useFirebase } from '@/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Loader2, LogOut, Crown, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function MultiplayerPage() {
  const [gameId, setGameId] = useState('');
  const [joinedGame, setJoinedGame] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { db, auth, googleProvider } = useFirebase();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to sign in.");
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const gamesRef = db ? ref(db, 'games') : null;

  const createGame = useCallback(async () => {
    if (!gamesRef || !user) return;
    const newGameId = Math.random().toString(36).substr(2, 9);
    const gameRef = child(gamesRef, newGameId);
    
    const player = { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL };

    await set(gameRef, {
      fen: 'start',
      players: { [user.uid]: player },
      turn: 'w',
      status: 'waiting',
      createdAt: serverTimestamp(),
      playerClocks: { [user.uid]: 600 }
    });
    setJoinedGame(newGameId);
  }, [gamesRef, user]);

  const joinGame = useCallback(async (id: string) => {
    if (!gamesRef || !user) return;
    setError('');
    const gameRef = child(gamesRef, id);
    
    onValue(gameRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setError('Game not found.');
        return;
      }

      const gameData = snapshot.val();
      const players = gameData.players || {};
      const numPlayers = Object.keys(players).length;

      if (!players[user.uid]) {
        if (numPlayers >= 2) {
          setError('Game is full.');
          return;
        }
        
        const newPlayer = { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL };
        await set(child(gameRef, `players/${user.uid}`), newPlayer);
        await set(child(gameRef, `playerClocks/${user.uid}`), 600); // 10 minutes in seconds

        if (numPlayers + 1 === 2) {
            await set(child(gameRef, 'status'), 'active');
        }

      }
      setJoinedGame(id);

    }, { onlyOnce: true });

  }, [gamesRef, user]);

  if (loading || !db || !auth) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>
  }

  if (joinedGame && user) {
    return <ChessGame gameId={joinedGame} currentUser={user} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4"><Users className="h-12 w-12"/></div>
                <CardTitle>Multiplayer Chess</CardTitle>
                <CardDescription>{user ? `Welcome, ${user.displayName}` : "Sign in to play"}</CardDescription>
            </CardHeader>
            {user ? (
                <>
                    <CardContent className="flex flex-col gap-4">
                        <Button onClick={createGame}><Crown className="mr-2 h-4 w-4" /> Create New Game</Button>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Enter Game ID"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && joinGame(gameId)}
                                className="text-center"
                            />
                            <Button onClick={() => joinGame(gameId)} disabled={!gameId}>Join Game</Button>
                        </div>
                        {error && <p className="text-destructive text-center">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-center">
                         <Button variant="ghost" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4"/>Sign Out</Button>
                    </CardFooter>
                </>
            ) : (
                <CardContent>
                    <Button onClick={handleSignIn} className="w-full">
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.7 512 244 512 109.8 512 0 402.2 0 261.8 0 122.4 109.8 13.6 244 13.6c70.3 0 132.3 27.8 177.5 72.9l-63.1 61.9c-27.4-25.2-63.5-40.2-104.4-40.2-84.1 0-152.2 68.2-152.2 152.2s68.1 152.2 152.2 152.2c92.2 0 131.3-64.4 136.8-98.2H244v-73.4h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                        Sign In with Google
                    </Button>
                </CardContent>
            )}
        </Card>
    </main>
  );
}
