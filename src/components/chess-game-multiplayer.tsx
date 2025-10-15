'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { Chessboard } from 'react-chessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ref, onValue, update, off } from "firebase/database";
import { useFirebase } from '@/firebase';


export function ChessGame({ gameId, playerId }: { gameId: string, playerId: string }) {
  const game = useMemo(() => new Chess(), []);
  const { db } = useFirebase();
  
  const [fen, setFen] = useState('start');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [status, setStatus] = useState('Waiting for opponent...');
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [gameData, setGameData] = useState<any>(null);

  const gameRef = useMemo(() => db ? ref(db, `games/${gameId}`) : null, [db, gameId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateStatus = useCallback(() => {
    let currentStatus = '';
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.isCheckmate()) {
      currentStatus = `Checkmate! ${moveColor === 'White' ? 'Black' : 'White'} wins.`;
    } else if (game.isDraw()) {
      currentStatus = "It's a draw!";
    } else {
        if (gameData?.players.length < 2) {
            currentStatus = "Waiting for an opponent to join...";
        } else {
            currentStatus = `${moveColor}'s turn to move.`;
        }
      if (game.inCheck()) {
        currentStatus += ` ${moveColor} is in check.`;
      }
    }
    setStatus(currentStatus);
  }, [game, gameData]);

  useEffect(() => {
    if (!gameRef) return;

    const callback = (snapshot: any) => {
        const data = snapshot.val();
        if (!data) return;

        setGameData(data);

        if (data.fen && data.fen !== game.fen()) {
            if(data.fen === 'start') game.reset();
            else game.load(data.fen);
            setFen(game.fen());
        }

        const currentPlayerIsFirstPlayer = data.players[0] === playerId;
        const color = currentPlayerIsFirstPlayer ? 'w' : 'b';
        setPlayerColor(color);
        setIsPlayerTurn(game.turn() === color && data.players.length === 2);
    };

    onValue(gameRef, callback);

    return () => {
        off(gameRef, 'value', callback);
    };
  }, [gameId, playerId, game, gameRef]);

  useEffect(() => {
    updateStatus();
  }, [fen, gameData, updateStatus]);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (!isPlayerTurn || game.turn() !== playerColor || !gameRef) {
      return false;
    }

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) {
      return false;
    }
    
    game.load(gameCopy.fen());
    setFen(game.fen());
    
    update(gameRef, { fen: game.fen(), turn: game.turn() });
    
    return true;
  }
  
  const handleReset = () => {
    if (!gameRef) return;
    game.reset();
    update(gameRef, { fen: 'start', turn: 'w' });
  };
  
  if (!isClient || !db) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
  return (
    <Card className="w-full max-w-5xl mx-auto shadow-2xl rounded-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-headline">ChessMate</CardTitle>
        <CardDescription>Game ID: {gameId}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 items-start justify-center gap-8 p-4 md:p-6">
        <div className="w-full h-full flex items-center justify-center lg:col-span-2">
            <div className="w-full max-w-[400px] md:max-w-[560px] aspect-square">
                <Chessboard
                    id="ReactChessboardMultiplayer"
                    position={fen}
                    onPieceDrop={onDrop}
                    boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                    arePiecesDraggable={isPlayerTurn}
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
            <p className="text-sm">You are playing as <span className="font-bold">{playerColor === 'w' ? 'White' : 'Black'}</span>.</p>
            <Button onClick={handleReset} disabled={gameData?.players.length < 2}>
              Reset Game
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-lg">Status</h3>
            <p className="text-sm text-foreground/80 font-medium">{status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
