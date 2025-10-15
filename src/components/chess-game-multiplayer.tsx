'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { Chessboard } from 'react-chessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User as UserIcon, Clock } from 'lucide-react';
import { ref, onValue, update, off } from "firebase/database";
import { useFirebase } from '@/firebase';
import { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface Player {
    uid: string;
    displayName: string;
    photoURL: string;
}

interface GameData {
    fen: string;
    players: Record<string, Player>;
    turn: 'w' | 'b';
    status: 'waiting' | 'active' | 'finished';
    winner?: string;
    playerClocks: Record<string, number>;
    lastMoveTimestamp: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function ChessGame({ gameId, currentUser }: { gameId: string, currentUser: User }) {
  const game = useMemo(() => new Chess(), []);
  const { db } = useFirebase();
  
  const [fen, setFen] = useState('start');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const gameRef = useMemo(() => db ? ref(db, `games/${gameId}`) : null, [db, gameId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const playerColor = useMemo(() => {
      if (!gameData || !currentUser) return null;
      const playerUIDs = Object.keys(gameData.players);
      return playerUIDs[0] === currentUser.uid ? 'w' : 'b';
  }, [gameData, currentUser]);
  
  const opponent = useMemo(() => {
      if (!gameData || !currentUser) return null;
      const opponentUID = Object.keys(gameData.players).find(uid => uid !== currentUser.uid);
      return opponentUID ? gameData.players[opponentUID] : null;
  }, [gameData, currentUser]);


  useEffect(() => {
    if (!gameRef) return;

    const onGameUpdate = (snapshot: any) => {
        const data = snapshot.val();
        if (!data) return;
        setGameData(data);
        if (data.fen !== game.fen()) {
            game.load(data.fen);
        }
        setFen(game.fen());
    };

    onValue(gameRef, onGameUpdate);

    return () => {
        off(gameRef, 'value', onGameUpdate);
    };
  }, [gameRef, game]);


  // Clock management
  useEffect(() => {
    if (gameData?.status !== 'active' || game.turn() !== playerColor) return;

    const interval = setInterval(() => {
        if (!gameRef || !gameData.lastMoveTimestamp) return;
        
        const now = Date.now();
        const diffSeconds = Math.floor((now - gameData.lastMoveTimestamp) / 1000);
        const currentPlayerUID = Object.keys(gameData.players).find(uid => gameData.players[uid] && (game.turn() === 'w' ? 0 : 1) === (Object.keys(gameData.players).indexOf(uid)));
        
        if (!currentPlayerUID) return;

        let newTime = gameData.playerClocks[currentPlayerUID] - diffSeconds;
        if(newTime < 0) newTime = 0;
        
        // This is a local update for UI responsiveness, Firebase is the source of truth
        setGameData(prev => prev ? ({...prev, playerClocks: {...prev.playerClocks, [currentPlayerUID]: newTime }}) : null);

    }, 1000);

    return () => clearInterval(interval);
  }, [gameData, game, gameRef, playerColor]);


  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    if (!gameData || gameData.status !== 'active' || game.turn() !== playerColor || !gameRef) {
      return false;
    }

    const gameCopy = new Chess(fen);
    let move: Move | null = null;
    try {
        move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });
    } catch(e) {
        return false;
    }
    
    if (move === null) return false;
    
    const newFen = gameCopy.fen();
    const isCheckmate = gameCopy.isCheckmate();
    const isDraw = gameCopy.isDraw();

    const updates: Partial<GameData> = {
        fen: newFen,
        turn: gameCopy.turn(),
        lastMoveTimestamp: Date.now() as any // Firebase will convert this
    };

    if (isCheckmate || isDraw) {
        updates.status = 'finished';
        if(isCheckmate) updates.winner = currentUser.displayName || 'Player';
    }

    update(gameRef, updates);
    
    return true;
  }
  
  const handleReset = () => {
    if (!gameRef || !gameData) return;
    const playerUIDs = Object.keys(gameData.players);

    update(gameRef, { 
        fen: 'start', 
        turn: 'w',
        status: playerUIDs.length < 2 ? 'waiting' : 'active',
        winner: null,
        playerClocks: {
            [playerUIDs[0]]: 600,
            ...(playerUIDs[1] && { [playerUIDs[1]]: 600 })
        },
        lastMoveTimestamp: Date.now()
    });
  };

  const getStatusText = () => {
    if (!gameData) return "Loading game...";
    
    switch(gameData.status) {
        case 'waiting':
            return 'Waiting for opponent to join...';
        case 'active':
            const moveColor = game.turn() === 'w' ? 'White' : 'Black';
            const turnPlayerName = game.turn() === playerColor ? 'Your' : `${opponent?.displayName || 'Opponent'}'s`;
            let text = `${turnPlayerName} turn (${moveColor})`;
            if (game.inCheck()) {
                text += ' - Check!';
            }
            return text;
        case 'finished':
            if (gameData.winner) {
                return `Checkmate! ${gameData.winner} wins.`;
            }
            return "It's a draw!";
        default:
            return "Loading..."
    }
  }
  
  if (!isClient || !db || !gameData) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
  return (
    <Card className="w-full max-w-6xl mx-auto shadow-2xl rounded-xl my-8">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-headline">ChessMate Multiplayer</CardTitle>
        <CardDescription>Game ID: {gameId}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 items-start justify-center gap-8 p-4 md:p-6">
        <div className="w-full h-full flex items-center justify-center lg:col-span-2">
            <div className="w-full max-w-[400px] md:max-w-[560px] lg:max-w-[640px] aspect-square">
                <Chessboard
                    id="ReactChessboardMultiplayer"
                    position={fen}
                    onPieceDrop={onDrop}
                    boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                    arePiecesDraggable={gameData.status === 'active' && game.turn() === playerColor}
                    customBoardStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                    }}
                    customLightSquareStyle={{ backgroundColor: '#D3D3D3' }}
                    customDarkSquareStyle={{ backgroundColor: '#808080' }}
                />
            </div>
        </div>
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-4 p-4 bg-accent/30 rounded-lg border">
            <h3 className="font-semibold text-lg">Game Info</h3>
            <p className="text-sm font-bold text-center">{getStatusText()}</p>
            <div className="flex flex-col gap-4">
                <PlayerInfo player={opponent} time={gameData.playerClocks[opponent?.uid || '']} isOpponent={true} />
                <PlayerInfo player={currentUser} time={gameData.playerClocks[currentUser.uid]} />
            </div>
             <Button onClick={handleReset} disabled={gameData?.players && Object.keys(gameData.players).length < 2}>
              Reset Game
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PlayerInfo = ({ player, time, isOpponent = false }: { player: User | Player | null, time: number, isOpponent?: boolean}) => {
    const name = player?.displayName || (isOpponent ? "Opponent" : "You");
    const image = player?.photoURL || undefined;

    return (
        <div className="flex items-center justify-between p-3 bg-background rounded-md border">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={image} alt={name}/>
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <span className="font-semibold">{name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono bg-muted px-3 py-1 rounded-md">
                <Clock className="h-4 w-4" />
                <span>{formatTime(time ?? 600)}</span>
            </div>
        </div>
    )
}
