'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { Chessboard } from 'react-chessboard';
import { getAiMove } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export function ChessGame() {
  const game = useMemo(() => new Chess(), []);
  
  const [fen, setFen] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [status, setStatus] = useState('Choose your color and start a new game.');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isClient, setIsClient] = useState(false);

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
      currentStatus = `${moveColor}'s turn to move.`;
      if (game.inCheck()) {
        currentStatus += ` ${moveColor} is in check.`;
      }
    }
    setStatus(currentStatus);
  }, [game]);

  const makeAiMove = useCallback(async (retryCount = 0) => {
    if (game.isGameOver() || aiThinking || retryCount > 2) {
      if (retryCount > 2) {
        setAiExplanation("AI is unable to find a valid move. Please try again.");
        setAiThinking(false);
      }
      return;
    }
    setAiThinking(true);
    setAiExplanation('AI is thinking...');
    try {
      const result = await getAiMove(game.fen());
      if (result && result.move) {
        try {
          const moveResult = game.move(result.move);
          if (moveResult === null) {
            console.error('AI suggested an illegal move:', result.move);
            // Retry if the move was illegal
            makeAiMove(retryCount + 1);
            return;
          }
          setFen(game.fen());
          setAiExplanation(`AI played ${result.move}. ${result.explanation}`);
        } catch (e) {
          console.error(`Invalid move from AI: ${result.move}`, e);
          // Retry if the move was invalid
          makeAiMove(retryCount + 1);
          return;
        }
      } else {
        setAiExplanation('AI failed to find a move.');
      }
    } catch (error) {
      console.error(error);
      setAiExplanation('An error occurred while getting AI move.');
    } finally {
      setAiThinking(false);
      updateStatus();
    }
  }, [game, aiThinking, updateStatus]);

  useEffect(() => {
    updateStatus();
  }, [fen, updateStatus]);

  const startNewGame = useCallback(() => {
    game.reset();
    const newFen = game.fen();
    setFen(newFen);
    setAiExplanation('');
    updateStatus();
    if (game.turn() !== playerColor) {
      setTimeout(() => makeAiMove(), 500);
    }
  }, [game, playerColor, makeAiMove, updateStatus]);

  useEffect(() => {
    // This effect ensures the AI moves if the color is switched to black on a new game
    if (game.history().length === 0 && game.turn() !== playerColor) {
      makeAiMove();
    }
  }, [playerColor, game, makeAiMove]);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (game.turn() !== playerColor || aiThinking) {
      return false;
    }

    const gameCopy = new Chess(game.fen());
    let move = null;
    
    try {
        move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // always promote to a queen for simplicity
        });
    } catch(e) {
        // illegal move
        return false;
    }

    // illegal move
    if (move === null) {
      return false;
    }
    
    game.load(gameCopy.fen());
    setFen(game.fen());

    if (!game.isGameOver()) {
      setTimeout(() => makeAiMove(), 250);
    }
    
    return true;
  }
  
  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 items-start justify-center gap-8">
        <div className="w-full h-full flex items-center justify-center lg:col-span-2">
            <div className="w-full max-w-[400px] md:max-w-[560px] aspect-square">
                <Chessboard
                    id="ReactChessboard"
                    position={fen}
                    onPieceDrop={onDrop}
                    boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                    arePiecesDraggable={!aiThinking && game.turn() === playerColor}
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
            <h3 className="font-semibold text-lg">Game Controls</h3>
            <Select
              value={playerColor}
              onValueChange={(value: 'w' | 'b') => {
                  if(!aiThinking) setPlayerColor(value);
              }}
              disabled={aiThinking || game.history().length > 0}
            >
              <SelectTrigger aria-label="Player Color">
                <SelectValue placeholder="Choose your color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="w">White</SelectItem>
                <SelectItem value="b">Black</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={startNewGame} disabled={aiThinking}>
              {aiThinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start New Game
            </Button>
             {game.history().length > 0 && <p className="text-xs text-muted-foreground">Start a new game to change colors.</p>}
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-lg">Status</h3>
            <p className="text-sm text-foreground/80 font-medium">{status}</p>
          </div>
          <Separator />
           <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-lg">AI Thoughts</h3>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md min-h-[80px]">
              {aiExplanation || 'The AI will share its thoughts here.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
